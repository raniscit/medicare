from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, FamilyConnection
from app.schemas.schemas import (
    FamilyInviteCreate, FamilyConnectionResponse, FamilyPermissionUpdate
)
from app.utils.dependencies import get_current_active_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/family", tags=["Family & Caregivers"])


@router.get("/connections", response_model=List[FamilyConnectionResponse])
def list_connections(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    connections = db.query(FamilyConnection).filter(
        FamilyConnection.patient_id == current_user.id
    ).all()

    # Populate caregiver names if registered
    result = []
    for c in connections:
        caregiver_user = None
        if c.caregiver_id:
            caregiver_user = db.query(User).filter(User.id == c.caregiver_id).first()
        elif c.caregiver_email:
            caregiver_user = db.query(User).filter(User.email == c.caregiver_email).first()

        item = FamilyConnectionResponse(
            id=c.id,
            patient_id=c.patient_id,
            caregiver_email=c.caregiver_email,
            caregiver_id=c.caregiver_id,
            caregiver_name=caregiver_user.full_name if caregiver_user else "Invited Caregiver",
            relationship=c.relationship,
            role=c.role,
            status=c.status,
            permissions_json=c.permissions_json or {},
            invited_at=c.invited_at,
            accepted_at=c.accepted_at
        )
        result.append(item)
    return result


@router.post("/invite", response_model=FamilyConnectionResponse)
def invite_family_member(
    invite_in: FamilyInviteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if invite_in.caregiver_email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=400,
            detail="You cannot add your own email as a caregiver."
        )

    # Check if existing invite
    existing = db.query(FamilyConnection).filter(
        FamilyConnection.patient_id == current_user.id,
        FamilyConnection.caregiver_email == invite_in.caregiver_email
    ).first()

    if existing and existing.status in ["PENDING", "ACCEPTED"]:
        raise HTTPException(
            status_code=400,
            detail=f"An active connection or pending invite for {invite_in.caregiver_email} already exists."
        )

    caregiver_user = db.query(User).filter(User.email == invite_in.caregiver_email).first()

    conn = FamilyConnection(
        patient_id=current_user.id,
        caregiver_email=invite_in.caregiver_email,
        caregiver_id=caregiver_user.id if caregiver_user else None,
        relationship=invite_in.relationship,
        role=invite_in.role,
        status="PENDING",
        permissions_json=invite_in.permissions,
        invited_at=datetime.utcnow()
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)

    # Send invitation notification
    NotificationService.send_email_notification(
        to_email=invite_in.caregiver_email,
        subject=f"{current_user.full_name} invited you to MediCare AI",
        body_text=f"{current_user.full_name} has invited you to join their care circle as {invite_in.relationship}.",
        patient_name=current_user.full_name
    )

    return FamilyConnectionResponse(
        id=conn.id,
        patient_id=conn.patient_id,
        caregiver_email=conn.caregiver_email,
        caregiver_id=conn.caregiver_id,
        caregiver_name=caregiver_user.full_name if caregiver_user else "Invited Caregiver",
        relationship=conn.relationship,
        role=conn.role,
        status=conn.status,
        permissions_json=conn.permissions_json or {},
        invited_at=conn.invited_at,
        accepted_at=conn.accepted_at
    )


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
        FamilyConnection.id == connection_id,
        FamilyConnection.caregiver_email == current_user.email
    ).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    if accept:
        conn.status = "ACCEPTED"
        conn.caregiver_id = current_user.id
        conn.accepted_at = datetime.utcnow()
    else:
        conn.status = "REJECTED"

    db.commit()
    return {"status": "success", "connection_status": conn.status}

