"""Explainability / RAG-style evidence service — backend/services/explainability.py

Per the SIH 26139 guide, this is an "evidence/explanation layer" that runs
AFTER the model produces its screening output. It does NOT decide the
disease result — the model does. This service provides:

  1. Plain-language explanation of what the result and contributors mean
  2. Trusted evidence references (curated, not scraped)
  3. Next-step guidance

The knowledge base is a curated, static dict of disease -> [evidence entries].
This is intentionally a small, transparent dataset — not a vector DB.
The project has no production RAG; this is a research demonstration
that mirrors the RAG pattern in a transparent, auditable way.
"""
from typing import Dict, List, Any


# Curated evidence per disease. Each entry: title, summary, source, url.
# These are illustrative references for a research demo — not a substitute
# for professional medical information.
EVIDENCE: Dict[str, List[Dict[str, str]]] = {
    "heart": [
        {
            "title": "Age and cardiovascular risk",
            "summary": "Age is a non-modifiable risk factor for coronary artery disease. Risk increases sharply after age 45 in men and 55 in women.",
            "source": "AHA — Understand Your Risks to Prevent a Heart Attack",
            "url": "https://www.heart.org/en/health-topics/heart-attack/understand-your-risks-to-prevent-a-heart-attack",
        },
        {
            "title": "ST depression on exercise testing",
            "summary": "ST-segment depression during or after exercise stress testing is a classical indicator of myocardial ischemia, and correlates strongly with the extent of coronary artery disease.",
            "source": "Fletcher GF et al. — Exercise Standards for Testing and Training (AHA Scientific Statement)",
            "url": "https://www.ahajournals.org/journal/circ",
        },
        {
            "title": "Chest pain types and cardiac origin",
            "summary": "Typical angina (chest pain triggered by exertion) has higher predictive value for coronary disease than atypical or non-anginal pain.",
            "source": "Diamond GA — A clinically relevant classification of chest discomfort (JACC, 1983)",
            "url": "https://www.jacc.org",
        },
    ],
    "diabetes": [
        {
            "title": "Plasma glucose and diabetes screening",
            "summary": "Fasting plasma glucose above 126 mg/dl (or HbA1c above 6.5%) on two occasions indicates diabetes. Values between 100–125 mg/dl indicate pre-diabetes.",
            "source": "American Diabetes Association — Standards of Medical Care in Diabetes",
            "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
        },
        {
            "title": "BMI and Type 2 diabetes risk",
            "summary": "BMI above 30 is strongly associated with insulin resistance and Type 2 diabetes. Modest weight loss (5–7%) substantially reduces risk.",
            "source": "CDC — Diabetes Risk Factors",
            "url": "https://www.cdc.gov/diabetes/risk-factors/index.html",
        },
    ],
    "liver": [
        {
            "title": "Liver function tests and hepatic pathology",
            "summary": "Elevated ALT, AST, and bilirubin together suggest hepatocellular injury. Alkaline phosphatase elevation with normal ALT may indicate cholestasis.",
            "source": "American College of Gastroenterology — Liver Chemistry Tests",
            "url": "https://gi.org/guideline/liver-chemistry-tests/",
        },
    ],
    "parkinsons": [
        {
            "title": "Voice features and Parkinson's detection",
            "summary": "Vocal-fold irregularities (jitter, shimmer, reduced harmonic-to-noise ratio) are among the earliest measurable signs of Parkinson's disease, often appearing before motor symptoms.",
            "source": "Little MA et al. — Exploiting Nonlinear Recurrence and Fractal Scaling Properties for Voice Disorder Detection (BioMed Eng OnLine, 2007)",
            "url": "https://doi.org/10.1186/1475-925X-6-23",
        },
    ],
    "breast_cancer": [
        {
            "title": "Tumor geometry features and malignancy",
            "summary": "Larger radius, higher concavity, and greater concave-points are strongly associated with malignant lesions in fine-needle aspirate images.",
            "source": "Street WN, Wolberg WH, Mangasarian OL — Nuclear feature extraction for breast tumor diagnosis (SPIE, 1993)",
            "url": "https://doi.org/10.1117/12.148698",
        },
    ],
    "musa_hcv": [
        {
            "title": "Hepatitis C and liver enzymes",
            "summary": "Elevated ALT/AST with low albumin and altered A/G ratio are common biochemical markers in hepatitis C pathology.",
            "source": "WHO — Hepatitis C Fact Sheet",
            "url": "https://www.who.int/news-room/fact-sheets/detail/hepatitis-c",
        },
        {
            "title": "Screening for hepatitis C infection",
            "summary": "CDC recommends one-time screening for all adults and periodic testing for people with ongoing risk factors; anti-HCV antibody tests followed by RNA testing confirm active infection.",
            "source": "CDC — Hepatitis C Screening and Testing",
            "url": "https://www.cdc.gov/hepatitis-c/hcp/testing-diagnosis/",
        },
    ],
    "musa_heart": [
        {
            "title": "Age and cardiovascular risk",
            "summary": "Age is a non-modifiable risk factor for coronary artery disease. Risk increases sharply after age 45 in men and 55 in women.",
            "source": "AHA — Understand Your Risks to Prevent a Heart Attack",
            "url": "https://www.heart.org/en/health-topics/heart-attack/understand-your-risks-to-prevent-a-heart-attack",
        },
        {
            "title": "ST depression on exercise testing",
            "summary": "ST-segment depression during or after exercise stress testing is a classical indicator of myocardial ischemia, and correlates strongly with the extent of coronary artery disease.",
            "source": "Fletcher GF et al. — Exercise Standards for Testing and Training (AHA Scientific Statement)",
            "url": "https://www.ahajournals.org/journal/circ",
        },
    ],
    "musa_diabetes": [
        {
            "title": "HbA1c and diabetes classification",
            "summary": "HbA1c above 6.5% indicates diabetes; 5.7–6.4% indicates pre-diabetes. HbA1c reflects average glycemia over the preceding ~3 months.",
            "source": "American Diabetes Association — Standards of Medical Care in Diabetes",
            "url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
        },
        {
            "title": "Lipid profile and insulin resistance",
            "summary": "High triglycerides with low HDL cholesterol is the classic dyslipidemia of insulin resistance and Type 2 diabetes risk.",
            "source": "CDC — Diabetes Risk Factors",
            "url": "https://www.cdc.gov/diabetes/risk-factors/index.html",
        },
    ],
}


# Plain-language description per contributor key. The model returns
# `top_features` as raw keys; we map them to user-friendly text.
CONTRIBUTOR_LABELS: Dict[str, str] = {
    "age": "age",
    "sex": "sex",
    "cp": "chest pain type",
    "trestbps": "resting blood pressure",
    "chol": "cholesterol level",
    "fbs": "fasting blood sugar",
    "restecg": "resting ECG result",
    "thalach": "maximum heart rate",
    "exang": "exercise-induced angina",
    "oldpeak": "ST depression",
    "slope": "ST slope",
    "ca": "number of major vessels",
    "thal": "thalassemia type",
    "Pregnancies": "number of pregnancies",
    "Glucose": "plasma glucose",
    "BloodPressure": "diastolic blood pressure",
    "SkinThickness": "triceps skin-fold thickness",
    "Insulin": "2-hour serum insulin",
    "BMI": "body-mass index",
    "DiabetesPedigreeFunction": "diabetes pedigree function",
    "Total_Bilirubin": "total bilirubin",
    "Direct_Bilirubin": "direct bilirubin",
    "Alkaline_Phosphotase": "alkaline phosphatase",
    "Alamine_Aminotransferase": "ALT (alanine transaminase)",
    "Aspartate_Aminotransferase": "AST (aspartate transaminase)",
    "Total_Protiens": "total protein",
    "Albumin": "serum albumin",
    "Albumin_and_Globulin_Ratio": "A/G ratio",
    "MDVP:Fo(Hz)": "average vocal fundamental frequency",
    "MDVP:Fhi(Hz)": "maximum vocal fundamental frequency",
    "MDVP:Flo(Hz)": "minimum vocal fundamental frequency",
    "MDVP:Jitter(%)": "jitter percent",
    "PPE": "pitch period entropy",
    "DFA": "signal fractal scaling",
    "RPDE": "recurrence period density entropy",
    "radius_mean": "mean radius of cell nuclei",
    "concavity_mean": "mean severity of concave portions",
    "concave_points_mean": "mean number of concave portions",
    # Musa HCV module (12 blood biomarkers)
    "ALB": "albumin",
    "ALP": "alkaline phosphatase",
    "ALT": "alanine transaminase (ALT)",
    "AST": "aspartate transaminase (AST)",
    "BIL": "bilirubin",
    "CHE": "cholinesterase",
    "CHOL": "cholesterol",
    "CREA": "creatinine",
    "GGT": "gamma-glutamyl transferase",
    "PROT": "total protein",
    # Musa diabetes module (cohort z-scored labs)
    "Urea": "urea",
    "Cr": "creatinine",
    "HbA1c": "HbA1c (glycated hemoglobin)",
    "TG": "triglycerides",
    "HDL": "HDL cholesterol",
    "LDL": "LDL cholesterol",
    "VLDL": "VLDL cholesterol",
}


def explain_disease_result(
    disease: str,
    risk: str,
    contributors: List[str],
    model_version: str = "vqc_8qubit",
) -> Dict[str, Any]:
    """Build an explanation object for a disease prediction.

    Returns: {
      'summary': str,         # 2-3 sentences
      'contributor_text': [str],   # human-readable feature names
      'evidence': [...],       # trusted evidence entries
      'next_steps': [str],     # plain-language guidance
    }
    """
    disease_key = disease
    # Map display name to key
    if disease_key not in EVIDENCE:
        for k in EVIDENCE:
            if k in disease_key:
                disease_key = k
                break

    contributors_text = [CONTRIBUTOR_LABELS.get(c, c) for c in (contributors or [])]
    evidence = EVIDENCE.get(disease_key, [])

    # Extractive RAG layer (additive, post-prediction only): tries the curated
    # data/kb/* knowledge base and falls back to the static evidence above on
    # ANY failure — including RAG_ENABLED=0, unknown disease, or empty KB.
    # Retrieval can never alter the prediction; it only supplies cited prose.
    rag_meta = {"used": False, "mode": "curated"}
    retrieved_guidance = ""
    try:
        from backend.services import rag_service as _rag

        hit = _rag.retrieve(disease_key, contributors or [], risk)
        if hit:
            evidence = hit["evidence"]
            rag_meta = hit["rag"]
            if hit["summary_sentences"]:
                retrieved_guidance = (
                    " Related clinical guidance notes: "
                    + " ".join(hit["summary_sentences"])
                )
    except Exception:
        pass

    risk_lower = (risk or "").lower()
    if risk_lower == "high":
        summary = (
            f"The screening models flag a higher-risk pattern. "
            f"The most influential clinical features in this estimate are: "
            f"{', '.join(contributors_text[:3]) if contributors_text else 'no specific features highlighted'}."
            f"{retrieved_guidance} "
            f"This is a screening aid, not a diagnosis — please consult a clinician."
        )
        next_steps = [
            "Schedule a follow-up with a qualified clinician.",
            "Bring the screening summary report (downloadable from the Results page).",
            "Do not start, stop, or change any medication based on this result alone.",
        ]
    elif risk_lower == "moderate":
        summary = (
            f"The screening models flag a moderate-risk pattern. "
            f"The most influential features are: "
            f"{', '.join(contributors_text[:3]) if contributors_text else 'no specific features highlighted'}."
            f"{retrieved_guidance} "
            f"Consider a follow-up clinical visit to confirm."
        )
        next_steps = [
            "Discuss these results with a clinician at your next visit.",
            "Track the highlighted features over time.",
        ]
    else:
        summary = (
            f"The screening models do not flag a high-risk pattern for this input. "
            f"The highlighted features ({', '.join(contributors_text[:3]) if contributors_text else '—'}) "
            f"are within commonly observed ranges.{retrieved_guidance} "
            f"Continue regular health check-ups."
        )
        next_steps = [
            "Continue routine health monitoring as recommended by your clinician.",
        ]

    return {
        "summary": summary,
        "contributor_text": contributors_text,
        "evidence": evidence,
        "next_steps": next_steps,
        "model_version": model_version,
        "rag": rag_meta,
    }