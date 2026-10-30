from typing import Dict, Any, List
import json


class ReportSummarizer:
    @staticmethod
    def generate_summary(
        doc_type: str,
        report_date: str,
        lab_name: str,
        parameters: List[Dict[str, Any]],
        raw_text: str = ""
    ) -> Dict[str, Any]:
        """
        Generates a structured medical summary with dual viewing modes:
        Medical View and Simple View.
        """
        abnormal = [p for p in parameters if p.get("status") in ["LOW", "HIGH", "ABNORMAL"]]
        normal = [p for p in parameters if p.get("status") == "NORMAL"]
        
        abnormal_names = [f"{p['parameter_name']} ({p.get('numeric_value')} {p.get('unit')}) - {p.get('status')}" for p in abnormal]
        normal_names = [f"{p['parameter_name']} ({p.get('numeric_value')} {p.get('unit')})" for p in normal]
        
        # Build important findings
        findings = []
        if abnormal:
            findings.append(f"{len(abnormal)} parameter(s) deviate from standard reference intervals: {', '.join([p['parameter_name'] for p in abnormal])}.")
            for p in abnormal:
                findings.append(f"{p['parameter_name']} measured at {p.get('numeric_value')} {p.get('unit')} (Reference: {p.get('reference_range')}).")
        else:
            findings.append("All extracted clinical parameters are within their designated laboratory reference ranges.")

        observations = [
            f"Laboratory testing conducted by {lab_name or 'Accredited Diagnostic Centre'} on {report_date or 'recent visit'}.",
            f"A total of {len(parameters)} physiological markers were extracted and cross-referenced against standard adult reference intervals."
        ]
        
        doctor_recommendations = [
            "Schedule a routine consultation with your primary physician to review these laboratory results in the context of your overall medical history.",
            "Bring this comprehensive summary along with your previous reports to discuss trends."
        ]
        
        follow_up_instructions = [
            "Maintain your currently prescribed medication schedules unless advised otherwise by your doctor.",
            "Consider repeating any flagged tests in 4 to 8 weeks as determined by your healthcare provider."
        ]
        
        precautions = [
            "Do not self-adjust medication dosages based solely on numerical test values.",
            "Maintain optimal daily hydration, balanced nutrition, and appropriate physical activity.",
            "Seek prompt medical attention if you experience acute or worsening symptoms."
        ]
        
        # Medical View: Clinical terminology
        medical_view_lines = [
            f"CLINICAL LABORATORY REPORT EVALUATION",
            f"Document Classification: {doc_type}",
            f"Specimen / Evaluation Date: {report_date or 'Not stated'}",
            f"Diagnostic Facility: {lab_name or 'Diagnostic Laboratory'}",
            "",
            "FINDINGS & BIOMARKER STATUS:",
        ]
        for p in parameters:
            medical_view_lines.append(
                f"- {p['parameter_name']}: {p.get('numeric_value')} {p.get('unit')} "
                f"[{p.get('status')}] (Ref: {p.get('reference_range')})"
            )
        medical_view_lines.append("")
        medical_view_lines.append("CLINICAL CORRELATION:")
        medical_view_lines.append("Laboratory values must be clinically correlated with patient symptomatology, previous serial measurements, and physical findings.")
        medical_summary = "\n".join(medical_view_lines)
        
        # Simple View: Plain, friendly English
        simple_view_lines = [
            f"Your {doc_type} summary is ready.",
            f"This test was performed on {report_date or 'your recent checkup'}.",
            "",
            "KEY TAKEAWAYS FOR YOU:"
        ]
        if abnormal:
            simple_view_lines.append(f"• We noticed {len(abnormal)} test value(s) that are outside the usual healthy boundaries:")
            for p in abnormal:
                explanation = p.get("simple_explanation") or f"{p['parameter_name']} is outside the expected range."
                simple_view_lines.append(f"  - {p['parameter_name']}: {explanation}")
        else:
            simple_view_lines.append("• Good news: All tracked parameters in this report fall within the expected healthy ranges.")
            
        simple_view_lines.append("")
        simple_view_lines.append("WHAT YOU SHOULD DO NEXT:")
        simple_view_lines.append("• Review these findings with your doctor so they can give you personalized medical advice.")
        simple_view_lines.append("• Keep your medication and appointment schedule up to date on your dashboard.")
        simple_summary = "\n".join(simple_view_lines)

        return {
            "document_type": doc_type,
            "report_date": report_date,
            "laboratory_name": lab_name,
            "important_findings": findings,
            "normal_parameters": normal_names,
            "abnormal_parameters": abnormal_names,
            "observations": observations,
            "doctor_recommendations": doctor_recommendations,
            "follow_up_instructions": follow_up_instructions,
            "precautions": precautions,
            "simple_summary": simple_summary,
            "medical_summary": medical_summary
        }

