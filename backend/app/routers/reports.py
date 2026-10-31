from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, MedicalDocument, ReportSummary
from app.schemas.schemas import ReportSummaryResponse
from app.utils.dependencies import get_current_active_user, get_effective_patient_context, check_patient_permission, check_patient_access

router = APIRouter(prefix="/reports", tags=["Report Summaries"])


@router.get("/{document_id}/summary", response_model=ReportSummaryResponse)
def get_report_summary(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Report document not found.")
    check_patient_access(doc.patient_id, current_user, db)
    context = get_effective_patient_context(request, current_user, db)
    if not check_patient_permission("can_view_reports", context):
        raise HTTPException(status_code=403, detail="You do not have permission to view report summaries.")
    if not doc:
        raise HTTPException(status_code=404, detail="Report document not found.")

    summary = db.query(ReportSummary).filter(ReportSummary.document_id == document_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated for this report.")
    return summary


@router.get("/{document_id}/download")
def download_summary(
    document_id: int,
    view_mode: str = "simple",  # "simple" or "medical"
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.patient_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Report document not found.")

    summary = db.query(ReportSummary).filter(ReportSummary.document_id == document_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")

    if view_mode.lower() == "medical":
        content = (
            f"====================================================\n"
            f"MEDICARE AI - CLINICAL REPORT SUMMARY (MEDICAL VIEW)\n"
            f"====================================================\n\n"
            f"Patient: {current_user.full_name}\n"
            f"Document: {doc.original_name}\n"
            f"Report Date: {summary.report_date or 'N/A'}\n"
            f"Diagnostic Lab: {summary.laboratory_name or 'N/A'}\n\n"
            f"{summary.medical_summary}\n\n"
            f"RECOMMENDATIONS:\n" + "\n".join([f"- {r}" for r in (summary.doctor_recommendations or [])]) + "\n\n"
            f"PRECAUTIONS:\n" + "\n".join([f"- {p}" for r in (summary.precautions or [])]) + "\n\n"
            f"Disclaimer: This summary is generated for personal reference. Consult a licensed physician for diagnosis and medical decisions."
        )
        filename = f"medical_summary_{doc.id}.txt"
    else:
        content = (
            f"====================================================\n"
            f"MEDICARE AI - PERSONAL HEALTH REPORT SUMMARY (SIMPLE VIEW)\n"
            f"====================================================\n\n"
            f"Hello {current_user.full_name},\n"
            f"Here is your easy-to-understand summary of: {doc.original_name}\n"
            f"Date of Report: {summary.report_date or 'Recent'}\n\n"
            f"{summary.simple_summary}\n\n"
            f"KEY FINDINGS:\n" + "\n".join([f"• {f}" for f in (summary.important_findings or [])]) + "\n\n"
            f"FOLLOW-UP INSTRUCTIONS:\n" + "\n".join([f"• {i}" for i in (summary.follow_up_instructions or [])]) + "\n\n"
            f"PRECAUTIONS & WELLNESS:\n" + "\n".join([f"• {p}" for p in (summary.precautions or [])]) + "\n\n"
            f"Disclaimer: Always consult your doctor before modifying medication dosages or making treatment changes."
        )
        filename = f"simple_summary_{doc.id}.txt"

    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

