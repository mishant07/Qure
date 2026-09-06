from pydantic import BaseModel
from typing import Dict, List, Any, Optional


class PredictRequest(BaseModel):
    """POST /predict body. features is a flat dict of raw clinical values keyed
    by the dataset's field names (see GET /models for the registry)."""
    dataset: str
    features: dict


class TriageAnswer(BaseModel):
    """One answered question."""
    question_id: str
    answer: str  # 'yes' | 'no' | 'true' | 'false' | '1' | '0'


class TriageRequest(BaseModel):
    """POST /api/triage body."""
    answers: List[TriageAnswer]


class OCRReviewConfirmRequest(BaseModel):
    """POST /api/validate-report body: user-confirmed values for the fields."""
    disease: str
    features: Dict[str, Any]


class ReportRequest(BaseModel):
    """POST /api/report body."""
    disease: str
    inputs: Dict[str, Any]
    result: Dict[str, Any]