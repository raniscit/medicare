from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.config import settings
from app.models.entities import User, PatientProfile, FamilyConnection
from app.schemas.schemas import (
    InvitationValidateResponse, CreatePasswordFromInviteRequest, CreatePasswordFromInviteResponse,
    UserCreate, UserResponse, UserLogin, TokenResponse,
    PatientProfileBase, PatientProfileResponse, ConnectedPatientInfo
)
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.utils.dependencies import get_current_user, get_current_active_user
from app.services.demo_data_service import seed_demo_data

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "patient",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize blank patient profile
    profile = PatientProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login-json", response_model=TokenResponse)
def login_json(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """
    Instantly logs in the pre-configured Demo Patient Alex Johnson with rich synthetic data.
    """
    user = db.query(User).filter(User.email == settings.DEMO_USER_EMAIL).first()
    if not user:
        user = seed_demo_data(db)

    access_token = create_access_token(user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    connections = db.query(FamilyConnection).filter(
        (FamilyConnection.caregiver_id == current_user.id) |
        (FamilyConnection.caregiver_email.ilike(current_user.email)),
        FamilyConnection.status == "ACCEPTED"
    ).all()

    connected_patients = []
    for c in connections:
        patient = db.query(User).filter(User.id == c.patient_id).first()
        if patient:
            connected_patients.append(ConnectedPatientInfo(
                patient_id=patient.id,
                patient_name=patient.full_name or "Patient",
                patient_email=patient.email,
                relationship=c.relationship,
                permissions=c.permissions_json or {},
                connection_id=c.id
            ))

    res = UserResponse.from_orm(current_user)
    res.connected_patients = connected_patients
    res.active_patient_id = connected_patients[0].patient_id if connected_patients else None
    return res


@router.put("/profile", response_model=PatientProfileResponse)
def update_profile(
    profile_in: PatientProfileBase,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/validate-invitation", response_model=InvitationValidateResponse)
def validate_invitation_alias(
    token: str,
    db: Session = Depends(get_db)
):
    from app.routers.family import validate_invitation
    return validate_invitation(token=token, db=db)


@router.post("/create-password", response_model=CreatePasswordFromInviteResponse)
@router.post("/create-password-from-invite", response_model=CreatePasswordFromInviteResponse)
def create_password_alias(
    payload: CreatePasswordFromInviteRequest,
    db: Session = Depends(get_db)
):
    from app.routers.family import create_password_from_invite
    return create_password_from_invite(payload=payload, db=db)
