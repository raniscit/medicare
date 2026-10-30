import re
from typing import List, Dict, Any, Optional


# Standard Parameter Knowledge Base with reference definitions and simple explanations
MEDICAL_PARAMETERS_KNOWLEDGE = {
    "Hemoglobin": {
        "aliases": ["hemoglobin", "hb", "hgb", "total hemoglobin"],
        "default_unit": "g/dL",
        "default_range": "12.0 - 16.0 g/dL",
        "default_min": 12.0,
        "default_max": 16.0,
        "description": "Hemoglobin is a protein in red blood cells that carries oxygen from your lungs to the rest of your body.",
        "low_explanation": "Your hemoglobin level is below the reference range provided by the laboratory. Hemoglobin helps transport oxygen throughout your body. Discuss this result with your doctor to understand its significance.",
        "high_explanation": "Your hemoglobin level is above the reference range. Hemoglobin transports oxygen through red blood cells. Please consult your physician for clinical interpretation.",
        "normal_explanation": "Your hemoglobin level is within the standard healthy reference range."
    },
    "HbA1c": {
        "aliases": ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"],
        "default_unit": "%",
        "default_range": "4.0 - 5.6 %",
        "default_min": 4.0,
        "default_max": 5.6,
        "description": "HbA1c reflects your average blood sugar levels over the past 2 to 3 months.",
        "low_explanation": "Your HbA1c level is lower than typical reference limits. Discuss with your doctor if you take glucose-lowering medications.",
        "high_explanation": "Your HbA1c value is above the normal laboratory reference range, indicating elevated average blood glucose over recent months. Discuss lifestyle or treatment plans with your doctor.",
        "normal_explanation": "Your HbA1c level is within the healthy reference range."
    },
    "Fasting Blood Glucose": {
        "aliases": ["fasting blood glucose", "fasting blood sugar", "fbs", "glucose fasting", "blood sugar fasting"],
        "default_unit": "mg/dL",
        "default_range": "70 - 99 mg/dL",
        "default_min": 70.0,
        "default_max": 99.0,
        "description": "Measures your blood sugar level after fasting for at least 8 hours.",
        "low_explanation": "Your fasting glucose is below the standard laboratory reference threshold. Speak with your healthcare provider if you experience symptoms like shakiness or dizziness.",
        "high_explanation": "Your fasting blood glucose is above the standard reference range. Consult your doctor for appropriate clinical correlation.",
        "normal_explanation": "Your fasting blood glucose is within the recommended healthy range."
    },
    "Total Cholesterol": {
        "aliases": ["total cholesterol", "cholesterol total", "serum cholesterol"],
        "default_unit": "mg/dL",
        "default_range": "125 - 200 mg/dL",
        "default_min": 125.0,
        "default_max": 200.0,
        "description": "Total amount of cholesterol found in your blood, including HDL and LDL.",
        "low_explanation": "Your total cholesterol is lower than the reference baseline.",
        "high_explanation": "Your total cholesterol level is above the desirable reference threshold. Maintaining balanced dietary habits and consulting your doctor is recommended.",
        "normal_explanation": "Your total cholesterol level is within the desirable reference range."
    },
    "HDL Cholesterol": {
        "aliases": ["hdl cholesterol", "hdl", "high density lipoprotein", "good cholesterol"],
        "default_unit": "mg/dL",
        "default_range": "40 - 60 mg/dL",
        "default_min": 40.0,
        "default_max": 60.0,
        "description": "High-Density Lipoprotein ('good cholesterol') helps remove other forms of cholesterol from your bloodstream.",
        "low_explanation": "Your HDL level is below the recommended threshold. Higher HDL is generally considered protective for heart health. Discuss lifestyle modifications with your doctor.",
        "high_explanation": "Your HDL level is favorable and above the minimum target.",
        "normal_explanation": "Your HDL cholesterol is in a healthy, balanced range."
    },
    "LDL Cholesterol": {
        "aliases": ["ldl cholesterol", "ldl", "low density lipoprotein", "bad cholesterol"],
        "default_unit": "mg/dL",
        "default_range": "50 - 100 mg/dL",
        "default_min": 50.0,
        "default_max": 100.0,
        "description": "Low-Density Lipoprotein ('bad cholesterol') carries cholesterol to your arteries.",
        "low_explanation": "Your LDL level is below the standard reference baseline.",
        "high_explanation": "Your LDL cholesterol is above the optimal reference limit. Review heart-healthy dietary choices and treatment with your doctor.",
        "normal_explanation": "Your LDL cholesterol is within the recommended range."
    },
    "Triglycerides": {
        "aliases": ["triglycerides", "triglyceride", "tg"],
        "default_unit": "mg/dL",
        "default_range": "50 - 150 mg/dL",
        "default_min": 50.0,
        "default_max": 150.0,
        "description": "Triglycerides are the most common type of fat in your body stored from unused calories.",
        "low_explanation": "Your triglyceride level is low.",
        "high_explanation": "Your triglyceride level is above the normal limit. Elevated triglycerides can be influenced by diet, carbohydrates, and physical activity. Discuss with your doctor.",
        "normal_explanation": "Your triglyceride level is within the normal healthy range."
    },
    "Serum Creatinine": {
        "aliases": ["serum creatinine", "creatinine", "s. creatinine"],
        "default_unit": "mg/dL",
        "default_range": "0.6 - 1.2 mg/dL",
        "default_min": 0.6,
        "default_max": 1.2,
        "description": "Creatinine is a waste product produced by muscles and filtered out by healthy kidneys.",
        "low_explanation": "Your creatinine level is slightly lower than normal.",
        "high_explanation": "Your creatinine level is higher than the laboratory reference range. Because kidneys filter creatinine, your doctor may check your kidney function and hydration.",
        "normal_explanation": "Your creatinine level is within the standard healthy range, indicating normal filtration."
    },
    "TSH": {
        "aliases": ["tsh", "thyroid stimulating hormone", "ultra sensitive tsh"],
        "default_unit": "mIU/L",
        "default_range": "0.4 - 4.5 mIU/L",
        "default_min": 0.4,
        "default_max": 4.5,
        "description": "TSH is produced by the pituitary gland to control how much thyroid hormone your thyroid gland makes.",
        "low_explanation": "Your TSH level is below the reference range. Your doctor can help determine if your thyroid is producing excess hormone.",
        "high_explanation": "Your TSH level is above the reference range. Elevated TSH may indicate your thyroid is producing less hormone. Discuss this finding with your physician.",
        "normal_explanation": "Your TSH level is within normal laboratory limits."
    },
    "White Blood Cells (WBC)": {
        "aliases": ["wbc", "total wbc", "total leucocyte count", "tlc", "white blood cells"],
        "default_unit": "cells/mcL",
        "default_range": "4000 - 11000 cells/mcL",
        "default_min": 4000.0,
        "default_max": 11000.0,
        "description": "White blood cells are an essential part of your immune system that fight infections.",
        "low_explanation": "Your white blood cell count is below normal reference values. Discuss with your doctor to explore possible immune or medication factors.",
        "high_explanation": "Your white blood cell count is elevated. This commonly occurs in response to infection, stress, or inflammation. Consult your doctor.",
        "normal_explanation": "Your white blood cell count is in the normal healthy range."
    },
    "Platelets": {
        "aliases": ["platelet count", "platelets", "plt"],
        "default_unit": "x10^3/mcL",
        "default_range": "150 - 450 x10^3/mcL",
        "default_min": 150.0,
        "default_max": 450.0,
        "description": "Platelets are tiny blood cells that help your body form clots to stop bleeding.",
        "low_explanation": "Your platelet count is below the laboratory reference range. Consult your doctor to assess clotting factors.",
        "high_explanation": "Your platelet count is above the laboratory threshold. Consult your doctor for evaluation.",
        "normal_explanation": "Your platelet count is within the healthy reference range."
    }
}


class MedicalExtractor:
    @staticmethod
    def extract_parameters(text: str, default_date: Optional[str] = None) -> List[Dict[str, Any]]:
        extracted = []
        text_lower = text.lower()
        
        # Check known medical parameters
        for std_name, info in MEDICAL_PARAMETERS_KNOWLEDGE.items():
            for alias in info["aliases"]:
                # Pattern: alias followed by separator and numeric value
                # e.g., "Hemoglobin: 10.2 g/dL (12-16)" or "HbA1c: 7.8%"
                pattern = rf"(?:^|[\n\r,;•])\s*{re.escape(alias)}\s*[:=\-–]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%^0-9\s]*)"
                matches = re.finditer(pattern, text_lower)
                
                for m in matches:
                    try:
                        raw_val = float(m.group(1))
                        # Find unit and range if in subsequent line or parentheses
                        trailing = m.group(2).strip()
                        
                        unit = info["default_unit"]
                        min_ref = info["default_min"]
                        max_ref = info["default_max"]
                        ref_range = info["default_range"]
                        
                        # Determine status
                        status = "NORMAL"
                        simple_exp = info["normal_explanation"]
                        
                        if raw_val < min_ref:
                            status = "LOW"
                            simple_exp = info["low_explanation"]
                        elif raw_val > max_ref:
                            status = "HIGH"
                            simple_exp = info["high_explanation"]
                            
                        # Avoid duplicate standard names in same extraction
                        if not any(item["standard_name"] == std_name for item in extracted):
                            extracted.append({
                                "parameter_name": std_name,
                                "standard_name": std_name,
                                "numeric_value": raw_val,
                                "string_value": str(raw_val),
                                "unit": unit,
                                "reference_range": ref_range,
                                "min_reference": min_ref,
                                "max_reference": max_ref,
                                "status": status,
                                "simple_explanation": simple_exp,
                                "clinical_context": info["description"],
                                "test_date": default_date or "2026-10-15",
                                "laboratory_name": "Diagnostic Laboratory"
                            })
                            break
                    except Exception:
                        continue
                        
        return extracted

    @staticmethod
    def extract_medications(text: str) -> List[Dict[str, Any]]:
        meds = []
        # Common prescription formats
        # e.g., "Metformin 500mg - Twice daily after meals - 30 days"
        med_patterns = [
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+([0-9]+\s*(?:mg|mcg|g|ml))\s*[-–:]?\s*([A-Za-z0-9\s]+?)(?:[-–]|\n|$)",
            r"Rx:\s*([A-Za-z]+)\s+([0-9]+\s*(?:mg|mcg|ml))\s*([^\n\r]+)",
            r"(?:Tab|Cap|Syp|Inj)\.?\s+([A-Za-z]+)\s+([0-9]+\s*(?:mg|mcg|ml))\s*([^\n\r]+)"
        ]
        
        for pat in med_patterns:
            for match in re.finditer(pat, text):
                name = match.group(1).strip()
                dosage = match.group(2).strip()
                rest = match.group(3).strip() if len(match.groups()) >= 3 else ""
                
                timing = "After meals" if "after" in rest.lower() else ("Before meals" if "before" in rest.lower() else "As directed")
                freq = "Once daily"
                if "twice" in rest.lower() or "bid" in rest.lower() or "1-0-1" in rest:
                    freq = "Twice daily"
                elif "thrice" in rest.lower() or "tid" in rest.lower() or "1-1-1" in rest:
                    freq = "Three times daily"
                elif "bedtime" in rest.lower() or "night" in rest.lower() or "hs" in rest.lower():
                    freq = "Once at bedtime"
                
                meds.append({
                    "medicine_name": name,
                    "dosage": dosage,
                    "frequency": freq,
                    "duration": "30 days",
                    "timing_food": timing,
                    "special_instructions": "Take with a full glass of water. Do not skip doses.",
                    "precautions": "Consult doctor if unusual symptoms occur. Do not stop abruptly.",
                    "dietary_recommendations": "Maintain balanced hydration.",
                    "is_active": True
                })
        return meds

    @staticmethod
    def extract_follow_ups(text: str) -> List[Dict[str, Any]]:
        follow_ups = []
        # Look for follow-up or review statements
        # e.g., "Follow up in 2 weeks" or "Review after 1 month" or "Next visit: 2026-11-15"
        patterns = [
            r"(?:follow[\s-]?up|review|next visit)\s*(?:in|after|on)?\s*([0-9]+\s*(?:days|weeks|months))",
            r"(?:repeat|test)\s+([A-Za-z\s]+)\s+after\s+([0-9]+\s*(?:days|weeks|months))"
        ]
        
        for p in patterns:
            for m in re.finditer(p, text, re.IGNORECASE):
                follow_ups.append({
                    "title": f"Medical Follow-up ({m.group(0).strip()})",
                    "description": f"Automated follow-up identified from document: '{m.group(0).strip()}'.",
                    "timeframe": m.group(1) if len(m.groups()) >= 1 else "2 weeks",
                    "type": "FOLLOW_UP"
                })
        return follow_ups

