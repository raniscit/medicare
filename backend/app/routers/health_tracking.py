from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    User, MedicalDocument, ExtractedMedicalParameter,
    Medication, Appointment, Reminder
)
from app.schemas.schemas import (
    HealthOverviewResponse, ParameterTrendResponse,
    ReportComparisonResponse, TimelineEventResponse, ExtractedParameterResponse
)
from app.utils.dependencies import get_current_active_user
from app.services.health_comparator import HealthComparator

router = APIRouter(prefix="/health", tags=["Health Tracking & Timeline"])


@router.get("/overview", response_model=HealthOverviewResponse)
def get_health_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    total_reports = db.query(MedicalDocument).filter(
        MedicalDocument.patient_id == current_user.id
    ).count()

    total_params = db.query(ExtractedMedicalParameter).filter(
        ExtractedMedicalParameter.patient_id == current_user.id
    ).count()

    active_meds = db.query(Medication).filter(
        Medication.patient_id == current_user.id,
        Medication.is_active == True
    ).count()

    upcoming_apps = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == "SCHEDULED"
    ).count()

    # Get latest report's abnormal parameters
    latest_doc = db.query(MedicalDocument).filter(
        MedicalDocument.patient_id == current_user.id,
        MedicalDocument.status == "COMPLETED"
    ).order_by(MedicalDocument.upload_date.desc()).first()

    abnormal_params = []
    if latest_doc:
        abnormal_params = db.query(ExtractedMedicalParameter).filter(
            ExtractedMedicalParameter.document_id == latest_doc.id,
            ExtractedMedicalParameter.status.in_(["LOW", "HIGH", "ABNORMAL"])
        ).all()

    # Generate overarching AI Insights
    ai_insights = []
    # Check HbA1c trend
    hba1c_trend = HealthComparator.get_parameter_trend(db, current_user.id, "HbA1c")
    if hba1c_trend["data_points"] and len(hba1c_trend["data_points"]) >= 2:
        ai_insights.append(hba1c_trend["ai_insight"])
        
    # Check Hemoglobin trend
    hb_trend = HealthComparator.get_parameter_trend(db, current_user.id, "Hemoglobin")
    if hb_trend["data_points"] and len(hb_trend["data_points"]) >= 2:
        ai_insights.append(hb_trend["ai_insight"])

    if not ai_insights:
        ai_insights.append(
            "Welcome to MediCare AI. Your health metrics are tracked across all uploaded documents. "
            "Upload multiple lab reports over time to observe multi-month physiological trends."
        )

    return {
        "total_reports": total_reports,
        "total_parameters_tracked": total_params,
        "abnormal_parameters_count": len(abnormal_params),
        "upcoming_appointments_count": upcoming_apps,
        "active_medications_count": active_meds,
        "latest_abnormal_items": abnormal_params,
        "ai_health_insights": ai_insights
    }


@router.get("/trends/{standard_name}", response_model=ParameterTrendResponse)
def get_parameter_trend(
    standard_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    trend = HealthComparator.get_parameter_trend(db, current_user.id, standard_name)
    return trend


@router.get("/compare", response_model=ReportComparisonResponse)
def compare_reports(
    report_1_id: int = Query(...),
    report_2_id: int = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    comparison = HealthComparator.compare_two_reports(
        db=db,
        patient_id=current_user.id,
        report_1_id=report_1_id,
        report_2_id=report_2_id
    )
    return comparison


@router.get("/timeline", response_model=List[TimelineEventResponse])
def get_health_timeline(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    events = []

    # Documents
    docs = db.query(MedicalDocument).filter(
        MedicalDocument.patient_id == current_user.id
    ).all()
    for d in docs:
        events.append({
            "id": f"doc_{d.id}",
            "event_type": "REPORT",
            "date": d.report_date or str(d.upload_date.date()),
            "title": d.original_name,
            "subtitle": f"{d.document_type} - {d.laboratory_name or 'Diagnostic Facility'}",
            "description": f"Status: {d.status}. Processed for health tracking.",
            "status_tag": d.status,
            "reference_id": d.id
        })

    # Appointments
    apps = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).all()
    for a in apps:
        events.append({
            "id": f"app_{a.id}",
            "event_type": "APPOINTMENT",
            "date": str(a.appointment_date.date()),
            "title": f"Consultation with {a.doctor_name}",
            "subtitle": f"{a.specialty or 'Physician'} ({a.hospital_or_clinic or 'Clinic'})",
            "description": a.reason or "Scheduled medical review.",
            "status_tag": a.status,
            "reference_id": a.id
        })

    # Active Medications
    meds = db.query(Medication).filter(
        Medication.patient_id == current_user.id
    ).all()
    for m in meds:
        events.append({
            "id": f"med_{m.id}",
            "event_type": "MEDICATION_START",
            "date": m.start_date or str(m.created_at.date()),
            "title": f"Prescription: {m.medicine_name} {m.dosage}",
            "subtitle": f"{m.frequency} ({m.timing_food or 'As advised'})",
            "description": m.special_instructions or "Active medication regimen.",
            "status_tag": "ACTIVE" if m.is_active else "DISCONTINUED",
            "reference_id": m.id
        })

    # Sort descending by date
    events.sort(key=lambda x: x["date"], reverse=True)
    return events

