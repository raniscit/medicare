from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, FamilyConnection
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = decode_access_token(token)
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return current_user


def check_patient_access(
    target_patient_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Ensures that current_user has legitimate access to target_patient_id's data.
    Access granted if:
    1. current_user is the target patient.
    2. current_user is an active caregiver accepted by the target patient.
    """
    if current_user.id == target_patient_id:
        return current_user

    # Check family connection
    connection = db.query(FamilyConnection).filter(
        FamilyConnection.patient_id == target_patient_id,
        (FamilyConnection.caregiver_id == current_user.id) | (FamilyConnection.caregiver_email.ilike(current_user.email)),
        FamilyConnection.status == "ACCEPTED"
    ).first()

    if connection:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: You do not have permission to view or manage this patient's medical records."
    )


def get_effective_patient_context(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Resolves the effective patient context for medical record queries.
    - If user is a patient, returns their own ID and full permissions.
    - If user is a caregiver, resolves to their connected patient and returns
      the permissions configured by the patient in FamilyConnection.
    - Allows switching between multiple connected patients via ?patient_id=X or X-Patient-Id header.
    """
    target_patient_id = None
    if request:
        param = request.query_params.get("patient_id")
        if param and param.isdigit():
            target_patient_id = int(param)
        else:
            header_val = request.headers.get("x-patient-id")
            if header_val and header_val.isdigit():
                target_patient_id = int(header_val)

    # 1. If target_patient_id matches current_user directly
    if target_patient_id and target_patient_id == current_user.id:
        return {
            "patient_id": current_user.id,
            "patient_user": current_user,
            "is_caregiver": False,
            "permissions": {
                "can_view_reports": True,
                "can_view_medications": True,
                "can_view_reminders": True,
                "can_view_trends": True,
                "can_manage_reminders": True,
                "can_receive_alerts": True,
            }
        }

    # 2. Check if user has active caregiver access
    caregiver_connections = db.query(FamilyConnection).filter(
        (FamilyConnection.caregiver_id == current_user.id) |
        (FamilyConnection.caregiver_email.ilike(current_user.email)),
        FamilyConnection.status == "ACCEPTED"
    )

    if target_patient_id:
        conn = caregiver_connections.filter(FamilyConnection.patient_id == target_patient_id).first()
        if not conn and target_patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view or manage this patient's medical records."
            )
        if conn:
            patient_user = db.query(User).filter(User.id == conn.patient_id).first()
            return {
                "patient_id": conn.patient_id,
                "patient_user": patient_user or current_user,
                "is_caregiver": True,
                "connection": conn,
                "permissions": conn.permissions_json or {}
            }

    # 3. If user has role="caregiver" or has caregiver connections and no explicit patient_id given
    if current_user.role == "caregiver":
        conn = caregiver_connections.order_by(FamilyConnection.accepted_at.desc(), FamilyConnection.id.desc()).first()
        if conn:
            patient_user = db.query(User).filter(User.id == conn.patient_id).first()
            return {
                "patient_id": conn.patient_id,
                "patient_user": patient_user or current_user,
                "is_caregiver": True,
                "connection": conn,
                "permissions": conn.permissions_json or {}
            }

    # 4. Default: patient viewing their own data
    return {
        "patient_id": current_user.id,
        "patient_user": current_user,
        "is_caregiver": False,
        "permissions": {
            "can_view_reports": True,
            "can_view_medications": True,
            "can_view_reminders": True,
            "can_view_trends": True,
            "can_manage_reminders": True,
            "can_receive_alerts": True,
        }
    }


def check_patient_permission(permission_key: str, context: Dict[str, Any]) -> bool:
    """
    Returns True if the user has permission to access the specific section.
    Patients always have access. Caregivers have access only if granted in permissions_json.
    """
    if not context.get("is_caregiver"):
        return True
    perms = context.get("permissions") or {}
    return bool(perms.get(permission_key, False))
