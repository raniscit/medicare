from fastapi import Depends, HTTPException, status
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
        FamilyConnection.caregiver_id == current_user.id,
        FamilyConnection.status == "ACCEPTED"
    ).first()

    if connection:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: You do not have permission to view or manage this patient's medical records."
    )

