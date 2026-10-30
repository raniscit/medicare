import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("medicare.notifications")


class NotificationService:
    @staticmethod
    def send_email_notification(
        to_email: str,
        subject: str,
        body_text: str,
        patient_name: str = "Patient"
    ) -> bool:
        """
        Sends an email reminder/notification. In production, this integrates with SMTP/SendGrid/SES.
        Here it logs safely and confirms dispatch.
        """
        logger.info(f"[Email Notification Dispatch] To: {to_email} | Subject: {subject} | Patient: {patient_name}")
        # Always succeeds in development / demo mode
        return True

    @staticmethod
    def notify_caregiver(
        caregiver_email: str,
        patient_name: str,
        alert_type: str,
        details: str
    ) -> bool:
        subject = f"MediCare AI Alert: {patient_name} - {alert_type}"
        body = (
            f"Dear Caregiver,\n\n"
            f"This is an automated notification from MediCare AI regarding {patient_name}.\n\n"
            f"Alert: {alert_type}\n"
            f"Details: {details}\n\n"
            f"Please log in to your MediCare AI Caregiver portal to view full details.\n\n"
            f"Best regards,\nMediCare AI Team"
        )
        return NotificationService.send_email_notification(caregiver_email, subject, body, patient_name)

