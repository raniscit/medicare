from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Appointment
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.utils.dependencies import get_current_active_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).order_by(Appointment.appointment_date.asc()).all()


@router.post("", response_model=AppointmentResponse)
def create_appointment(
    app_in: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    app = Appointment(
        patient_id=current_user.id,
        document_id=app_in.document_id,
        doctor_name=app_in.doctor_name,
        specialty=app_in.specialty,
        hospital_or_clinic=app_in.hospital_or_clinic,
        appointment_date=app_in.appointment_date,
        reason=app_in.reason,
        status=app_in.status,
        notes=app_in.notes
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    app_in: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    for field, value in app_in.dict(exclude_unset=True).items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)
    return app


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    db.delete(app)
    db.commit()
    return {"status": "success", "message": "Appointment deleted."}

