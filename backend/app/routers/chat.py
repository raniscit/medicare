from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import User, ChatSession, ChatMessage
from app.schemas.schemas import (
    ChatSessionResponse, ChatMessageResponse, ChatQueryRequest
)
from app.utils.dependencies import get_current_active_user, get_effective_patient_context, check_patient_permission, check_patient_access
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["AI Health Assistant"])


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    context = get_effective_patient_context(request, current_user, db)
    sessions = db.query(ChatSession).filter(
        ChatSession.patient_id == context["patient_id"]
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    title: Optional[str] = "Health Discussion",
    language: Optional[str] = "en",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        patient_id=current_user.id,
        title=title or "Health Discussion",
        language=language or "en"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.patient_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()
    return messages


@router.post("/query")
def submit_query(
    query_in: ChatQueryRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    context = get_effective_patient_context(request, current_user, db)
    result = RAGService.answer_query(
        db=db,
        patient_id=context["patient_id"],
        query=query_in.message,
        session_id=query_in.session_id,
        language=query_in.language
    )
    return result

def _unused_submit_query():
    """
    RAG Pipeline Endpoint:
    Processes user health question against their uploaded medical records and clinical history.
    """
    result = RAGService.answer_query(
        db=db,
        patient_id=current_user.id,
        query=query_in.message,
        session_id=query_in.session_id,
        language=query_in.language
    )
    return result


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.patient_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Conversation session deleted."}

