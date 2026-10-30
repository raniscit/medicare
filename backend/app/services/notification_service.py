import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from app.config import settings

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
        Sends an email notification.
        If SMTP credentials are provided in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD),
        delivers the email directly to the recipient inbox.
        Otherwise, logs the full email message for instant local demonstration.
        """
        logger.info(f"📧 [Email Dispatch] To: {to_email} | Subject: {subject} | Patient: {patient_name}")
        
        # Check if real SMTP server is configured
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = to_email

                # Plain text version
                part1 = MIMEText(body_text, "plain")
                msg.attach(part1)

                # HTML version
                html_content = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
                    <div style="background-color: #0F766E; padding: 15px; border-radius: 8px; color: white; text-align: center;">
                        <h2 style="margin: 0;">MediCare AI</h2>
                        <p style="margin: 4px 0 0; font-size: 13px;">Personal AI Healthcare Management</p>
                    </div>
                    <div style="padding: 20px 10px; color: #1E293B; line-height: 1.6;">
                        <h3 style="color: #0F766E; margin-top: 0;">{subject}</h3>
                        <p style="white-space: pre-line;">{body_text}</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                    <p style="font-size: 11px; color: #64748B; text-align: center;">
                        This is an automated notification from MediCare AI. Zero medical diagnoses are claimed.
                    </p>
                </div>
                """
                part2 = MIMEText(html_content, "html")
                msg.attach(part2)

                # Connect via SSL or TLS
                if settings.SMTP_PORT == 465:
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                    server.starttls()
                
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
                server.quit()
                logger.info(f"✅ Real email successfully delivered via SMTP to {to_email}")
                return True
            except Exception as e:
                logger.error(f"❌ SMTP delivery failed: {e}")
                return False

        # In local/demo mode without SMTP configured
        logger.info(f"ℹ️ SMTP not configured in .env. Email simulated locally for {to_email}.")
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
