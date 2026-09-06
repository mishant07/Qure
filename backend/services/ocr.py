"""OCR / Text extraction service — backend/services/ocr.py

Extracts candidate clinical values from a PDF or plain text report. This
implementation uses:
  - pypdf for text extraction from PDF (if available)
  - regex-based pattern matching for clinical values

Per the SIH 26139 guide: "OCR extracts candidate values from PDF; never
bypasses user confirmation." Returned values are always marked as
'candidates' — the user must confirm or edit them before inference.
"""
import io
import re
from typing import Dict, List, Any

# Field pattern dictionary: maps disease field key → list of regex patterns
# that could match the value in a lab report.
# Each pattern is (regex, type) where type is 'float', 'int', 'category'
FIELD_PATTERNS = {
    # Heart (musa_heart — raw UCI coding)
    "age": [(r"age[:\s]+(\d{1,3})", "int")],
    "sex": [(r"sex[:\s]+(male|female|m|f)\b", "category_mf")],
    "cp": [(r"chest[ _-]?pain[ _-]?type[:\s]+(\d)", "int")],
    "trestbps": [(r"resting[ _-]?bp[:\s]+(\d{2,3})", "int")],
    "chol": [(r"chol(?:esterol)?[:\s]+(\d{2,3})", "int")],
    "fbs": [(r"(?:fbs|fasting)[:\s]+(0|1)", "int")],
    "restecg": [(r"rest[ _-]?ecg[:\s]+(\d)", "int")],
    "thalach": [(r"(?:max|peak|thalach|heart[ _-]?rate)[:\s]+(\d{2,3})", "int")],
    "exang": [(r"(?:exang|exercise[ _-]?angina)[:\s]+(0|1)", "int")],
    "oldpeak": [(r"oldpeak[:\s]+([\d.]+)", "float")],
    "slope": [(r"slope[:\s]+(\d)", "int")],
    "ca": [(r"(?:ca|vessels)[:\s]+(\d)", "int")],
    "thal": [(r"thal(?:assemium)?[:\s]+(\d)", "int")],

    # HCV (musa_hcv)
    "Age": [(r"age[:\s]+(\d{1,3})", "int")],
    "Sex": [(r"sex[:\s]+(male|female|m|f)\b", "category_mf")],
    "ALB": [(r"alb(?:umin)?[:\s]+([\d.]+)", "float")],
    "ALP": [(r"alp[:\s]+([\d.]+)", "float")],
    "ALT": [(r"alt[:\s]+([\d.]+)", "float")],
    "AST": [(r"ast[:\s]+([\d.]+)", "float")],
    "BIL": [(r"bil(?:irubin)?[:\s]+([\d.]+)", "float")],
    "CHE": [(r"che[:\s]+([\d.]+)", "float")],
    "CHOL": [(r"chol(?:esterol)?[:\s]+([\d.]+)", "float")],
    "CREA": [(r"crea(?:tinine)?[:\s]+(\d{1,4})", "int")],
    "GGT": [(r"ggt[:\s]+([\d.]+)", "float")],
    "PROT": [(r"prot(?:ein)?[:\s]+([\d.]+)", "float")],

    # Diabetes (musa_diabetes — cohort z-scored features; a report gives raw
    # clinical units, which the user must convert — kept for review-table
    # completeness so every expected field shows up as "missing — please enter")
    "Gender": [(r"sex[:\s]+(male|female|m|f)\b", "category_mf01")],
    "AGE": [(r"age[:\s]+(\d{1,3})", "int")],
    "Urea": [(r"urea[:\s]+([\d.]+)", "float")],
    "Cr": [(r"crea(?:tinine)?[:\s]+(\d{1,4})", "int")],
    "HbA1c": [(r"hba1c[:\s]+([\d.]+)", "float")],
    "Chol": [(r"chol(?:esterol)?[:\s]+([\d.]+)", "float")],
    "TG": [(r"(?:tg|triglyc(?:erides)?)[:\s]+([\d.]+)", "float")],
    "HDL": [(r"hdl[:\s]+([\d.]+)", "float")],
    "LDL": [(r"ldl[:\s]+([\d.]+)", "float")],
    "VLDL": [(r"vldl[:\s]+([\d.]+)", "float")],
    "BMI": [(r"bmi[:\s]+([\d.]+)", "float")],
}

CATEGORY_MAP = {
    "male": 1, "m": 1, "female": 0, "f": 0,
}

# HCV / musa_heart Sex coding: m→1, f→0 (matches hcv_sex_encoder.joblib and
# the raw UCI heart.csv coding); the diabetes model expects 0/1 numerics.
CATEGORY_MAP_MF = {
    "male": "m", "m": "m", "female": "f", "f": "f",
}
CATEGORY_MAP_01 = {
    "male": 1, "m": 1, "female": 0, "f": 0,
}


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Try pypdf first, fall back to raw text decode."""
    try:
        import pypdf  # type: ignore
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback: try plain-text decode
    try:
        return pdf_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_candidates(text: str, field_keys: List[str]) -> List[Dict[str, Any]]:
    """Given raw text and a list of expected field keys, return candidates.

    Each candidate: {field, value, confidence (0..1), source_text}
    """
    candidates = []
    lowered = text.lower()
    for key in field_keys:
        patterns = FIELD_PATTERNS.get(key, [])
        for pat, ptype in patterns:
            m = re.search(pat, lowered)
            if m:
                raw = m.group(1)
                if ptype == "int":
                    try:
                        v = int(raw)
                    except ValueError:
                        continue
                elif ptype == "float":
                    try:
                        v = float(raw)
                    except ValueError:
                        continue
                elif ptype == "category":
                    v = CATEGORY_MAP.get(raw.lower(), raw)
                elif ptype == "category_mf":
                    # Sex as 'm'/'f' — matches the HCV sex encoder + musa_heart
                    v = CATEGORY_MAP_MF.get(raw.lower(), raw)
                elif ptype == "category_mf01":
                    # Sex as 0/1 numeric — matches the musa_diabetes model
                    v = CATEGORY_MAP_01.get(raw.lower(), raw)
                else:
                    v = raw
                # Find the original substring in the text
                src_start = max(0, m.start() - 20)
                src_end = min(len(text), m.end() + 20)
                source = text[src_start:src_end].strip()
                candidates.append({
                    "field": key,
                    "value": v,
                    "confidence": 0.75,
                    "source_text": source,
                })
                break  # first match wins
    return candidates


def build_review_table(candidates: List[Dict[str, Any]], field_keys: List[str]) -> Dict[str, Any]:
    """Build a review table: for every expected field, what's extracted and confidence."""
    found = {c["field"]: c for c in candidates}
    rows = []
    for key in field_keys:
        c = found.get(key)
        rows.append({
            "field": key,
            "value": c["value"] if c else None,
            "confidence": c["confidence"] if c else 0.0,
            "source_text": c["source_text"] if c else None,
            "uncertain": c is None or c["confidence"] < 0.8,
            "missing": c is None,
        })
    return {
        "rows": rows,
        "extracted_count": sum(1 for r in rows if r["value"] is not None),
        "missing_count": sum(1 for r in rows if r["value"] is None),
        "uncertain_count": sum(1 for r in rows if r["value"] is not None and r["confidence"] < 0.8),
        "note": "Review and edit every value. The values shown are candidates extracted from the uploaded text — they have not been used for any inference yet.",
    }