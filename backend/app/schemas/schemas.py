from pydantic import BaseModel, Field, model_validator
try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr
except (ImportError, Exception):
    EmailStr = str  # Fallback so server never crashes if email-validator is missing
from typing import Optional, List, Dict, Any
from datetime import datetime


# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Optional[str] = "patient"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PatientProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    chronic_conditions: Optional[str] = None
    known_allergies: Optional[str] = None


class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectedPatientInfo(BaseModel):
    patient_id: int
    patient_name: str
    patient_email: str
    relationship: str
    permissions: Dict[str, Any] = {}
    connection_id: int


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    profile: Optional[PatientProfileResponse] = None
    connected_patients: List[ConnectedPatientInfo] = []
    active_patient_id: Optional[int] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Document & Summary Schemas ---
class ParameterBase(BaseModel):
    parameter_name: str
    standard_name: str
    numeric_value: Optional[float] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    min_reference: Optional[float] = None
    max_reference: Optional[float] = None
    status: str = "NORMAL"
    simple_explanation: Optional[str] = None
    clinical_context: Optional[str] = None
    test_date: Optional[str] = None
    laboratory_name: Optional[str] = None


class ExtractedParameterResponse(ParameterBase):
    id: int
    document_id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReportSummaryResponse(BaseModel):
    id: int
    document_id: int
    patient_id: int
    document_type: str
    report_date: Optional[str] = None
    laboratory_name: Optional[str] = None
    important_findings: List[str] = []
    normal_parameters: List[str] = []
    abnormal_parameters: List[str] = []
    observations: List[str] = []
    doctor_recommendations: List[str] = []
    follow_up_instructions: List[str] = []
    precautions: List[str] = []
    simple_summary: str
    medical_summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    patient_id: int
    file_name: str
    original_name: str
    file_type: str
    file_size: int
    document_type: str
    laboratory_name: Optional[str] = None
    report_date: Optional[str] = None
    upload_date: datetime
    status: str
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    raw_text: Optional[str] = None
    summary: Optional[ReportSummaryResponse] = None
    parameters: List[ExtractedParameterResponse] = []

    class Config:
        from_attributes = True


# --- Health Tracking & Comparison Schemas ---
class TrendDataPoint(BaseModel):
    date: str
    numeric_value: float
    unit: Optional[str] = None
    status: str
    document_id: int
    report_title: str


class ParameterTrendResponse(BaseModel):
    standard_name: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    data_points: List[TrendDataPoint] = []
    ai_insight: Optional[str] = None


class ParameterComparisonItem(BaseModel):
    standard_name: str
    parameter_name: str
    previous_value: Optional[float] = None
    current_value: Optional[float] = None
    diff: Optional[float] = None
    percentage_change: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    trend_direction: str  # "UP", "DOWN", "STABLE", "NEW", "MISSING"
    previous_status: Optional[str] = None
    current_status: Optional[str] = None
    clinical_note: str


class ReportComparisonResponse(BaseModel):
    report_1_id: int
    report_1_name: str
    report_1_date: Optional[str] = None
    report_2_id: int
    report_2_name: str
    report_2_date: Optional[str] = None
    comparison_items: List[ParameterComparisonItem] = []
    comparison_summary: str


class HealthOverviewResponse(BaseModel):
    total_reports: int
    total_parameters_tracked: int
    abnormal_parameters_count: int
    upcoming_appointments_count: int
    active_medications_count: int
    latest_abnormal_items: List[ExtractedParameterResponse] = []
    ai_health_insights: List[str] = []


class TimelineEventResponse(BaseModel):
    id: str
    event_type: str  # "REPORT", "APPOINTMENT", "MEDICATION_START", "LAB_TEST"
    date: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    status_tag: Optional[str] = None
    reference_id: Optional[int] = None


# --- Medication Schemas ---
class MedicationBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    timing_food: Optional[str] = None
    special_instructions: Optional[str] = None
    precautions: Optional[str] = None
    dietary_recommendations: Optional[str] = None
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class MedicationCreate(MedicationBase):
    document_id: Optional[int] = None


class MedicationUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    timing_food: Optional[str] = None
    special_instructions: Optional[str] = None
    precautions: Optional[str] = None
    dietary_recommendations: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class MedicationLogBase(BaseModel):
    medication_id: int
    scheduled_time: datetime
    taken_time: Optional[datetime] = None
    status: str = "TAKEN"  # TAKEN, MISSED, SKIPPED, PENDING
    notes: Optional[str] = None


class MedicationLogCreate(MedicationLogBase):
    pass


class MedicationLogResponse(MedicationLogBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MedicationResponse(MedicationBase):
    id: int
    patient_id: int
    document_id: Optional[int] = None
    created_at: datetime
    logs: List[MedicationLogResponse] = []

    class Config:
        from_attributes = True


# --- Reminder & Appointment Schemas ---
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    reminder_type: str = "MEDICATION"  # MEDICATION, APPOINTMENT, TEST, FOLLOW_UP, CHECKUP
    reminder_time: datetime
    recurrence: str = "NONE"           # NONE, DAILY, WEEKLY, MONTHLY
    status: str = "PENDING"            # PENDING, COMPLETED, CANCELLED
    is_confirmed: bool = True

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any):
        if isinstance(data, dict):
            if "reminder_time" not in data and "scheduled_time" in data:
                data["reminder_time"] = data["scheduled_time"]
            if "description" not in data and "notes" in data:
                data["description"] = data["notes"]
        return data


class ReminderCreate(ReminderBase):
    document_id: Optional[int] = None
    extracted_from_doc: bool = False


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reminder_type: Optional[str] = None
    reminder_time: Optional[datetime] = None
    recurrence: Optional[str] = None
    status: Optional[str] = None
    is_confirmed: Optional[bool] = None


class ReminderResponse(ReminderBase):
    id: int
    patient_id: int
    document_id: Optional[int] = None
    extracted_from_doc: bool
    created_at: datetime
    scheduled_time: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.scheduled_time is None:
            self.scheduled_time = self.reminder_time
        if self.notes is None:
            self.notes = self.description
        return self


class AppointmentBase(BaseModel):
    doctor_name: str
    specialty: Optional[str] = None
    hospital_or_clinic: Optional[str] = None
    appointment_date: datetime
    reason: Optional[str] = None
    status: str = "SCHEDULED"  # SCHEDULED, COMPLETED, CANCELLED
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any):
        if isinstance(data, dict):
            if "appointment_date" not in data and "appointment_time" in data:
                data["appointment_date"] = data["appointment_time"]
            if "hospital_or_clinic" not in data and "clinic_or_hospital" in data:
                data["hospital_or_clinic"] = data["clinic_or_hospital"]
            if "notes" not in data and "instructions" in data:
                data["notes"] = data["instructions"]
        return data


class AppointmentCreate(AppointmentBase):
    document_id: Optional[int] = None


class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    hospital_or_clinic: Optional[str] = None
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    patient_id: int
    document_id: Optional[int] = None
    created_at: datetime
    appointment_time: Optional[datetime] = None
    clinic_or_hospital: Optional[str] = None
    instructions: Optional[str] = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.appointment_time is None:
            self.appointment_time = self.appointment_date
        if self.clinic_or_hospital is None:
            self.clinic_or_hospital = self.hospital_or_clinic
        if self.instructions is None:
            self.instructions = self.notes
        return self


# --- Family & Caregiver Schemas ---
class FamilyInviteCreate(BaseModel):
    caregiver_email: EmailStr
    caregiver_name: Optional[str] = None
    relationship: str
    role: str = "CAREGIVER"  # PATIENT, CAREGIVER, READ_ONLY
    redirect_url: Optional[str] = "/dashboard"
    permissions: Dict[str, bool] = {
        "can_view_reports": True,
        "can_view_medications": True,
        "can_view_reminders": True,
        "can_receive_alerts": True
    }


class FamilyConnectionResponse(BaseModel):
    id: int
    patient_id: int
    caregiver_email: str
    caregiver_id: Optional[int] = None
    caregiver_name: Optional[str] = None
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    is_caregiver_view: Optional[bool] = False
    relationship: str
    role: str
    status: str
    permissions_json: Dict[str, Any]
    invited_at: datetime
    accepted_at: Optional[datetime] = None
    invitation_token: Optional[str] = None
    invitation_url: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    is_expired: Optional[bool] = False
    redirect_url: Optional[str] = "/dashboard"

    class Config:
        from_attributes = True


class InvitationValidateResponse(BaseModel):
    valid: bool
    connection_id: int
    caregiver_email: str
    caregiver_name: Optional[str] = None
    patient_id: int
    patient_name: str
    relationship: str
    role: str
    permissions_json: Dict[str, Any] = {}
    redirect_url: Optional[str] = "/dashboard"
    invited_at: datetime
    token_expires_at: Optional[datetime] = None
    is_expired: bool = False
    is_used: bool = False
    message: Optional[str] = None


class CreatePasswordFromInviteRequest(BaseModel):
    token: str
    password: str
    full_name: Optional[str] = None


class CreatePasswordFromInviteResponse(BaseModel):
    status: str
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    redirect_url: str = "/dashboard"



class FamilyPermissionUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Dict[str, bool]


# --- Chat & Assistant Schemas ---
class ChatSessionResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    sources_json: List[Dict[str, Any]] = []
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatQueryRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    language: str = "en"  # "en" or "hi"

