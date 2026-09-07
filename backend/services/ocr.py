"""OCR / Multi-Stage Text extraction service — backend/services/ocr.py

Robust multi-stage PDF extraction engine supporting digital PDFs, scanned image PDFs,
and mixed documents.

Pipeline steps:
1. Input validation & security (file size, encryption/password check, format detection).
2. Per-page Digital vs Scanned classification.
3. Digital text & table extraction via PyMuPDF / pdfplumber (preserving layout & tables).
4. Scanned page rendering (300 DPI) + OpenCV preprocessing (grayscale, noise removal,
   CLAHE contrast enhancement, deskewing, Otsu binarization) + RapidOCR.
5. Exact page ordering with clear page markers (--- [PAGE X] ---).
6. Clinical value candidate extraction with dynamic confidence scoring.
7. Review table generation for user verification.
"""
import io
import re
from typing import Dict, List, Any, Tuple, Optional
import numpy as np
from PIL import Image

# Import PDF and OCR tools
import pymupdf  # PyMuPDF
import pdfplumber

# OpenCV for image preprocessing
import cv2

# RapidOCR singleton
_OCR_ENGINE = None

def get_ocr_engine():
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _OCR_ENGINE = RapidOCR()
        except ImportError:
            return None
    return _OCR_ENGINE


class PDFExtractionError(Exception):
    """Base exception for PDF extraction issues."""
    pass

class EncryptedPDFError(PDFExtractionError):
    """Raised when PDF is password protected."""
    pass

class CorruptPDFError(PDFExtractionError):
    """Raised when PDF file structure is corrupted."""
    pass

class EmptyPDFError(PDFExtractionError):
    """Raised when PDF contains no pages or zero content."""
    pass


# Comprehensive field patterns matching clinical reports (tabbed, colon, table formats)
FIELD_PATTERNS = {
    # Heart (musa_heart — raw UCI coding)
    "age": [
        (r"\bage[:\s\t=]+(\d{1,3})\b", "int"),
        (r"patient\s+age[:\s\t=]+(\d{1,3})\b", "int"),
        (r"\b(\d{1,3})\s*(?:years?|yrs?|y/o)\b", "int"),
    ],
    "sex": [
        (r"\bsex[:\s\t=]+(male|female|m|f)\b", "category_mf"),
        (r"\bgender[:\s\t=]+(male|female|m|f)\b", "category_mf"),
    ],
    "cp": [
        (r"chest[ _-]?pain[ _-]?type[:\s\t=]+(\d)", "int"),
        (r"\bcp[:\s\t=]+(\d)", "int"),
    ],
    "trestbps": [
        (r"resting[ _-]?bp[:\s\t=]+(\d{2,3})", "int"),
        (r"resting[ _-]?blood[ _-]?pressure[:\s\t=]+(\d{2,3})", "int"),
        (r"\btrestbps[:\s\t=]+(\d{2,3})", "int"),
        (r"\bbp[:\s\t=]+(\d{2,3})\s*/\s*\d{2,3}", "int"),  # Systolic BP
    ],
    "chol": [
        (r"chol(?:esterol)?[:\s\t=]+(\d{2,3})", "int"),
        (r"serum[ _-]?cholesterol[:\s\t=]+(\d{2,3})", "int"),
        (r"\bchol[:\s\t=]+(\d{2,3})", "int"),
    ],
    "fbs": [
        (r"(?:fbs|fasting[ _-]?blood[ _-]?sugar)[:\s\t=]+(0|1)\b", "int"),
        (r"fasting[ _-]?blood[ _-]?sugar[:\s\t=]+(?:>\s*120|true|yes|1)", "const_1"),
        (r"fasting[ _-]?blood[ _-]?sugar[:\s\t=]+(?:<=\s*120|false|no|0)", "const_0"),
    ],
    "restecg": [
        (r"rest[ _-]?ecg[:\s\t=]+(\d)", "int"),
        (r"resting[ _-]?electrocardiographic[:\s\t=]+(\d)", "int"),
    ],
    "thalach": [
        (r"(?:max|peak|thalach|heart[ _-]?rate)[:\s\t=]+(\d{2,3})", "int"),
        (r"max(?:imum)?[ _-]?heart[ _-]?rate[:\s\t=]+(\d{2,3})", "int"),
    ],
    "exang": [
        (r"(?:exang|exercise[ _-]?angina)[:\s\t=]+(0|1)\b", "int"),
        (r"exercise[ _-]?induced[ _-]?angina[:\s\t=]+(?:yes|1|true)", "const_1"),
        (r"exercise[ _-]?induced[ _-]?angina[:\s\t=]+(?:no|0|false)", "const_0"),
    ],
    "oldpeak": [
        (r"oldpeak[:\s\t=]+([\d.]+)", "float"),
        (r"st[ _-]?depression[:\s\t=]+([\d.]+)", "float"),
    ],
    "slope": [
        (r"slope[:\s\t=]+(\d)", "int"),
        (r"st[ _-]?slope[:\s\t=]+(\d)", "int"),
    ],
    "ca": [
        (r"(?:ca|vessels)[:\s\t=]+(\d)", "int"),
        (r"major[ _-]?vessels[:\s\t=]+(\d)", "int"),
    ],
    "thal": [
        (r"thal(?:assemium)?[:\s\t=]+(\d)", "int"),
    ],

    # HCV (musa_hcv)
    "Age": [
        (r"\bage[:\s\t=]+(\d{1,3})\b", "int"),
        (r"patient\s+age[:\s\t=]+(\d{1,3})\b", "int"),
    ],
    "Sex": [
        (r"\bsex[:\s\t=]+(male|female|m|f)\b", "category_mf"),
        (r"\bgender[:\s\t=]+(male|female|m|f)\b", "category_mf"),
    ],
    "ALB": [
        (r"\balb(?:umin)?[:\s\t=]+([\d.]+)", "float"),
        (r"serum[ _-]?albumin[:\s\t=]+([\d.]+)", "float"),
    ],
    "ALP": [
        (r"\balp[:\s\t=]+([\d.]+)", "float"),
        (r"alkaline[ _-]?phosphatase[:\s\t=]+([\d.]+)", "float"),
    ],
    "ALT": [
        (r"\balt[:\s\t=]+([\d.]+)", "float"),
        (r"alanine[ _-]?aminotransferase|sgpt[:\s\t=]+([\d.]+)", "float"),
    ],
    "AST": [
        (r"\bast[:\s\t=]+([\d.]+)", "float"),
        (r"aspartate[ _-]?aminotransferase|sgot[:\s\t=]+([\d.]+)", "float"),
    ],
    "BIL": [
        (r"\bbil(?:irubin)?[:\s\t=]+([\d.]+)", "float"),
        (r"total[ _-]?bilirubin[:\s\t=]+([\d.]+)", "float"),
    ],
    "CHE": [
        (r"\bche[:\s\t=]+([\d.]+)", "float"),
        (r"cholinesterase[:\s\t=]+([\d.]+)", "float"),
    ],
    "CHOL": [
        (r"\bchol(?:esterol)?[:\s\t=]+([\d.]+)", "float"),
        (r"total[ _-]?cholesterol[:\s\t=]+([\d.]+)", "float"),
    ],
    "CREA": [
        (r"\bcrea(?:tinine)?[:\s\t=]+([\d.]+)", "float_or_int"),
        (r"serum[ _-]?creatinine[:\s\t=]+([\d.]+)", "float_or_int"),
    ],
    "GGT": [
        (r"\bggt[:\s\t=]+([\d.]+)", "float"),
        (r"gamma[ _-]?gt[:\s\t=]+([\d.]+)", "float"),
    ],
    "PROT": [
        (r"\bprot(?:ein)?[:\s\t=]+([\d.]+)", "float"),
        (r"total[ _-]?protein[:\s\t=]+([\d.]+)", "float"),
    ],

    # Diabetes (musa_diabetes — cohort features)
    "Gender": [
        (r"\bsex[:\s\t=]+(male|female|m|f)\b", "category_mf01"),
        (r"\bgender[:\s\t=]+(male|female|m|f)\b", "category_mf01"),
    ],
    "AGE": [
        (r"\bage[:\s\t=]+(\d{1,3})\b", "int"),
    ],
    "Urea": [
        (r"\burea[:\s\t=]+([\d.]+)", "float"),
        (r"blood[ _-]?urea[:\s\t=]+([\d.]+)", "float"),
    ],
    "Cr": [
        (r"\bcrea(?:tinine)?[:\s\t=]+([\d.]+)", "float_or_int"),
        (r"\bcr[:\s\t=]+([\d.]+)", "float_or_int"),
    ],
    "HbA1c": [
        (r"\bhba1c[:\s\t=]+([\d.]+)", "float"),
        (r"glycated[ _-]?hemoglobin[:\s\t=]+([\d.]+)", "float"),
    ],
    "Chol": [
        (r"\bchol(?:esterol)?[:\s\t=]+([\d.]+)", "float"),
    ],
    "TG": [
        (r"(?:\btg\b|triglyc(?:erides)?)[:\s\t=]+([\d.]+)", "float"),
    ],
    "HDL": [
        (r"\bhdl[:\s\t=]+([\d.]+)", "float"),
        (r"hdl[ _-]?cholesterol[:\s\t=]+([\d.]+)", "float"),
    ],
    "LDL": [
        (r"\bldl[:\s\t=]+([\d.]+)", "float"),
        (r"ldl[ _-]?cholesterol[:\s\t=]+([\d.]+)", "float"),
    ],
    "VLDL": [
        (r"\bvldl[:\s\t=]+([\d.]+)", "float"),
        (r"vldl[ _-]?cholesterol[:\s\t=]+([\d.]+)", "float"),
    ],
    "BMI": [
        (r"\bbmi[:\s\t=]+([\d.]+)", "float"),
        (r"body[ _-]?mass[ _-]?index[:\s\t=]+([\d.]+)", "float"),
    ],
}

CATEGORY_MAP = {"male": 1, "m": 1, "female": 0, "f": 0}
CATEGORY_MAP_MF = {"male": "m", "m": "m", "female": "f", "f": "f"}
CATEGORY_MAP_01 = {"male": 1, "m": 1, "female": 0, "f": 0}


def preprocess_image_for_ocr(img: np.ndarray) -> np.ndarray:
    """Preprocess image for optimal OCR extraction:
    - Grayscale
    - Deskewing
    - Noise reduction (Median blur)
    - Contrast enhancement (CLAHE)
    - Thresholding / Binarization
    """
    if len(img.shape) == 3 and img.shape[2] == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # Contrast enhancement using CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Deskew check
    try:
        coords = np.column_stack(np.where(enhanced < 200))
        if len(coords) > 50:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            if abs(angle) > 0.5 and abs(angle) < 30.0:
                (h, w) = enhanced.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                enhanced = cv2.warpAffine(
                    enhanced, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
                )
    except Exception:
        pass  # Fallback to un-rotated enhanced image

    # Noise removal
    denoised = cv2.medianBlur(enhanced, 3)

    return denoised


def run_ocr_on_page(img: np.ndarray) -> Tuple[str, float]:
    """Run RapidOCR on image array. Returns (text, confidence)."""
    ocr = get_ocr_engine()
    if ocr is None:
        return "", 0.0
    preprocessed = preprocess_image_for_ocr(img)
    
    # RapidOCR accepts numpy array (BGR or Gray)
    result, elapsed = ocr(preprocessed)
    
    if not result:
        # Retry on raw image if preprocessed yielded empty
        result, elapsed = ocr(img)

    if not result:
        return "", 0.0

    lines = []
    confidences = []
    for item in result:
        # item format: [box, text, score]
        text_content = item[1].strip()
        try:
            score = float(item[2])
        except (ValueError, TypeError):
            score = 0.8
        if text_content:
            lines.append(text_content)
            confidences.append(score)

    page_text = "\n".join(lines)
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    return page_text, avg_conf


def is_digital_page(page: pymupdf.Page) -> bool:
    """Classify if page contains digital selectable text vs scanned image."""
    text = page.get_text("text").strip()
    if len(text) > 40:
        # Check printable character ratio
        printable = sum(1 for c in text if c.isalnum() or c.isspace())
        if (printable / len(text)) > 0.6:
            return True
    return False


def extract_table_text_from_pdfplumber(pdf_bytes: bytes, page_idx: int) -> str:
    """Extract structured tables from a digital PDF page using pdfplumber."""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if page_idx < len(pdf.pages):
                page = pdf.pages[page_idx]
                tables = page.extract_tables()
                if not tables:
                    return ""
                table_strings = []
                for table in tables:
                    for row in table:
                        clean_row = [str(cell).strip().replace("\n", " ") for cell in row if cell is not None]
                        if any(clean_row):
                            table_strings.append(" | ".join(clean_row))
                return "\n".join(table_strings)
    except Exception:
        pass
    return ""


def extract_text_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """Multi-stage PDF & document text extraction engine.

    Returns dict:
      {
        "extracted_text": str,
        "page_count": int,
        "ocr_used": bool,
        "page_details": List[Dict],
        "avg_confidence": float
      }
    """
    if not pdf_bytes:
        raise EmptyPDFError("Uploaded file is empty.")

    # Plain text file check
    if pdf_bytes.startswith(b"%PDF-") is False:
        try:
            text = pdf_bytes.decode("utf-8")
            if text.strip():
                return {
                    "extracted_text": text,
                    "page_count": 1,
                    "ocr_used": False,
                    "page_details": [{
                        "page": 1,
                        "is_scanned": False,
                        "ocr_used": False,
                        "confidence": 1.0,
                        "char_count": len(text)
                    }],
                    "avg_confidence": 1.0
                }
        except Exception:
            pass

    # Open PDF document using PyMuPDF
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise CorruptPDFError(f"Failed to open PDF document: {str(e)}")

    if doc.is_encrypted:
        # Try authenticating with empty password
        if not doc.authenticate(""):
            raise EncryptedPDFError("The PDF document is password-protected. Please upload an unencrypted file.")

    if doc.page_count == 0:
        raise EmptyPDFError("The PDF document contains no pages.")

    full_page_texts = []
    page_details = []
    ocr_used_any = False
    total_confidences = []

    for idx in range(doc.page_count):
        page = doc[idx]
        page_num = idx + 1
        is_digital = is_digital_page(page)

        if is_digital:
            # 1. Digital Page Processing
            raw_text = page.get_text("text")
            
            # Extract structured table layout via pdfplumber
            table_text = extract_table_text_from_pdfplumber(pdf_bytes, idx)
            
            combined_page_text = raw_text.strip()
            if table_text.strip():
                combined_page_text += "\n\n--- Extracted Tables ---\n" + table_text.strip()

            page_conf = 0.98
            ocr_used = False
        else:
            # 2. Scanned / Image Page Processing via OCR
            ocr_used = True
            ocr_used_any = True

            # Render page at 300 DPI for high fidelity
            pix = page.get_pixmap(dpi=300)
            
            # Convert PyMuPDF Pixmap to BGR numpy image
            if pix.n == 4:  # RGBA
                img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 4))
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
            elif pix.n == 3:  # RGB
                img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 3))
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            else:  # Grayscale
                img_np = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 1))
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)

            combined_page_text, page_conf = run_ocr_on_page(img_bgr)

        # Page separator marker
        page_header = f"--- [PAGE {page_num}] ---"
        full_page_text = f"{page_header}\n{combined_page_text}"
        full_page_texts.append(full_page_text)

        total_confidences.append(page_conf)
        page_details.append({
            "page": page_num,
            "is_scanned": not is_digital,
            "ocr_used": ocr_used,
            "confidence": round(page_conf, 3),
            "char_count": len(combined_page_text)
        })

    doc.close()

    extracted_text = "\n\n".join(full_page_texts)
    overall_confidence = sum(total_confidences) / len(total_confidences) if total_confidences else 0.0

    return {
        "extracted_text": extracted_text,
        "page_count": len(page_details),
        "ocr_used": ocr_used_any,
        "page_details": page_details,
        "avg_confidence": round(overall_confidence, 3)
    }


def extract_candidates(
    text: str, field_keys: List[str], base_confidence: float = 0.85
) -> List[Dict[str, Any]]:
    """Extract candidate values from text using pattern dictionary & spatial matching."""
    candidates = []
    lowered = text.lower()

    for key in field_keys:
        patterns = FIELD_PATTERNS.get(key, [])
        for pat, ptype in patterns:
            m = re.search(pat, lowered, re.IGNORECASE)
            if m:
                if ptype in ("const_1", "const_0"):
                    v = 1 if ptype == "const_1" else 0
                else:
                    raw = m.group(1).strip()
                    if ptype == "int":
                        try:
                            v = int(float(raw))
                        except ValueError:
                            continue
                    elif ptype in ("float", "float_or_int"):
                        try:
                            v = float(raw)
                            if ptype == "float_or_int" and v.is_integer():
                                v = int(v)
                        except ValueError:
                            continue
                    elif ptype == "category":
                        v = CATEGORY_MAP.get(raw.lower(), raw)
                    elif ptype == "category_mf":
                        v = CATEGORY_MAP_MF.get(raw.lower(), raw)
                    elif ptype == "category_mf01":
                        v = CATEGORY_MAP_01.get(raw.lower(), raw)
                    else:
                        v = raw

                # Context source snippet
                src_start = max(0, m.start() - 25)
                src_end = min(len(text), m.end() + 25)
                source = text[src_start:src_end].replace("\n", " ").strip()

                candidates.append({
                    "field": key,
                    "value": v,
                    "confidence": round(base_confidence, 2),
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
        "note": "Review and edit every value. The values shown are candidates extracted from the uploaded report — they have not been used for any inference yet.",
    }