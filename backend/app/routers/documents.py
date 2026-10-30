import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.entities import (
    User, MedicalDocument, ReportSummary, ExtractedMedicalParameter,
    Medication, DocumentChunk, Reminder
)
from app.schemas.schemas import DocumentResponse, DocumentDetailResponse
from app.utils.dependencies import get_current_active_user
from app.services.ocr_service import OCRService
from app.services.medical_extractor import MedicalExtractor
from app.services.report_summarizer import ReportSummarizer
from app.services.rag_service import RAGService
from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/documents", tags=["Medical Documents"])


def process_uploaded_document(db: Session, doc: MedicalDocument):
    """
    Executes the end-to-end document processing pipeline.
    """
    doc.status = "PROCESSING"
    db.commit()

    try:
        # 1. OCR / Text Extraction
        raw_text, page_count = OCRService.process_document(doc.file_path, doc.file_type)
        doc.raw_text = raw_text

        # 2. Detect Document Type
        text_lower = raw_text.lower()
        if "discharge" in text_lower:
            doc.document_type = "Hospital Discharge Summary"
        elif "prescription" in text_lower or "rx" in text_lower:
            doc.document_type = "Medical Prescription"
        elif "lipid" in text_lower:
            doc.document_type = "Lipid Profile"
        elif "cbc" in text_lower or "hemogram" in text_lower:
            doc.document_type = "Complete Blood Count (CBC)"
        elif "thyroid" in text_lower or "tsh" in text_lower:
            doc.document_type = "Thyroid Panel"
        elif "liver" in text_lower or "lft" in text_lower:
            doc.document_type = "Liver Function Test"
        elif "kidney" in text_lower or "renal" in text_lower or "creatinine" in text_lower:
            doc.document_type = "Kidney Function Test"
        else:
            doc.document_type = "Clinical Diagnostic Report"

        # 3. Extract Medical Parameters
        parameters_data = MedicalExtractor.extract_parameters(raw_text, doc.report_date)
        
        # Clear any existing parameters for this document
        db.query(ExtractedMedicalParameter).filter(
            ExtractedMedicalParameter.document_id == doc.id
        ).delete()

        saved_parameters = []
        for p in parameters_data:
            param = ExtractedMedicalParameter(
                document_id=doc.id,
                patient_id=doc.patient_id,
                parameter_name=p["parameter_name"],
                standard_name=p["standard_name"],
                numeric_value=p.get("numeric_value"),
                string_value=p.get("string_value"),
                unit=p.get("unit"),
                reference_range=p.get("reference_range"),
                min_reference=p.get("min_reference"),
                max_reference=p.get("max_reference"),
                status=p.get("status", "NORMAL"),
                simple_explanation=p.get("simple_explanation"),
                clinical_context=p.get("clinical_context"),
                test_date=doc.report_date or str(datetime.utcnow().date()),
                laboratory_name=doc.laboratory_name or "Diagnostic Laboratory"
            )
            db.add(param)
            saved_parameters.append(param)
        db.flush()

        # 4. Generate Structured Summary (Medical & Simple Views)
        summary_data = ReportSummarizer.generate_summary(
            doc_type=doc.document_type,
            report_date=doc.report_date or str(datetime.utcnow().date()),
            lab_name=doc.laboratory_name or "Diagnostic Laboratory",
            parameters=parameters_data,
            raw_text=raw_text
        )

        # Clear existing summary
        db.query(ReportSummary).filter(ReportSummary.document_id == doc.id).delete()
        
        summary = ReportSummary(
            document_id=doc.id,
            patient_id=doc.patient_id,
            document_type=summary_data["document_type"],
            report_date=summary_data["report_date"],
            laboratory_name=summary_data["laboratory_name"],
            important_findings=summary_data["important_findings"],
            normal_parameters=summary_data["normal_parameters"],
            abnormal_parameters=summary_data["abnormal_parameters"],
            observations=summary_data["observations"],
            doctor_recommendations=summary_data["doctor_recommendations"],
            follow_up_instructions=summary_data["follow_up_instructions"],
            precautions=summary_data["precautions"],
            simple_summary=summary_data["simple_summary"],
            medical_summary=summary_data["medical_summary"]
        )
        db.add(summary)

        # 5. Extract Prescriptions / Medications
        extracted_meds = MedicalExtractor.extract_medications(raw_text)
        for m in extracted_meds:
            # Check if medication already active
            existing_med = db.query(Medication).filter(
                Medication.patient_id == doc.patient_id,
                Medication.medicine_name.ilike(m["medicine_name"]),
                Medication.is_active == True
            ).first()
            if not existing_med:
                med = Medication(
                    patient_id=doc.patient_id,
                    document_id=doc.id,
                    medicine_name=m["medicine_name"],
                    dosage=m["dosage"],
                    frequency=m["frequency"],
                    duration=m["duration"],
                    timing_food=m["timing_food"],
                    special_instructions=m["special_instructions"],
                    precautions=m["precautions"],
                    dietary_recommendations=m["dietary_recommendations"],
                    is_active=True,
                    start_date=doc.report_date or str(datetime.utcnow().date())
                )
                db.add(med)

        # 6. Extract Follow-ups & Reminders (Awaiting patient confirmation)
        follow_ups = MedicalExtractor.extract_follow_ups(raw_text)
        ReminderService.extract_and_stage_reminders(db, doc, follow_ups)

        # 7. Index chunks in RAG Vector Store
        RAGService.chunk_and_index_document(db, doc)

        doc.status = "COMPLETED"
        db.commit()
    except Exception as e:
        db.rollback()
        doc.status = "FAILED"
        doc.error_message = str(e)
        db.commit()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    laboratory_name: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".png", ".jpg", ".jpeg", ".webp"]
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: PDF, PNG, JPG, JPEG, WEBP."
        )

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    unique_filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(save_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    doc = MedicalDocument(
        patient_id=current_user.id,
        file_name=unique_filename,
        original_name=file.filename,
        file_type=file_ext.replace(".", ""),
        file_path=save_path,
        file_size=file_size,
        document_type=document_type or "General Medical Report",
        laboratory_name=laboratory_name or "Diagnostic Laboratory",
        report_date=report_date or str(datetime.utcnow().date()),
        status="UPLOADED"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process document
    process_uploaded_document(db, doc)
    db.refresh(doc)

    return doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicalDocument).filter(MedicalDocument.patient_id == current_user.id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (MedicalDocument.original_name.ilike(search_filter)) |
            (MedicalDocument.document_type.ilike(search_filter)) |
            (MedicalDocument.laboratory_name.ilike(search_filter))
        )
    if category and category != "ALL":
        query = query.filter(MedicalDocument.document_type.ilike(f"%{category}%"))

    docs = query.order_by(MedicalDocument.upload_date.desc()).all()
    return docs


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.patient_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found.")
    return doc


@router.post("/{document_id}/reprocess", response_model=DocumentDetailResponse)
def reprocess_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.patient_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found.")

    process_uploaded_document(db, doc)
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.patient_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found.")

    # Remove stored physical file if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Cascading deletes will remove summary, parameters, and chunks
    db.delete(doc)
    db.commit()

    return {"status": "success", "message": f"Document '{doc.original_name}' deleted successfully."}

