from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.config import settings
from app.utils.security import get_password_hash
from app.models.entities import (
    User,
    PatientProfile,
    MedicalDocument,
    ReportSummary,
    ExtractedMedicalParameter,
    Medication,
    MedicationLog,
    Reminder,
    Appointment,
    FamilyConnection,
    ChatSession,
    ChatMessage,
    DocumentChunk,
)
from app.services.rag_service import generate_simple_embedding


def seed_demo_data(db: Session):
    """
    Seeds comprehensive synthetic medical data for demo user.
    """
    # Check if demo user already exists
    existing = db.query(User).filter(User.email == settings.DEMO_USER_EMAIL).first()
    if existing:
        return existing

    # 1. Create Patient User
    demo_user = User(
        email=settings.DEMO_USER_EMAIL,
        hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
        full_name="Alex Johnson",
        role="patient",
        is_active=True
    )
    db.add(demo_user)
    db.flush()

    # 2. Create Caregiver User
    caregiver_user = User(
        email=settings.DEMO_CAREGIVER_EMAIL,
        hashed_password=get_password_hash("caregiver123"),
        full_name="Elena Johnson (Spouse)",
        role="caregiver",
        is_active=True
    )
    db.add(caregiver_user)
    db.flush()

    # 3. Patient Profile
    profile = PatientProfile(
        user_id=demo_user.id,
        date_of_birth="1981-06-14",
        gender="Male",
        blood_group="B+",
        phone_number="+1 (555) 234-5678",
        emergency_contact_name="Elena Johnson",
        emergency_contact_phone="+1 (555) 876-5432",
        chronic_conditions="Type 2 Diabetes Mellitus (well-managed), Mild Hypertension",
        known_allergies="Penicillin (causes mild rash), Sulfa drugs"
    )
    db.add(profile)
    db.flush()

    # 4. Medical Documents (4 Historical Reports)
    now = datetime.utcnow()
    
    # Doc 1: January 2026 Comprehensive CBC & Metabolic Panel
    raw_cbc_jan = (
        "METRO DIAGNOSTIC CLINIC & PATHOLOGY LAB\n"
        "Patient: Alex Johnson | Age: 45 | Gender: Male | Date: 2026-01-15\n"
        "COMPLETE BLOOD COUNT (CBC) & DIABETIC PANEL\n\n"
        "Hemoglobin: 10.2 g/dL (Reference Range: 12.0 - 16.0 g/dL) - LOW\n"
        "White Blood Cells (WBC): 6800 cells/mcL (Reference Range: 4000 - 11000 cells/mcL) - NORMAL\n"
        "Platelets: 240 x10^3/mcL (Reference Range: 150 - 450 x10^3/mcL) - NORMAL\n"
        "Fasting Blood Glucose: 135 mg/dL (Reference Range: 70 - 99 mg/dL) - HIGH\n"
        "HbA1c: 8.5 % (Reference Range: 4.0 - 5.6 %) - HIGH\n"
        "Total Cholesterol: 220 mg/dL (Reference Range: 125 - 200 mg/dL) - HIGH\n"
        "Serum Creatinine: 0.9 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) - NORMAL\n"
        "TSH: 2.1 mIU/L (Reference Range: 0.4 - 4.5 mIU/L) - NORMAL\n\n"
        "Doctor's Notes: HbA1c elevated. Mild iron deficiency anemia suspected. Recommend Metformin 500mg BID and dietary iron support. Follow up in 8 weeks."
    )
    doc_jan = MedicalDocument(
        patient_id=demo_user.id,
        file_name="cbc_diabetic_panel_jan2026.pdf",
        original_name="Comprehensive CBC & Diabetic Panel (Jan 2026)",
        file_type="pdf",
        file_path="uploads/demo_cbc_jan2026.pdf",
        file_size=245000,
        document_type="Blood Test Report",
        laboratory_name="Metro Diagnostic Clinic",
        report_date="2026-01-15",
        upload_date=now - timedelta(days=280),
        status="COMPLETED",
        raw_text=raw_cbc_jan
    )
    db.add(doc_jan)
    db.flush()

    # Doc 2: March 2026 Lipid Profile & Diabetic Check
    raw_lipid_mar = (
        "APEX CARDIAC & PATHOLOGY LABS\n"
        "Patient: Alex Johnson | Date: 2026-03-20\n"
        "COMPREHENSIVE LIPID PROFILE & FOLLOW-UP\n\n"
        "Hemoglobin: 11.0 g/dL (Reference: 12.0 - 16.0 g/dL) - LOW\n"
        "Fasting Blood Glucose: 122 mg/dL (Reference: 70 - 99 mg/dL) - HIGH\n"
        "HbA1c: 7.8 % (Reference: 4.0 - 5.6 %) - HIGH\n"
        "Total Cholesterol: 195 mg/dL (Reference: 125 - 200 mg/dL) - NORMAL\n"
        "HDL Cholesterol: 42 mg/dL (Reference: 40 - 60 mg/dL) - NORMAL\n"
        "LDL Cholesterol: 115 mg/dL (Reference: 50 - 100 mg/dL) - HIGH\n"
        "Triglycerides: 165 mg/dL (Reference: 50 - 150 mg/dL) - HIGH\n"
        "Serum Creatinine: 0.92 mg/dL (Reference: 0.6 - 1.2 mg/dL) - NORMAL\n\n"
        "Impressions: Glycemic control improving. Atorvastatin 10mg started. Follow up in 12 weeks."
    )
    doc_mar = MedicalDocument(
        patient_id=demo_user.id,
        file_name="lipid_profile_mar2026.pdf",
        original_name="Lipid Profile & Glycemic Follow-up (Mar 2026)",
        file_type="pdf",
        file_path="uploads/demo_lipid_mar2026.pdf",
        file_size=198000,
        document_type="Lipid Profile",
        laboratory_name="Apex Cardiac Labs",
        report_date="2026-03-20",
        upload_date=now - timedelta(days=220),
        status="COMPLETED",
        raw_text=raw_lipid_mar
    )
    db.add(doc_mar)
    db.flush()

    # Doc 3: June 2026 Mid-Year Metabolic Panel
    raw_jun = (
        "CITY HEALTH DIAGNOSTICS\n"
        "Patient: Alex Johnson | Date: 2026-06-18\n"
        "ROUTINE METABOLIC CHECKUP\n\n"
        "Hemoglobin: 12.1 g/dL (Reference: 12.0 - 16.0 g/dL) - NORMAL\n"
        "Fasting Blood Glucose: 110 mg/dL (Reference: 70 - 99 mg/dL) - HIGH\n"
        "HbA1c: 7.2 % (Reference: 4.0 - 5.6 %) - HIGH\n"
        "Total Cholesterol: 180 mg/dL (Reference: 125 - 200 mg/dL) - NORMAL\n"
        "HDL Cholesterol: 46 mg/dL (Reference: 40 - 60 mg/dL) - NORMAL\n"
        "LDL Cholesterol: 98 mg/dL (Reference: 50 - 100 mg/dL) - NORMAL\n"
        "Triglycerides: 140 mg/dL (Reference: 50 - 150 mg/dL) - NORMAL\n"
        "Serum Creatinine: 0.88 mg/dL (Reference: 0.6 - 1.2 mg/dL) - NORMAL\n\n"
        "Impressions: HbA1c reduced to 7.2%. Hemoglobin normalized to 12.1 g/dL. Continue current regimen."
    )
    doc_jun = MedicalDocument(
        patient_id=demo_user.id,
        file_name="metabolic_panel_jun2026.pdf",
        original_name="Mid-Year Metabolic Evaluation (Jun 2026)",
        file_type="pdf",
        file_path="uploads/demo_metabolic_jun2026.pdf",
        file_size=210000,
        document_type="Blood Test Report",
        laboratory_name="City Health Diagnostics",
        report_date="2026-06-18",
        upload_date=now - timedelta(days=130),
        status="COMPLETED",
        raw_text=raw_jun
    )
    db.add(doc_jun)
    db.flush()

    # Doc 4: October 2026 Latest Comprehensive Report
    raw_oct = (
        "METRO DIAGNOSTIC CLINIC & ADVANCED PATHOLOGY\n"
        "Patient: Alex Johnson | Age: 45 | Date: 2026-10-12\n"
        "LATEST QUARTERLY HEALTH ASSESSMENT\n\n"
        "Hemoglobin: 12.5 g/dL (Reference Range: 12.0 - 16.0 g/dL) - NORMAL\n"
        "White Blood Cells (WBC): 6200 cells/mcL (Reference Range: 4000 - 11000 cells/mcL) - NORMAL\n"
        "Platelets: 260 x10^3/mcL (Reference Range: 150 - 450 x10^3/mcL) - NORMAL\n"
        "Fasting Blood Glucose: 98 mg/dL (Reference Range: 70 - 99 mg/dL) - NORMAL\n"
        "HbA1c: 6.9 % (Reference Range: 4.0 - 5.6 %) - HIGH\n"
        "Total Cholesterol: 168 mg/dL (Reference Range: 125 - 200 mg/dL) - NORMAL\n"
        "HDL Cholesterol: 48 mg/dL (Reference Range: 40 - 60 mg/dL) - NORMAL\n"
        "LDL Cholesterol: 92 mg/dL (Reference Range: 50 - 100 mg/dL) - NORMAL\n"
        "Triglycerides: 132 mg/dL (Reference Range: 50 - 150 mg/dL) - NORMAL\n"
        "Serum Creatinine: 0.85 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) - NORMAL\n"
        "TSH: 1.9 mIU/L (Reference Range: 0.4 - 4.5 mIU/L) - NORMAL\n\n"
        "Prescriptions & Recommendations:\n"
        "1. Metformin 500mg - Take 1 tablet twice daily after meals (Breakfast and Dinner).\n"
        "2. Atorvastatin 10mg - Take 1 tablet at bedtime.\n"
        "3. Lisinopril 5mg - Take 1 tablet once daily in the morning.\n"
        "Precautions: Low carbohydrate and low sodium diet. 30 minutes daily walking. Avoid skipped doses.\n"
        "Follow up: Review with Dr. Robert Mehta in 3 months."
    )
    doc_oct = MedicalDocument(
        patient_id=demo_user.id,
        file_name="quarterly_assessment_oct2026.pdf",
        original_name="Latest Quarterly Health Assessment (Oct 2026)",
        file_type="pdf",
        file_path="uploads/demo_assessment_oct2026.pdf",
        file_size=260000,
        document_type="Comprehensive Health Report",
        laboratory_name="Metro Diagnostic Clinic",
        report_date="2026-10-12",
        upload_date=now - timedelta(days=15),
        status="COMPLETED",
        raw_text=raw_oct
    )
    db.add(doc_oct)
    db.flush()

    # Doc 5: Hospital Discharge Summary
    raw_discharge = (
        "ST. JUDE MEDICAL CENTER - DEPARTMENT OF INTERNAL MEDICINE\n"
        "PATIENT DISCHARGE SUMMARY\n"
        "Patient: Alex Johnson | Admission Date: 2026-08-02 | Discharge Date: 2026-08-04\n"
        "Primary Attending: Dr. Sarah Jenkins, MD (Cardiology / Internal Medicine)\n\n"
        "Diagnosis: Transient Chest Discomfort (ruled out acute coronary syndrome), Mild Essential Hypertension.\n"
        "Hospital Course: Patient admitted for observational cardiac monitoring. ECG showed normal sinus rhythm. Troponin T negative x 2. Echocardiogram revealed normal LV systolic function (EF 60%).\n"
        "Condition on Discharge: Stable and ambulatory.\n\n"
        "Discharge Medications:\n"
        "- Lisinopril 5mg orally once daily in morning for blood pressure maintenance.\n"
        "- Metformin 500mg orally twice daily after meals for glycemic control.\n"
        "- Atorvastatin 10mg orally once daily at bedtime.\n\n"
        "Discharge Instructions & Precautions:\n"
        "- Avoid heavy lifting or intense cardiovascular exertion for 2 weeks.\n"
        "- Low sodium diet (<2g sodium per day) and limit processed foods.\n"
        "- Monitor blood pressure and fasting blood glucose daily.\n"
        "- Follow up with Dr. Sarah Jenkins in 4 weeks."
    )
    doc_discharge = MedicalDocument(
        patient_id=demo_user.id,
        file_name="discharge_summary_aug2026.pdf",
        original_name="Hospital Discharge Summary (Aug 2026)",
        file_type="pdf",
        file_path="uploads/demo_discharge_aug2026.pdf",
        file_size=312000,
        document_type="Hospital Discharge Summary",
        laboratory_name="St. Jude Medical Center",
        report_date="2026-08-04",
        upload_date=now - timedelta(days=85),
        status="COMPLETED",
        raw_text=raw_discharge
    )
    db.add(doc_discharge)
    db.flush()

    # 5. Populate Historical Parameters for Trend Charts
    # Parameters across Jan, Mar, Jun, Oct
    trend_definitions = [
        # (Standard name, unit, range, min, max)
        ("Hemoglobin", "g/dL", "12.0 - 16.0 g/dL", 12.0, 16.0, [
            (doc_jan.id, 10.2, "2026-01-15", "LOW", "Your hemoglobin level is below the reference range provided by the laboratory. Hemoglobin helps transport oxygen throughout your body. Discuss this result with your doctor to understand its significance."),
            (doc_mar.id, 11.0, "2026-03-20", "LOW", "Hemoglobin is below normal threshold."),
            (doc_jun.id, 12.1, "2026-06-18", "NORMAL", "Hemoglobin level is within standard reference range."),
            (doc_oct.id, 12.5, "2026-10-12", "NORMAL", "Hemoglobin level is in the healthy normal range.")
        ]),
        ("HbA1c", "%", "4.0 - 5.6 %", 4.0, 5.6, [
            (doc_jan.id, 8.5, "2026-01-15", "HIGH", "HbA1c is above laboratory limits, reflecting elevated average glucose."),
            (doc_mar.id, 7.8, "2026-03-20", "HIGH", "HbA1c is above normal reference range."),
            (doc_jun.id, 7.2, "2026-06-18", "HIGH", "HbA1c continues downward trajectory."),
            (doc_oct.id, 6.9, "2026-10-12", "HIGH", "HbA1c is 6.9%. Downward trend from 8.5%. Discuss clinical significance with doctor.")
        ]),
        ("Fasting Blood Glucose", "mg/dL", "70 - 99 mg/dL", 70.0, 99.0, [
            (doc_jan.id, 135.0, "2026-01-15", "HIGH", "Fasting blood sugar is elevated above normal threshold."),
            (doc_mar.id, 122.0, "2026-03-20", "HIGH", "Fasting glucose is above standard reference limits."),
            (doc_jun.id, 110.0, "2026-06-18", "HIGH", "Fasting glucose is above standard reference limits."),
            (doc_oct.id, 98.0, "2026-10-12", "NORMAL", "Fasting glucose has normalized into the healthy range (70-99 mg/dL).")
        ]),
        ("Total Cholesterol", "mg/dL", "125 - 200 mg/dL", 125.0, 200.0, [
            (doc_jan.id, 220.0, "2026-01-15", "HIGH", "Total cholesterol is above recommended reference limit."),
            (doc_mar.id, 195.0, "2026-03-20", "NORMAL", "Total cholesterol has reduced into desirable range."),
            (doc_jun.id, 180.0, "2026-06-18", "NORMAL", "Total cholesterol is within normal boundaries."),
            (doc_oct.id, 168.0, "2026-10-12", "NORMAL", "Total cholesterol is well within desirable reference limits.")
        ]),
        ("Serum Creatinine", "mg/dL", "0.6 - 1.2 mg/dL", 0.6, 1.2, [
            (doc_jan.id, 0.90, "2026-01-15", "NORMAL", "Kidney filtration marker is in optimal healthy range."),
            (doc_mar.id, 0.92, "2026-03-20", "NORMAL", "Creatinine level is stable within normal limits."),
            (doc_jun.id, 0.88, "2026-06-18", "NORMAL", "Creatinine level is stable within normal limits."),
            (doc_oct.id, 0.85, "2026-10-12", "NORMAL", "Creatinine level is stable and within healthy limits.")
        ]),
        ("TSH", "mIU/L", "0.4 - 4.5 mIU/L", 0.4, 4.5, [
            (doc_jan.id, 2.1, "2026-01-15", "NORMAL", "Thyroid stimulating hormone is normal."),
            (doc_oct.id, 1.9, "2026-10-12", "NORMAL", "Thyroid function remains balanced and normal.")
        ])
    ]

    for std_name, unit, ref_range, min_val, max_val, points in trend_definitions:
        for doc_id, val, test_date, status, exp in points:
            param = ExtractedMedicalParameter(
                document_id=doc_id,
                patient_id=demo_user.id,
                parameter_name=std_name,
                standard_name=std_name,
                numeric_value=val,
                string_value=str(val),
                unit=unit,
                reference_range=ref_range,
                min_reference=min_val,
                max_reference=max_val,
                status=status,
                simple_explanation=exp,
                clinical_context=f"Standard clinical metric for {std_name}.",
                test_date=test_date,
                laboratory_name="Diagnostic Pathology Lab"
            )
            db.add(param)

    # 6. Structured Summaries for Reports
    summary_oct = ReportSummary(
        document_id=doc_oct.id,
        patient_id=demo_user.id,
        document_type="Comprehensive Health Report",
        report_date="2026-10-12",
        laboratory_name="Metro Diagnostic Clinic",
        important_findings=[
            "HbA1c measured at 6.9%, demonstrating a continuous downward trend from previous 8.5% (Jan 2026).",
            "Fasting Blood Sugar has reached 98 mg/dL, returning inside the normal adult reference interval (70-99 mg/dL).",
            "Hemoglobin is 12.5 g/dL, remaining comfortably within normal limits.",
            "Lipid panel shows optimal balance with Total Cholesterol at 168 mg/dL and LDL at 92 mg/dL."
        ],
        normal_parameters=[
            "Hemoglobin (12.5 g/dL)",
            "Fasting Blood Glucose (98 mg/dL)",
            "Total Cholesterol (168 mg/dL)",
            "HDL Cholesterol (48 mg/dL)",
            "LDL Cholesterol (92 mg/dL)",
            "Triglycerides (132 mg/dL)",
            "Serum Creatinine (0.85 mg/dL)",
            "TSH (1.9 mIU/L)",
            "Platelets (260 x10^3/mcL)",
            "WBC (6200 cells/mcL)"
        ],
        abnormal_parameters=[
            "HbA1c (6.9 %) - HIGH (Reference: 4.0 - 5.6 %)"
        ],
        observations=[
            "Significant progress in glycemic indicators following structured medication and dietary modifications.",
            "Kidney and thyroid profiles remain well within baseline reference ranges."
        ],
        doctor_recommendations=[
            "Continue current doses of Metformin 500mg BID and Atorvastatin 10mg at bedtime.",
            "Maintain moderate aerobic activity (minimum 150 minutes weekly).",
            "Follow-up consultation with Dr. Robert Mehta in 3 months."
        ],
        follow_up_instructions=[
            "Repeat HbA1c and lipid panel prior to next endocrinology appointment in January 2027.",
            "Continue daily home glucose log before breakfast."
        ],
        precautions=[
            "Do not modify or skip prescribed medications without consulting your doctor.",
            "Adhere to a low-glycemic, portion-controlled dietary routine."
        ],
        simple_summary=(
            "Great progress on your latest quarterly checkup! Your fasting blood sugar has returned into the normal healthy range (98 mg/dL). "
            "Your 3-month average blood sugar (HbA1c) is down to 6.9% compared to 8.5% earlier this year, indicating steady improvement. "
            "Your cholesterol and kidney indicators are in healthy ranges. Keep taking your prescribed medicines on schedule and stay active."
        ),
        medical_summary=(
            "CLINICAL LABORATORY SUMMARY: QUARTERLY METABOLIC ASSESSMENT\n"
            "Patient: Alex Johnson | Age: 45 | Date: 2026-10-12\n"
            "Key Biomarkers:\n"
            "- HbA1c: 6.9% [HIGH - Ref 4.0-5.6%]. Serial trend: 8.5% (Jan) -> 7.8% (Mar) -> 7.2% (Jun) -> 6.9% (Oct).\n"
            "- Fasting Glucose: 98 mg/dL [NORMAL - Ref 70-99 mg/dL].\n"
            "- Total Cholesterol: 168 mg/dL [NORMAL]. LDL: 92 mg/dL [NORMAL]. HDL: 48 mg/dL [NORMAL].\n"
            "- S. Creatinine: 0.85 mg/dL [NORMAL - eGFR > 90 mL/min/1.73m2].\n"
            "Plan: Continue current pharmacotherapy (Metformin, Atorvastatin, Lisinopril). Follow-up in 90 days."
        )
    )
    db.add(summary_oct)

    # 7. Active Medications
    med1 = Medication(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        medicine_name="Metformin",
        dosage="500 mg",
        frequency="Twice daily",
        duration="Ongoing",
        timing_food="After meals (Breakfast & Dinner)",
        special_instructions="Take with water immediately following meals to minimize stomach upset.",
        precautions="Do not take on an empty stomach. Stay hydrated. Consult doctor if experiencing severe fatigue.",
        dietary_recommendations="Maintain balanced low-carbohydrate meals.",
        is_active=True,
        start_date="2026-01-20"
    )
    med2 = Medication(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        medicine_name="Atorvastatin",
        dosage="10 mg",
        frequency="Once at bedtime",
        duration="Ongoing",
        timing_food="At bedtime with water",
        special_instructions="Take consistently around bedtime.",
        precautions="Avoid excessive grapefruit juice consumption while on atorvastatin.",
        dietary_recommendations="Follow a heart-healthy diet low in saturated fats.",
        is_active=True,
        start_date="2026-03-22"
    )
    med3 = Medication(
        patient_id=demo_user.id,
        document_id=doc_discharge.id,
        medicine_name="Lisinopril",
        dosage="5 mg",
        frequency="Once daily",
        duration="Ongoing",
        timing_food="In the morning",
        special_instructions="Take every morning with or without food. Monitor blood pressure regularly.",
        precautions="Rise slowly from sitting position if feeling lightheaded.",
        dietary_recommendations="Moderate sodium intake (<2g daily).",
        is_active=True,
        start_date="2026-08-04"
    )
    med4 = Medication(
        patient_id=demo_user.id,
        document_id=doc_jan.id,
        medicine_name="Daily Multivitamin & Iron Support",
        dosage="1 tablet",
        frequency="Once daily",
        duration="90 days",
        timing_food="With lunch",
        special_instructions="Take with citrus or vitamin C to support iron absorption.",
        precautions="Do not exceed recommended daily serving.",
        dietary_recommendations="Include leafy greens, beans, and lean proteins.",
        is_active=True,
        start_date="2026-01-20"
    )
    db.add_all([med1, med2, med3, med4])
    db.flush()

    # Medication Logs (Recent taken/missed records)
    log1 = MedicationLog(
        medication_id=med1.id,
        patient_id=demo_user.id,
        scheduled_time=now - timedelta(hours=14),
        taken_time=now - timedelta(hours=13, minutes=50),
        status="TAKEN",
        notes="Taken after breakfast"
    )
    log2 = MedicationLog(
        medication_id=med3.id,
        patient_id=demo_user.id,
        scheduled_time=now - timedelta(hours=13),
        taken_time=now - timedelta(hours=12, minutes=45),
        status="TAKEN",
        notes="Taken with morning water"
    )
    log3 = MedicationLog(
        medication_id=med2.id,
        patient_id=demo_user.id,
        scheduled_time=now - timedelta(days=1, hours=2),
        taken_time=now - timedelta(days=1, hours=1, minutes=55),
        status="TAKEN",
        notes="Taken at bedtime"
    )
    log4 = MedicationLog(
        medication_id=med1.id,
        patient_id=demo_user.id,
        scheduled_time=now - timedelta(days=2, hours=4),
        taken_time=None,
        status="MISSED",
        notes="Dinner while traveling - missed evening dose"
    )
    db.add_all([log1, log2, log3, log4])

    # 8. Upcoming Appointments
    app1 = Appointment(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        doctor_name="Dr. Robert Mehta",
        specialty="Endocrinologist",
        hospital_or_clinic="Metro Endocrine Center",
        appointment_date=now + timedelta(days=12, hours=3),
        reason="Quarterly Diabetic Review & HbA1c Progress Check",
        status="SCHEDULED",
        notes="Bring latest lab report summary and glucose log."
    )
    app2 = Appointment(
        patient_id=demo_user.id,
        document_id=doc_discharge.id,
        doctor_name="Dr. Sarah Jenkins",
        specialty="Cardiologist",
        hospital_or_clinic="St. Jude Heart Institute",
        appointment_date=now + timedelta(days=26, hours=5),
        reason="Post-Discharge Cardiac Follow-up & BP Evaluation",
        status="SCHEDULED",
        notes="Routine 3-month follow-up after observational admission."
    )
    db.add_all([app1, app2])

    # 9. Smart Reminders
    rem1 = Reminder(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        title="Take Metformin (Morning Dose)",
        description="500 mg after breakfast",
        reminder_type="MEDICATION",
        reminder_time=now + timedelta(hours=11),
        recurrence="DAILY",
        status="PENDING",
        is_confirmed=True,
        extracted_from_doc=False
    )
    rem2 = Reminder(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        title="Take Atorvastatin (Bedtime)",
        description="10 mg with water before sleep",
        reminder_type="MEDICATION",
        reminder_time=now + timedelta(hours=2),
        recurrence="DAILY",
        status="PENDING",
        is_confirmed=True,
        extracted_from_doc=False
    )
    rem3 = Reminder(
        patient_id=demo_user.id,
        document_id=doc_oct.id,
        title="Fasting Blood Glucose Test (Pre-appointment)",
        description="Recommended lab test before visit with Dr. Robert Mehta",
        reminder_type="TEST",
        reminder_time=now + timedelta(days=10, hours=2),
        recurrence="NONE",
        status="PENDING",
        is_confirmed=False,  # Unconfirmed extracted reminder waiting for patient review!
        extracted_from_doc=True
    )
    db.add_all([rem1, rem2, rem3])

    # 10. Family & Caregiver Connection
    fam = FamilyConnection(
        patient_id=demo_user.id,
        caregiver_email=settings.DEMO_CAREGIVER_EMAIL,
        caregiver_id=caregiver_user.id,
        relationship="Spouse",
        role="CAREGIVER",
        status="ACCEPTED",
        permissions_json={
            "can_view_reports": True,
            "can_view_medications": True,
            "can_view_reminders": True,
            "can_receive_alerts": True
        },
        invited_at=now - timedelta(days=60),
        accepted_at=now - timedelta(days=59)
    )
    db.add(fam)

    # 11. Initial Chat Session with RAG Chunks
    # Index document chunks for RAG
    for doc in [doc_jan, doc_mar, doc_jun, doc_oct, doc_discharge]:
        paragraphs = doc.raw_text.split("\n\n")
        for idx, p in enumerate(paragraphs):
            p = p.strip()
            if not p:
                continue
            chunk = DocumentChunk(
                document_id=doc.id,
                patient_id=demo_user.id,
                chunk_index=idx,
                text=p,
                embedding_json=generate_simple_embedding(p),
                metadata_json={
                    "document_name": doc.original_name,
                    "document_type": doc.document_type,
                    "report_date": doc.report_date,
                    "chunk_index": idx
                }
            )
            db.add(chunk)

    # Pre-populate demo chat session
    chat_sess = ChatSession(
        patient_id=demo_user.id,
        title="Diabetic & Lipid Review",
        language="en"
    )
    db.add(chat_sess)
    db.flush()

    msg1 = ChatMessage(
        session_id=chat_sess.id,
        role="user",
        content="How has my HbA1c changed over the last six months?",
        language="en"
    )
    msg2 = ChatMessage(
        session_id=chat_sess.id,
        role="assistant",
        content=(
            "Based on your uploaded medical records, your HbA1c shows a consistent downward trend:\n\n"
            "• **January 2026:** 8.5% (High)\n"
            "• **March 2026:** 7.8% (High)\n"
            "• **June 2026:** 7.2% (High)\n"
            "• **October 2026:** 6.9% (Approaching target)\n\n"
            "Your HbA1c value has decreased by 1.6% across your uploaded reports. This indicates a steady downward trend in your 3-month average blood glucose. "
            "Discuss the clinical significance and any adjustments to your diet or Metformin with Dr. Robert Mehta during your upcoming appointment."
        ),
        sources_json=[
            {"document_name": doc_oct.original_name, "document_type": "Comprehensive Health Report", "report_date": "2026-10-12"},
            {"document_name": doc_jan.original_name, "document_type": "Blood Test Report", "report_date": "2026-01-15"}
        ],
        language="en"
    )
    db.add_all([msg1, msg2])

    db.commit()
    return demo_user

