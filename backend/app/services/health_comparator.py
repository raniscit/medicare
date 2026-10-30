from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import ExtractedMedicalParameter, MedicalDocument


class HealthComparator:
    @staticmethod
    def compare_two_reports(
        db: Session,
        patient_id: int,
        report_1_id: int,
        report_2_id: int
    ) -> Dict[str, Any]:
        """
        Compares medical parameters between two specific reports for a patient.
        Report 1 is considered earlier (previous), Report 2 is later (current).
        """
        doc1 = db.query(MedicalDocument).filter(MedicalDocument.id == report_1_id, MedicalDocument.patient_id == patient_id).first()
        doc2 = db.query(MedicalDocument).filter(MedicalDocument.id == report_2_id, MedicalDocument.patient_id == patient_id).first()

        if not doc1 or not doc2:
            return {
                "report_1_id": report_1_id,
                "report_1_name": doc1.original_name if doc1 else "Unknown",
                "report_1_date": doc1.report_date if doc1 else None,
                "report_2_id": report_2_id,
                "report_2_name": doc2.original_name if doc2 else "Unknown",
                "report_2_date": doc2.report_date if doc2 else None,
                "comparison_items": [],
                "comparison_summary": "One or both selected reports could not be found."
            }

        params1 = db.query(ExtractedMedicalParameter).filter(
            ExtractedMedicalParameter.document_id == report_1_id
        ).all()
        params2 = db.query(ExtractedMedicalParameter).filter(
            ExtractedMedicalParameter.document_id == report_2_id
        ).all()

        p1_map = {p.standard_name: p for p in params1}
        p2_map = {p.standard_name: p for p in params2}

        all_keys = set(p1_map.keys()).union(set(p2_map.keys()))
        comparison_items = []
        compatible_comparisons = 0

        for key in sorted(all_keys):
            p1 = p1_map.get(key)
            p2 = p2_map.get(key)

            if p1 and p2:
                # Check unit compatibility
                if (p1.unit or "").strip().lower() != (p2.unit or "").strip().lower():
                    comparison_items.append({
                        "standard_name": key,
                        "parameter_name": p2.parameter_name,
                        "previous_value": p1.numeric_value,
                        "current_value": p2.numeric_value,
                        "diff": None,
                        "percentage_change": None,
                        "unit": f"Mismatch ({p1.unit} vs {p2.unit})",
                        "reference_range": p2.reference_range,
                        "trend_direction": "INCOMPATIBLE_UNITS",
                        "previous_status": p1.status,
                        "current_status": p2.status,
                        "clinical_note": f"Units are incompatible ({p1.unit} vs {p2.unit}). Direct numerical comparison cannot be performed."
                    })
                    continue

                diff = round(p2.numeric_value - p1.numeric_value, 2) if (p1.numeric_value is not None and p2.numeric_value is not None) else None
                pct = round((diff / p1.numeric_value) * 100, 1) if (diff is not None and p1.numeric_value and p1.numeric_value > 0) else None

                trend = "STABLE"
                if diff is not None:
                    if diff > 0.05:
                        trend = "UP"
                    elif diff < -0.05:
                        trend = "DOWN"

                # Responsible note without clinical disease diagnosis
                if trend == "DOWN":
                    note = f"Numerical value decreased by {abs(diff)} {p2.unit}. Discuss clinical significance with your doctor."
                elif trend == "UP":
                    note = f"Numerical value increased by {diff} {p2.unit}. Consult your healthcare provider to interpret this trend."
                else:
                    note = "Numerical value remained stable across both report dates."

                comparison_items.append({
                    "standard_name": key,
                    "parameter_name": p2.parameter_name,
                    "previous_value": p1.numeric_value,
                    "current_value": p2.numeric_value,
                    "diff": diff,
                    "percentage_change": pct,
                    "unit": p2.unit,
                    "reference_range": p2.reference_range,
                    "trend_direction": trend,
                    "previous_status": p1.status,
                    "current_status": p2.status,
                    "clinical_note": note
                })
                compatible_comparisons += 1

            elif p2 and not p1:
                comparison_items.append({
                    "standard_name": key,
                    "parameter_name": p2.parameter_name,
                    "previous_value": None,
                    "current_value": p2.numeric_value,
                    "diff": None,
                    "percentage_change": None,
                    "unit": p2.unit,
                    "reference_range": p2.reference_range,
                    "trend_direction": "NEW",
                    "previous_status": None,
                    "current_status": p2.status,
                    "clinical_note": "This parameter was not present in the earlier report (insufficient historical data for comparison)."
                })
            elif p1 and not p2:
                comparison_items.append({
                    "standard_name": key,
                    "parameter_name": p1.parameter_name,
                    "previous_value": p1.numeric_value,
                    "current_value": None,
                    "diff": None,
                    "percentage_change": None,
                    "unit": p1.unit,
                    "reference_range": p1.reference_range,
                    "trend_direction": "MISSING",
                    "previous_status": p1.status,
                    "current_status": None,
                    "clinical_note": "This parameter was present in the earlier report but not measured in the later report."
                })

        summary = (
            f"Compared {compatible_comparisons} matching biomarker(s) between "
            f"'{doc1.original_name}' ({doc1.report_date or 'Earlier'}) and '{doc2.original_name}' ({doc2.report_date or 'Later'}). "
            f"Note: Numerical trends indicate direction of measurement, which your doctor will evaluate against your clinical treatment."
        )

        return {
            "report_1_id": report_1_id,
            "report_1_name": doc1.original_name,
            "report_1_date": doc1.report_date,
            "report_2_id": report_2_id,
            "report_2_name": doc2.original_name,
            "report_2_date": doc2.report_date,
            "comparison_items": comparison_items,
            "comparison_summary": summary
        }

    @staticmethod
    def get_parameter_trend(
        db: Session,
        patient_id: int,
        standard_name: str
    ) -> Dict[str, Any]:
        """
        Retrieves all historical data points for a specific parameter across documents.
        """
        records = db.query(ExtractedMedicalParameter, MedicalDocument).join(
            MedicalDocument, ExtractedMedicalParameter.document_id == MedicalDocument.id
        ).filter(
            ExtractedMedicalParameter.patient_id == patient_id,
            ExtractedMedicalParameter.standard_name == standard_name,
            ExtractedMedicalParameter.numeric_value != None
        ).order_by(MedicalDocument.upload_date.asc()).all()

        if not records:
            return {
                "standard_name": standard_name,
                "unit": None,
                "reference_range": None,
                "data_points": [],
                "ai_insight": f"Insufficient historical data available for {standard_name}."
            }

        data_points = []
        unit = records[0][0].unit
        ref_range = records[0][0].reference_range

        for param, doc in records:
            data_points.append({
                "date": param.test_date or (doc.report_date or str(doc.upload_date.date())),
                "numeric_value": param.numeric_value,
                "unit": param.unit,
                "status": param.status,
                "document_id": doc.id,
                "report_title": doc.original_name
            })

        # Generate responsible AI Insight
        if len(data_points) >= 2:
            first_val = data_points[0]["numeric_value"]
            latest_val = data_points[-1]["numeric_value"]
            diff = round(latest_val - first_val, 2)
            if diff < 0:
                insight = (
                    f"Your {standard_name} value has decreased from {first_val} to {latest_val} {unit} across the uploaded reports. "
                    f"This indicates a downward trend in this parameter. Discuss the clinical significance with your doctor."
                )
            elif diff > 0:
                insight = (
                    f"Your {standard_name} value has increased from {first_val} to {latest_val} {unit} across the uploaded reports. "
                    f"This indicates an upward numerical trend. Discuss the clinical significance with your doctor."
                )
            else:
                insight = (
                    f"Your {standard_name} value has remained stable at {latest_val} {unit} across your uploaded reports."
                )
        else:
            insight = f"Only one measurement is recorded for {standard_name}. Future report uploads will populate multi-point trend analysis."

        return {
            "standard_name": standard_name,
            "unit": unit,
            "reference_range": ref_range,
            "data_points": data_points,
            "ai_insight": insight
        }

