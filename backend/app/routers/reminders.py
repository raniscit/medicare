from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, Reminder
from app.schemas.schemas import ReminderCreate, ReminderUpdate, ReminderResponse
from app.utils.dependencies import get_current_active_user, get_effective_patient_context, check_patient_permission, check_patient_access
from app.services.reminder_service import ReminderService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("", response_model=List[ReminderResponse])
def list_reminders(
    request: Request,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    context = get_effective_patient_context(request, current_user, db)
    if not check_patient_permission("can_view_reminders", context):
        return []
    query = db.query(Reminder).filter(Reminder.patient_id == context["patient_id"])
    if status_filter:
        query = query.filter(Reminder.status == status_filter.upper())
    return query.order_by(Reminder.reminder_time.asc()).all()


@router.post("", response_model=ReminderResponse)
def create_reminder(
    rem_in: ReminderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rem = Reminder(
        patient_id=current_user.id,
        document_id=rem_in.document_id,
        title=rem_in.title,
        description=rem_in.description,
        reminder_type=rem_in.reminder_type,
        reminder_time=rem_in.reminder_time,
        recurrence=rem_in.recurrence,
        status=rem_in.status,
        is_confirmed=rem_in.is_confirmed,
        extracted_from_doc=rem_in.extracted_from_doc
    )
    db.add(rem)
    db.commit()
    db.refresh(rem)

    # Trigger notification dispatch log
    NotificationService.send_email_notification(
        to_email=current_user.email,
        subject=f"MediCare AI Reminder Created: {rem.title}",
        body_text=f"Reminder scheduled for {rem.reminder_time.strftime('%Y-%m-%d %H:%M')}.",
        patient_name=current_user.full_name
    )

    return rem


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    rem_in: ReminderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.patient_id == current_user.id
    ).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    for field, value in rem_in.dict(exclude_unset=True).items():
        setattr(rem, field, value)

    db.commit()
    db.refresh(rem)
    return rem


@router.post("/{reminder_id}/complete", response_model=ReminderResponse)
def complete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.patient_id == current_user.id
    ).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    rem.status = "COMPLETED"
    db.commit()
    db.refresh(rem)
    return rem


@router.post("/{reminder_id}/confirm", response_model=ReminderResponse)
def confirm_extracted_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.patient_id == current_user.id
    ).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    rem.is_confirmed = True
    db.commit()
    db.refresh(rem)
    return rem


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rem = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.patient_id == current_user.id
    ).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    db.delete(rem)
    db.commit()
    return {"status": "success", "message": "Reminder deleted."}


@router.get("/notifications")
def get_notifications(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    context = get_effective_patient_context(request, current_user, db)
    if not check_patient_permission("can_view_reminders", context):
        return []
    return ReminderService.get_upcoming_notifications(db, context["patient_id"])

