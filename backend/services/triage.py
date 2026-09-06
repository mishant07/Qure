"""Triage service — backend/services/triage.py

Rule-based screening triage for the three ACTIVE screening pathways
(Heart, Diabetes, HCV — the Musa2609/SIH- modules). Five yes/no questions
that route a user to relevant disease pathways. Per the SIH 26139 guide:
"It recommends screening pathways; it does not diagnose."
"""
from typing import List, Dict, Any


# Five rule-based questions. Each maps to disease pathways when answered "yes".
# triggers use the active dataset ids (musa_heart / musa_diabetes / musa_hcv).
QUESTIONS = [
    {
        "id": "chest_pain",
        "question": "Have you experienced chest pain, pressure, or discomfort during physical activity or rest in the last 4 weeks?",
        "rationale": "Cardiac-symptom red flag — routes to Heart Disease pathway.",
        "triggers": ["musa_heart"],
    },
    {
        "id": "blood_sugar",
        "question": "Have you had elevated blood sugar, HbA1c, or a previous glucose-tolerance test result above the normal range?",
        "rationale": "Glycemic-symptom red flag — routes to Diabetes pathway.",
        "triggers": ["musa_diabetes"],
    },
    {
        "id": "fatigue_appetite",
        "question": "Have you had persistent fatigue, unexplained weight loss, or loss of appetite over the last few weeks?",
        "rationale": "Constitutional red flag — routes to HCV and Diabetes pathways.",
        "triggers": ["musa_hcv", "musa_diabetes"],
    },
    {
        "id": "liver_history",
        "question": "Do you have a history of liver problems, abnormal liver-function tests, or risk factors (alcohol use, hepatitis exposure, injectable drug use, unscreened blood transfusion)?",
        "rationale": "Hepatic red flag — routes to the HCV (Hepatitis C) pathway.",
        "triggers": ["musa_hcv"],
    },
    {
        "id": "family_history",
        "question": "Do you have a close family history of heart disease or diabetes?",
        "rationale": "Hereditary red flag — routes to Heart and Diabetes pathways.",
        "triggers": ["musa_heart", "musa_diabetes"],
    },
]


def get_questions() -> List[Dict[str, Any]]:
    """Return the triage questions (id, question text, rationale, triggers)."""
    return QUESTIONS


def compute_pathways(answers: Dict[str, str]) -> Dict[str, Any]:
    """Given {question_id: 'yes'|'no'|...}, return recommended pathways.

    Returns:
      {
        'recommended': ['heart', 'diabetes', ...],   # at least one
        'rationale': '...',                          # plain-language summary
        'per_question': {qid: 'triggered' | 'not_triggered'}
      }
    """
    recommended = []
    per_question = {}
    for q in QUESTIONS:
        ans = (answers.get(q["id"]) or "").lower().strip()
        triggered = ans in ("yes", "y", "true", "1")
        per_question[q["id"]] = "triggered" if triggered else "not_triggered"
        if triggered:
            for path in q["triggers"]:
                if path not in recommended:
                    recommended.append(path)

    if not recommended:
        rationale = (
            "Based on your answers, no specific pathway is strongly indicated. "
            "You may still run a generic health screening from the Detect page."
        )
    else:
        # Human-readable pathway names for the active (Musa) modules
        pathway_names = {
            "musa_heart": "Heart Disease",
            "musa_diabetes": "Diabetes",
            "musa_hcv": "Hepatitis C (HCV)",
        }
        names = ", ".join(pathway_names.get(p, p) for p in recommended)
        rationale = (
            f"Based on your answers, we recommend the following screening pathway(s): {names}. "
            "These are screening aids only — not a medical diagnosis."
        )
    return {
        "recommended": recommended,
        "rationale": rationale,
        "per_question": per_question,
    }