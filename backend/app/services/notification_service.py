import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("medicare.notifications")


class NotificationService:
    @staticmethod
    def _send_email_raw(
        to_email: str,
        subject: str,
        body_text: str,
        html_content: Optional[str] = None
    ) -> bool:
        """
        Internal sender that delivers multipart plain/HTML email via SMTP if configured,
        or logs cleanly in development mode.
        """
        logger.info(f"📧 [Email Dispatch] To: {to_email} | Subject: {subject}")

        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
                msg["To"] = to_email

                part1 = MIMEText(body_text, "plain")
                msg.attach(part1)

                if html_content:
                    part2 = MIMEText(html_content, "html")
                    msg.attach(part2)

                if settings.SMTP_PORT == 465:
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
                    server.starttls()

                smtp_pwd = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()
                try:
                    server.login(settings.SMTP_USER, smtp_pwd)
                except Exception:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
                server.quit()
                logger.info(f"✅ Real email successfully delivered via SMTP to {to_email}")
                return True
            except Exception as e:
                logger.error(f"❌ SMTP delivery failed: {e}")
                return False

        logger.info(f"ℹ️ SMTP not configured in .env. Email simulated locally for {to_email}.")
        return True

    @staticmethod
    def send_email_notification(
        to_email: str,
        subject: str,
        body_text: str,
        patient_name: str = "Patient"
    ) -> bool:
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
        return NotificationService._send_email_raw(to_email, subject, body_text, html_content)

    @staticmethod
    def send_invitation_email(
        to_email: str,
        caregiver_name: Optional[str],
        patient_name: str,
        relationship: str,
        invitation_url: str,
        permissions: Dict[str, bool],
        expires_hours: int = 72
    ) -> bool:
        subject = f"{patient_name} invited you to join their MediCare AI care circle"
        recipient_display = caregiver_name or "Caregiver"

        perm_labels = {
            "can_view_reports": "View clinical reports, laboratory panels, and AI summaries",
            "can_view_medications": "Track active prescriptions, schedules, and instructions",
            "can_view_reminders": "View scheduled pill reminders and appointments",
            "can_manage_reminders": "Create, adjust, and confirm medication reminders",
            "can_view_trends": "Monitor health biomarkers and vitals trends",
            "can_receive_alerts": "Receive urgent alerts and missed dose notifications"
        }
        granted = [perm_labels[k] for k, v in permissions.items() if v and k in perm_labels]
        if not granted:
            granted = ["Access shared healthcare profile as designated caregiver"]

        perm_text_lines = "\n".join([f"• {g}" for g in granted])
        perm_html_lines = "".join([f"<li style='margin-bottom: 6px;'>{g}</li>" for g in granted])

        body_text = (
            f"Dear {recipient_display},\n\n"
            f"{patient_name} has invited you to join their care management circle on MediCare AI as their {relationship}.\n\n"
            f"Permissions granted to you:\n{perm_text_lines}\n\n"
            f"To accept this invitation and create your password, please click the link below:\n"
            f"{invitation_url}\n\n"
            f"Note: This secure invitation link will expire in {expires_hours} hours and can only be used once to activate your account.\n\n"
            f"Warm regards,\nMediCare AI Healthcare Team"
        )

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
            <div style="background: linear-gradient(135deg, #0F766E 0%, #115E59 100%); padding: 24px; border-radius: 12px; color: white; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MediCare AI</h1>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Family & Caregiver Health Management</p>
            </div>
            
            <div style="padding: 24px 8px; color: #1E293B; line-height: 1.6;">
                <h2 style="color: #0F766E; font-size: 18px; margin-top: 0;">Care Circle Invitation</h2>
                <p style="font-size: 14px;">Hello <strong>{recipient_display}</strong>,</p>
                <p style="font-size: 14px;">
                    <strong>{patient_name}</strong> has invited you to join their care circle on MediCare AI as their <strong>{relationship}</strong>.
                </p>
                
                <div style="background-color: #F8FAFC; border-left: 4px solid #0F766E; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0F766E;">
                        Permissions Granted to You:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
                        {perm_html_lines}
                    </ul>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="{invitation_url}" style="background-color: #0F766E; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
                        Accept Invitation & Create Password
                    </a>
                </div>

                <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
                    If the button above does not work, copy and paste this link into your browser:<br>
                    <a href="{invitation_url}" style="color: #0F766E; word-break: break-all;">{invitation_url}</a>
                </p>

                <p style="font-size: 12px; color: #DC2626; margin-top: 16px;">
                    ⏱️ This secure invitation link will expire in {expires_hours} hours and can only be used once to activate your account.
                </p>
            </div>

            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;">
            <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">
                MediCare AI Personal Healthcare Assistant • If you did not expect this invitation, you can safely ignore this email.
            </p>
        </div>
        """
        return NotificationService._send_email_raw(to_email, subject, body_text, html_body)

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
