from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Reminder, MedicalDocument


class ReminderService:
    @staticmethod
    def extract_and_stage_reminders(
        db: Session,
        document: MedicalDocument,
        follow_ups: List[Dict[str, Any]]
    ) -> List[Reminder]:
        """
        Creates unconfirmed reminders extracted from documents for the patient to confirm.
        """
        staged = []
        now = datetime.utcnow()
        
        for f in follow_ups:
            # Estimate date: 2 weeks default if not parsed
            timeframe_str = f.get("timeframe", "2 weeks")
            days = 14
            if "week" in timeframe_str:
                num = int(''.join(filter(str.isdigit, timeframe_str)) or 2)
                days = num * 7
            elif "month" in timeframe_str:
                num = int(''.join(filter(str.isdigit, timeframe_str)) or 1)
                days = num * 30
            elif "day" in timeframe_str:
                days = int(''.join(filter(str.isdigit, timeframe_str)) or 7)

            target_date = now + timedelta(days=days)
            target_date = target_date.replace(hour=10, minute=0, second=0, microsecond=0)

            rem = Reminder(
                patient_id=document.patient_id,
                document_id=document.id,
                title=f.get("title", "Medical Follow-up"),
                description=f.get("description", f"Extracted from report {document.original_name}."),
                reminder_type="FOLLOW_UP",
                reminder_time=target_date,
                recurrence="NONE",
                status="PENDING",
                is_confirmed=False,  # Patient needs to confirm!
                extracted_from_doc=True
            )
            db.add(rem)
            staged.append(rem)

        db.commit()
        return staged

    @staticmethod
    def get_upcoming_notifications(db: Session, patient_id: int) -> List[Dict[str, Any]]:
        """
        Returns active notifications for the dashboard notification center.
        """
        now = datetime.utcnow()
        reminders = db.query(Reminder).filter(
            Reminder.patient_id == patient_id,
            Reminder.status == "PENDING"
        ).order_by(Reminder.reminder_time.asc()).all()

        notifications = []
        for r in reminders:
            is_unconfirmed = (not r.is_confirmed and r.extracted_from_doc)
            notifications.append({
                "id": r.id,
                "title": r.title,
                "description": r.description or "",
                "reminder_type": r.reminder_type,
                "time": r.reminder_time.isoformat(),
                "is_unconfirmed": is_unconfirmed,
                "status": r.status
            })
        return notifications

