import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.entities import User, PatientProfile, FamilyConnection
from app.schemas.schemas import (
    FamilyInviteCreate, FamilyConnectionResponse, FamilyPermissionUpdate,
    InvitationValidateResponse, CreatePasswordFromInviteRequest, CreatePasswordFromInviteResponse
)
from app.utils.dependencies import get_current_active_user
from app.utils.security import get_password_hash, create_access_token
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/family", tags=["Family & Caregivers"])


def _build_connection_response(c: FamilyConnection, db: Session, base_url: str, current_user_id: Optional[int] = None) -> FamilyConnectionResponse:
    caregiver_user = None
    if c.caregiver_id:
        caregiver_user = db.query(User).filter(User.id == c.caregiver_id).first()
    elif c.caregiver_email:
        caregiver_user = db.query(User).filter(User.email.ilike(c.caregiver_email)).first()

    patient_user = db.query(User).filter(User.id == c.patient_id).first()

    is_expired = bool(c.token_expires_at and c.token_expires_at < datetime.utcnow() and c.status == "PENDING")
    invitation_url = None
    if c.invitation_token:
        invitation_url = f"{base_url.rstrip('/')}/create-password?token={c.invitation_token}"

    is_caregiver_view = bool(current_user_id and current_user_id != c.patient_id)

    return FamilyConnectionResponse(
        id=c.id,
        patient_id=c.patient_id,
        caregiver_email=c.caregiver_email,
        caregiver_id=c.caregiver_id,
        caregiver_name=c.caregiver_name or (caregiver_user.full_name if caregiver_user else "Invited Caregiver"),
        patient_name=patient_user.full_name if patient_user else "Patient",
        patient_email=patient_user.email if patient_user else None,
        is_caregiver_view=is_caregiver_view,
        relationship=c.relationship,
        role=c.role,
        status=c.status,
        permissions_json=c.permissions_json or {},
        invited_at=c.invited_at,
        accepted_at=c.accepted_at,
        invitation_token=c.invitation_token,
        invitation_url=invitation_url,
        token_expires_at=c.token_expires_at,
        is_expired=is_expired,
        redirect_url=c.redirect_url or "/dashboard"
    )


def _get_base_url(request: Request) -> str:
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        return f"{parsed.scheme}://{parsed.netloc}"
    return settings.FRONTEND_URL.rstrip("/")


@router.get("/connections", response_model=List[FamilyConnectionResponse])
def list_connections(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    connections = db.query(FamilyConnection).filter(
        (FamilyConnection.patient_id == current_user.id) |
        (FamilyConnection.caregiver_id == current_user.id) |
        (FamilyConnection.caregiver_email.ilike(current_user.email))
    ).order_by(FamilyConnection.invited_at.desc()).all()

    base_url = _get_base_url(request)
    return [_build_connection_response(c, db, base_url, current_user.id) for c in connections]


@router.post("/invite", response_model=FamilyConnectionResponse)
def invite_family_member(
    invite_in: FamilyInviteCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    caregiver_email_clean = invite_in.caregiver_email.lower().strip()
    if caregiver_email_clean == current_user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add your own email address as a caregiver."
        )

    # Check if an active connection already exists
    existing = db.query(FamilyConnection).filter(
        FamilyConnection.patient_id == current_user.id,
        FamilyConnection.caregiver_email.ilike(caregiver_email_clean)
    ).first()

    if existing and existing.status == "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{caregiver_email_clean} is already an accepted caregiver in your circle."
        )

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
    base_url = _get_base_url(request)
    invitation_url = f"{base_url}/create-password?token={token}"

    caregiver_user = db.query(User).filter(User.email.ilike(caregiver_email_clean)).first()

    if existing and existing.status in ["PENDING", "REJECTED", "REVOKED"]:
        # Update existing record with fresh invitation
        existing.caregiver_name = invite_in.caregiver_name or existing.caregiver_name
        existing.relationship = invite_in.relationship
        existing.role = invite_in.role
        existing.status = "PENDING"
        existing.permissions_json = invite_in.permissions
        existing.invited_at = datetime.utcnow()
        existing.accepted_at = None
        existing.invitation_token = token
        existing.token_expires_at = expires_at
        existing.is_used = False
        existing.redirect_url = invite_in.redirect_url or "/dashboard"
        conn = existing
    else:
        conn = FamilyConnection(
            patient_id=current_user.id,
            caregiver_email=caregiver_email_clean,
            caregiver_name=invite_in.caregiver_name,
            caregiver_id=caregiver_user.id if caregiver_user else None,
            relationship=invite_in.relationship,
            role=invite_in.role,
            status="PENDING",
            permissions_json=invite_in.permissions,
            invited_at=datetime.utcnow(),
            invitation_token=token,
            token_expires_at=expires_at,
            is_used=False,
            redirect_url=invite_in.redirect_url or "/dashboard"
        )
        db.add(conn)

    db.commit()
    db.refresh(conn)

    # Dispatch email
    NotificationService.send_invitation_email(
        to_email=caregiver_email_clean,
        caregiver_name=invite_in.caregiver_name or (caregiver_user.full_name if caregiver_user else None),
        patient_name=current_user.full_name,
        relationship=invite_in.relationship,
        invitation_url=invitation_url,
        permissions=invite_in.permissions,
        expires_hours=settings.INVITATION_TOKEN_EXPIRE_HOURS
    )

    return _build_connection_response(conn, db, base_url)


@router.get("/invitations/validate", response_model=InvitationValidateResponse)
def validate_invitation(
    token: str = Query(..., description="Invitation token to validate"),
    db: Session = Depends(get_db)
):
    token_clean = (token or "").strip()
    if not token_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing invitation token."
        )

    conn = db.query(FamilyConnection).filter(
        FamilyConnection.invitation_token == token_clean
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation link. This invitation token does not exist."
        )

    if conn.is_used or conn.status == "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been accepted and activated. Please log in directly with your password."
        )

    if conn.status in ["REVOKED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation is no longer active. Please contact the patient to send a fresh invitation."
        )

    if conn.token_expires_at and conn.token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invitation link has expired. Invitations are valid for 72 hours. Please request a new invitation."
        )

    patient = db.query(User).filter(User.id == conn.patient_id).first()
    patient_name = patient.full_name if patient else "A MediCare AI Patient"

    return InvitationValidateResponse(
        valid=True,
        connection_id=conn.id,
        caregiver_email=conn.caregiver_email,
        caregiver_name=conn.caregiver_name,
        patient_id=conn.patient_id,
        patient_name=patient_name,
        relationship=conn.relationship,
        role=conn.role,
        permissions_json=conn.permissions_json or {},
        redirect_url=conn.redirect_url or "/dashboard",
        invited_at=conn.invited_at,
        token_expires_at=conn.token_expires_at,
        is_expired=False,
        is_used=False,
        message="Invitation token is valid and ready for password creation."
    )


@router.post("/invitations/create-password", response_model=CreatePasswordFromInviteResponse)
def create_password_from_invite(
    payload: CreatePasswordFromInviteRequest,
    db: Session = Depends(get_db)
):
    token_clean = (payload.token or "").strip()
    password_clean = (payload.password or "").strip()

    if not token_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing invitation token."
        )

    if len(password_clean) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    conn = db.query(FamilyConnection).filter(
        FamilyConnection.invitation_token == token_clean
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token."
        )

    if conn.is_used or conn.status == "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been accepted and activated. Please log in directly."
        )

    if conn.status in ["REVOKED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation is no longer active."
        )

    if conn.token_expires_at and conn.token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invitation link has expired. Please request a new invitation."
        )

    caregiver_email = conn.caregiver_email.lower().strip()
    hashed_pwd = get_password_hash(password_clean)
    user = db.query(User).filter(User.email.ilike(caregiver_email)).first()

    name_to_use = (payload.full_name or "").strip() or conn.caregiver_name or "Caregiver"

    if not user:
        user = User(
            email=caregiver_email,
            hashed_password=hashed_pwd,
            full_name=name_to_use,
            role="caregiver",
            is_active=True
        )
        db.add(user)
        db.flush()

        profile = PatientProfile(
            user_id=user.id,
            emergency_contact_phone="Not specified"
        )
        db.add(profile)
    else:
        user.hashed_password = hashed_pwd
        user.is_active = True
        if (payload.full_name or "").strip():
            user.full_name = payload.full_name.strip()
        elif conn.caregiver_name and not user.full_name:
            user.full_name = conn.caregiver_name

    # Invalidate token for single-use & mark ACCEPTED
    conn.caregiver_id = user.id
    conn.status = "ACCEPTED"
    conn.accepted_at = datetime.utcnow()
    conn.is_used = True

    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.email)

    return CreatePasswordFromInviteResponse(
        status="success",
        message="Account created and activated successfully. Welcome to MediCare AI!",
        access_token=access_token,
        token_type="bearer",
        user=user,
        redirect_url=conn.redirect_url or "/dashboard"
    )


@router.post("/connections/{connection_id}/resend", response_model=FamilyConnectionResponse)
def resend_connection_invite(
    connection_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conn = db.query(FamilyConnection).filter(
        FamilyConnection.id == connection_id,
        FamilyConnection.patient_id == current_user.id
    ).first()

    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caregiver invitation record not found."
        )

    if conn.status == "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This connection has already been accepted by the caregiver."
        )

    new_token = secrets.token_urlsafe(32)
    conn.invitation_token = new_token
    conn.token_expires_at = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
    conn.is_used = False
    conn.status = "PENDING"
    conn.invited_at = datetime.utcnow()

    db.commit()
    db.refresh(conn)

    base_url = _get_base_url(request)
    invitation_url = f"{base_url}/create-password?token={new_token}"

    caregiver_user = db.query(User).filter(User.email.ilike(conn.caregiver_email)).first()
    caregiver_name = conn.caregiver_name or (caregiver_user.full_name if caregiver_user else None)

    NotificationService.send_invitation_email(
        to_email=conn.caregiver_email,
        caregiver_name=caregiver_name,
        patient_name=current_user.full_name,
        relationship=conn.relationship,
        invitation_url=invitation_url,
        permissions=conn.permissions_json or {},
        expires_hours=settings.INVITATION_TOKEN_EXPIRE_HOURS
    )

    return _build_connection_response(conn, db, base_url)


@router.put("/connections/{connection_id}/permissions")
def update_permissions(
    connection_id: int,
    perm_in: FamilyPermissionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conn = db.query(FamilyConnection).filter(
        FamilyConnection.id == connection_id,
        FamilyConnection.patient_id == current_user.id
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Caregiver connection not found.")

    if perm_in.role:
        conn.role = perm_in.role
    conn.permissions_json = perm_in.permissions
    db.commit()
    return {"status": "success", "message": "Permissions updated successfully."}


@router.post("/connections/{connection_id}/accept")
def accept_connection(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conn = db.query(FamilyConnection).filter(
        FamilyConnection.id == connection_id
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Caregiver connection not found.")

    conn.status = "ACCEPTED"
    conn.accepted_at = datetime.utcnow()
    conn.is_used = True
    db.commit()
    return {"status": "success", "message": f"Invitation for {conn.caregiver_email} marked as accepted."}


@router.post("/connections/{connection_id}/revoke")
def revoke_connection(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conn = db.query(FamilyConnection).filter(
        FamilyConnection.id == connection_id,
        FamilyConnection.patient_id == current_user.id
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Caregiver connection not found.")

    conn.status = "REVOKED"
    db.commit()
    return {"status": "success", "message": f"Access revoked for {conn.caregiver_email}."}


@router.post("/respond-invite")
def respond_invite(
    connection_id: int,
    accept: bool,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conn = db.query(FamilyConnection).filter(
        FamilyConnection.id == connection_id
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    if accept:
        conn.status = "ACCEPTED"
        conn.accepted_at = datetime.utcnow()
        conn.is_used = True
    else:
        conn.status = "REJECTED"

    db.commit()
    return {"status": "success", "connection_status": conn.status}
