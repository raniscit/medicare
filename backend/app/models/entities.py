from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient")  # patient, caregiver, doctor, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="patient", cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(50), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    phone_number = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    chronic_conditions = Column(Text, nullable=True)  # Comma separated or description
    known_allergies = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, png, jpg, jpeg
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    document_type = Column(String(100), default="General Medical Report")
    laboratory_name = Column(String(255), nullable=True)
    report_date = Column(String(50), nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="UPLOADED")  # UPLOADED, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)

    # Relationships
    patient = relationship("User", back_populates="documents")
    summary = relationship("ReportSummary", back_populates="document", uselist=False, cascade="all, delete-orphan")
    parameters = relationship("ExtractedMedicalParameter", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class ReportSummary(Base):
    __tablename__ = "report_summaries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False)
    report_date = Column(String(50), nullable=True)
    laboratory_name = Column(String(255), nullable=True)
    
    # Structured summary fields
    important_findings = Column(JSON, default=list)        # list of strings
    normal_parameters = Column(JSON, default=list)         # list of strings
    abnormal_parameters = Column(JSON, default=list)       # list of strings
    observations = Column(JSON, default=list)              # list of strings
    doctor_recommendations = Column(JSON, default=list)    # list of strings
    follow_up_instructions = Column(JSON, default=list)    # list of strings
    precautions = Column(JSON, default=list)               # list of strings
    
    # Views
    simple_summary = Column(Text, nullable=False)
    medical_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("MedicalDocument", back_populates="summary")


class ExtractedMedicalParameter(Base):
    __tablename__ = "extracted_medical_parameters"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    parameter_name = Column(String(255), nullable=False, index=True)
    standard_name = Column(String(100), nullable=False, index=True)  # e.g., 'Hemoglobin', 'HbA1c', 'Fasting Blood Sugar'
    numeric_value = Column(Float, nullable=True)
    string_value = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    min_reference = Column(Float, nullable=True)
    max_reference = Column(Float, nullable=True)
    status = Column(String(50), default="NORMAL")  # LOW, NORMAL, HIGH, ABNORMAL
    simple_explanation = Column(Text, nullable=True)
    clinical_context = Column(Text, nullable=True)
    test_date = Column(String(50), nullable=True)
    laboratory_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("MedicalDocument", back_populates="parameters")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    
    medicine_name = Column(String(255), nullable=False, index=True)
    dosage = Column(String(100), nullable=False)           # e.g., '500 mg'
    frequency = Column(String(100), nullable=False)        # e.g., 'Twice daily', 'Once at bedtime'
    duration = Column(String(100), nullable=True)          # e.g., '14 days', 'Ongoing'
    timing_food = Column(String(100), nullable=True)       # 'Before meals', 'After meals', 'With food'
    special_instructions = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    dietary_recommendations = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_time = Column(DateTime, nullable=False)
    taken_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING")  # TAKEN, MISSED, SKIPPED, PENDING
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    medication = relationship("Medication", back_populates="logs")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reminder_type = Column(String(50), default="MEDICATION")  # MEDICATION, APPOINTMENT, TEST, FOLLOW_UP, CHECKUP
    reminder_time = Column(DateTime, nullable=False)
    recurrence = Column(String(50), default="NONE")           # NONE, DAILY, WEEKLY, MONTHLY
    status = Column(String(50), default="PENDING")            # PENDING, COMPLETED, CANCELLED
    is_confirmed = Column(Boolean, default=True)
    extracted_from_doc = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="reminders")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    
    doctor_name = Column(String(255), nullable=False)
    specialty = Column(String(100), nullable=True)
    hospital_or_clinic = Column(String(255), nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(50), default="SCHEDULED")  # SCHEDULED, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="appointments")


class FamilyConnection(Base):
    __tablename__ = "family_connections"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caregiver_email = Column(String(255), nullable=False, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    relationship = Column(String(100), nullable=False)       # e.g., 'Spouse', 'Son', 'Daughter', 'Caregiver'
    role = Column(String(50), default="CAREGIVER")           # PATIENT, CAREGIVER, READ_ONLY
    status = Column(String(50), default="PENDING")           # PENDING, ACCEPTED, REJECTED, REVOKED
    # Permissions json: {"can_view_reports": true, "can_view_medications": true, "can_view_reminders": true, "can_receive_alerts": true}
    permissions_json = Column(JSON, default=dict)
    invited_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="Health Conversation")
    language = Column(String(20), default="en")  # en, hi
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    sources_json = Column(JSON, default=list)  # list of { "document_name": "...", "page": 1, "excerpt": "..." }
    language = Column(String(20), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True)  # vector representation as list of floats
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("MedicalDocument", back_populates="chunks")

