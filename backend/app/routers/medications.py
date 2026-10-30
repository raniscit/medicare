from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Medication, MedicationLog
from app.schemas.schemas import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    MedicationLogCreate, MedicationLogResponse
)
from app.utils.dependencies import get_current_active_user

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.get("", response_model=List[MedicationResponse])
def list_medications(
    active_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Medication).filter(Medication.patient_id == current_user.id)
    if active_only:
        query = query.filter(Medication.is_active == True)
    meds = query.order_by(Medication.created_at.desc()).all()
    return meds


@router.post("", response_model=MedicationResponse)
def create_medication(
    med_in: MedicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    med = Medication(
        patient_id=current_user.id,
        document_id=med_in.document_id,
        medicine_name=med_in.medicine_name,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        duration=med_in.duration,
        timing_food=med_in.timing_food,
        special_instructions=med_in.special_instructions,
        precautions=med_in.precautions,
        dietary_recommendations=med_in.dietary_recommendations,
        is_active=med_in.is_active,
        start_date=med_in.start_date or str(datetime.utcnow().date()),
        end_date=med_in.end_date
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    med_in: MedicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    for field, value in med_in.dict(exclude_unset=True).items():
        setattr(med, field, value)

    db.commit()
    db.refresh(med)
    return med


@router.delete("/{medication_id}")
def delete_medication(
    medication_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    db.delete(med)
    db.commit()
    return {"status": "success", "message": "Medication removed successfully."}


@router.post("/{medication_id}/log", response_model=MedicationLogResponse)
def log_medication_dose(
    medication_id: int,
    log_in: MedicationLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    log = MedicationLog(
        medication_id=medication_id,
        patient_id=current_user.id,
        scheduled_time=log_in.scheduled_time,
        taken_time=log_in.taken_time or (datetime.utcnow() if log_in.status == "TAKEN" else None),
        status=log_in.status,
        notes=log_in.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/schedule/today")
def get_today_medication_schedule(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    active_meds = db.query(Medication).filter(
        Medication.patient_id == current_user.id,
        Medication.is_active == True
    ).all()

    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day)
    
    # Fetch today's logs
    today_logs = db.query(MedicationLog).filter(
        MedicationLog.patient_id == current_user.id,
        MedicationLog.scheduled_time >= start_of_day
    ).all()

    log_map = {l.medication_id: l for l in today_logs}

    schedule = []
    for m in active_meds:
        log = log_map.get(m.id)
        schedule.append({
            "medication_id": m.id,
            "medicine_name": m.medicine_name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "timing_food": m.timing_food,
            "status": log.status if log else "PENDING",
            "logged_at": log.taken_time.isoformat() if (log and log.taken_time) else None,
            "notes": log.notes if log else None
        })

    return schedule

