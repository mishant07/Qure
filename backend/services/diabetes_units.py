"""Raw-clinical → cohort z-score transform for the musa_diabetes module.

Context
-------
The Musa2609/SIH- DIABETES pipeline consumes **cohort-standardized z-scores**
(the shipped `scaler.joblib` is an identity transform and no raw mean/std was
ever committed). To show a human-readable clinical form (AGE in years, lipids
in mmol/L, …) — consistent with the HEART and HCV modules — this module stores
the per-feature mean/std computed from the **authoritative raw dataset** and
converts raw input → z on the backend before inference.

Source of the transform constants
---------------------------------
Rashid et al. (2020) — Diabetes dataset, Baghdad Medical City Hospital, N = 264.
Mirrored publicly (Mendeley Data) as `patient_records` in
`github.com/micheask/Diabtetes-Dataset` (diabetes_data.db).
Columns: Gender, AGE, Urea, Cr, HbA1c, Chol, TG, HDL, LDL, VLDL, BMI, Class.

Validation
----------
Re-standardizing that raw N=264 set with these constants and running the shipped
Random Forest reproduces the true class labels at 99.6% accuracy, and the
resulting gender z-poles (−1.093 / +0.911) match the test-split poles the model
was evaluated on (−1.064 / +0.940). The transform is therefore faithful to the
training pipeline.
"""
from __future__ import annotations

# Feature order matches DS.feature_order("musa_diabetes") and the RF/VQC training.
KEYS = ["Gender", "AGE", "Urea", "Cr", "HbA1c", "Chol", "TG", "HDL", "LDL", "VLDL", "BMI"]

# Raw clinical units the UI/API accept (documentation only — transform is unit-agnostic).
UNITS = {
    "Gender": "F/M", "AGE": "yrs", "Urea": "mmol/L", "Cr": "µmol/L", "HbA1c": "%",
    "Chol": "mmol/L", "TG": "mmol/L", "HDL": "mmol/L", "LDL": "mmol/L",
    "VLDL": "mmol/L", "BMI": "kg/m²",
}

# Mean / standard deviation per feature (whole-cohort, N=264), Rashid et al. (2020).
MEAN = {
    "Gender": 0.5454, "AGE": 49.523, "Urea": 5.672, "Cr": 85.807, "HbA1c": 6.863,
    "Chol": 4.594, "TG": 2.152, "HDL": 1.183, "LDL": 2.531, "VLDL": 1.479, "BMI": 26.627,
}
STD = {
    "Gender": 0.4987, "AGE": 10.127, "Urea": 4.003, "Cr": 99.400, "HbA1c": 2.545,
    "Chol": 1.289, "TG": 1.266, "HDL": 0.456, "LDL": 1.000, "VLDL": 3.100, "BMI": 5.094,
}

# Normalize the many spellings of sex to the numeric coding the model saw (0 = F, 1 = M).
GENDER_MAP = {
    "Female": 0.0, "female": 0.0, "F": 0.0, "f": 0.0, "0": 0.0,
    "Male": 1.0, "male": 1.0, "M": 1.0, "m": 1.0, "1": 1.0,
}


def to_z(raw: dict) -> dict:
    """Map a raw clinical feature dict → cohort z-score dict (all features)."""
    out = {}
    for k in KEYS:
        v = raw[k]
        if k == "Gender":
            v = GENDER_MAP.get(v, GENDER_MAP.get(str(v).strip(), float(v)))
        out[k] = (float(v) - MEAN[k]) / STD[k]
    return out