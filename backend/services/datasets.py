"""Dataset registry — backend/services/datasets.py

Two categories:
  legacy : 5 UCI datasets (heart, diabetes, breast_cancer, liver, parkinsons).
           Raw clinical units in -> sklearn imputer/scaler/PCA(8) -> classical
           clf + PennyLane VQC (params.npy).
  musa   : 3 modules from github.com/Musa2609/SIH- (heart, hcv, diabetes_musa).
           Raw clinical units in -> the team's own fitted imputer/scaler/PCA(4)
           -> best joblib ML model + PennyLane/PyTorch VQC (.pt weights).

Field descriptors here are served from the API so the UI can render forms
without hardcoding a second copy of clinical ranges.
"""


def _f(key, label, unit, lo, hi, ex, step=None, help=""):
    """Numeric field descriptor."""
    return {
        "key": key, "label": label, "unit": unit,
        "min": lo, "max": hi, "example": ex,
        "step": step if step is not None else max((hi - lo) / 100.0, 1e-6),
        "help": help,
    }


def _sel(key, label, unit, lo, hi, options, ex):
    """Categorical (integer-coded) field descriptor."""
    d = _f(key, label, unit, lo, hi, ex)
    d["options"] = options
    return d


SEX_OPTS = [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}]

# ---------------------------------------------------------------- legacy 5

LEGACY_REGISTRY: dict = {
    "heart": {
        "name": "Heart Disease (UCI Cleveland)",
        "source": "UCI #45 Cleveland Clinic Foundation, 303x13",
        "classes": {0: "No CAD", 1: "CAD present"},
        "fields": [
            _f("age", "AGE", "yrs", 29, 77, 52, step=1),
            _sel("sex", "SEX", "0F 1M", 0, 1, SEX_OPTS, 1),
            _sel("cp", "CHEST PAIN", "0-3", 0, 3,
                 [{"value": 0, "label": "typical angina"}, {"value": 1, "label": "atypical angina"},
                  {"value": 2, "label": "non-anginal"}, {"value": 3, "label": "asymptomatic"}], 0),
            _f("trestbps", "RESTING BP", "mmHg", 94, 200, 125),
            _f("chol", "CHOLESTEROL", "mg/dl", 126, 564, 212),
            _sel("fbs", "FASTING BS >120", "0/1", 0, 1,
                 [{"value": 0, "label": "false"}, {"value": 1, "label": "true"}], 0),
            _sel("restecg", "REST ECG", "0-2", 0, 2,
                 [{"value": 0, "label": "normal"}, {"value": 1, "label": "ST-T abnormality"},
                  {"value": 2, "label": "LVH"}], 1),
            _f("thalach", "MAX HEART RATE", "bpm", 71, 202, 168),
            _sel("exang", "EXERCISE ANGINA", "0/1", 0, 1,
                 [{"value": 0, "label": "no"}, {"value": 1, "label": "yes"}], 0),
            _f("oldpeak", "ST DEPRESSION", "mm", 0, 6.2, 1.0, step=0.1),
            _sel("slope", "ST SLOPE", "0-2", 0, 2,
                 [{"value": 0, "label": "upsloping"}, {"value": 1, "label": "flat"},
                  {"value": 2, "label": "downsloping"}], 2),
            _f("ca", "MAJOR VESSELS", "0-4", 0, 4, 0, step=1),
            _sel("thal", "THAL", "0-3", 0, 3,
                 [{"value": 0, "label": "normal (3)"}, {"value": 1, "label": "fixed defect (6)"},
                  {"value": 2, "label": "reversible defect (7)"}, {"value": 3, "label": "unspecified"}], 2),
        ],
    },
    "diabetes": {
        "name": "Diabetes (Pima Indians)",
        "source": "UCI Pima Indians Diabetes, 768x8",
        "classes": {0: "Non-diabetic", 1: "Diabetic"},
        "fields": [
            _f("Pregnancies", "PREGNANCIES", "n", 0, 17, 3, step=1),
            _f("Glucose", "GLUCOSE", "mg/dl", 0, 199, 120),
            _f("BloodPressure", "BLOOD PRESSURE", "mmHg", 0, 122, 70),
            _f("SkinThickness", "SKIN THICKNESS", "mm", 0, 99, 32),
            _f("Insulin", "INSULIN", "mu U/ml", 0, 846, 80),
            _f("BMI", "BMI", "kg/m2", 0, 67, 32.0, step=0.1),
            _f("DiabetesPedigreeFunction", "PEDIGREE FUNC", "-", 0.078, 2.42, 0.47, step=0.001),
            _f("Age", "AGE", "yrs", 21, 81, 33, step=1),
        ],
    },
}

BREAST_CANCER_FIELDS = [
    _f("radius_mean", "RADIUS (M)", "um", 6.981, 28.11, 14.1, step=0.01),
    _f("texture_mean", "TEXTURE (M)", "sigma", 9.71, 39.28, 19.3, step=0.01),
    _f("perimeter_mean", "PERIMETER (M)", "um", 43.79, 188.5, 92.0, step=0.01),
    _f("area_mean", "AREA (M)", "um2", 143.5, 2501.0, 654.0, step=0.1),
    _f("smoothness_mean", "SMOOTHNESS (M)", "-", 0.0526, 0.1634, 0.096, step=0.001),
    _f("compactness_mean", "COMPACTNESS (M)", "-", 0.0194, 0.3454, 0.104, step=0.001),
    _f("concavity_mean", "CONCAVITY (M)", "-", 0.0, 0.4268, 0.089, step=0.001),
    _f("concave_points_mean", "CONCAVE PTS (M)", "-", 0.0, 0.2012, 0.049, step=0.001),
    _f("symmetry_mean", "SYMMETRY (M)", "-", 0.106, 0.304, 0.181, step=0.001),
    _f("fractal_dimension_mean", "FRACTAL DIM (M)", "-", 0.05, 0.0974, 0.062, step=0.0001),
    _f("radius_se", "RADIUS (SE)", "um", 0.112, 2.873, 0.406, step=0.001),
    _f("texture_se", "TEXTURE (SE)", "sigma", 0.36, 4.885, 1.22, step=0.001),
    _f("perimeter_se", "PERIMETER (SE)", "um", 0.757, 21.98, 2.87, step=0.001),
    _f("area_se", "AREA (SE)", "um2", 6.802, 542.2, 43.8, step=0.1),
    _f("smoothness_se", "SMOOTHNESS (SE)", "-", 0.0017, 0.031, 0.007, step=0.0001),
    _f("compactness_se", "COMPACTNESS (SE)", "-", 0.0023, 0.1354, 0.025, step=0.0001),
    _f("concavity_se", "CONCAVITY (SE)", "-", 0.0, 0.396, 0.032, step=0.0001),
    _f("concave_points_se", "CONCAVE PTS (SE)", "-", 0.0, 0.0528, 0.012, step=0.0001),
    _f("symmetry_se", "SYMMETRY (SE)", "-", 0.0079, 0.079, 0.021, step=0.0001),
    _f("fractal_dimension_se", "FRACTAL DIM (SE)", "-", 0.0009, 0.0298, 0.004, step=0.0001),
    _f("radius_worst", "RADIUS (W)", "um", 7.93, 36.04, 15.7, step=0.01),
    _f("texture_worst", "TEXTURE (W)", "sigma", 12.02, 49.54, 25.7, step=0.01),
    _f("perimeter_worst", "PERIMETER (W)", "um", 50.41, 251.2, 103.0, step=0.01),
    _f("area_worst", "AREA (W)", "um2", 185.2, 4254.0, 782.0, step=0.1),
    _f("smoothness_worst", "SMOOTHNESS (W)", "-", 0.0712, 0.2226, 0.132, step=0.001),
    _f("compactness_worst", "COMPACTNESS (W)", "-", 0.0273, 1.058, 0.254, step=0.001),
    _f("concavity_worst", "CONCAVITY (W)", "-", 0.0, 1.252, 0.272, step=0.001),
    _f("concave_points_worst", "CONCAVE PTS (W)", "-", 0.0, 0.291, 0.115, step=0.001),
    _f("symmetry_worst", "SYMMETRY (W)", "-", 0.1565, 0.6638, 0.289, step=0.001),
    _f("fractal_dimension_worst", "FRACTAL DIM (W)", "-", 0.055, 0.2075, 0.081, step=0.0001),
]

LEGACY_REGISTRY["breast_cancer"] = {
    "name": "Breast Cancer (WDBC)",
    "source": "UCI WDBC, 569x30",
    "classes": {0: "Benign", 1: "Malignant"},
    "fields": BREAST_CANCER_FIELDS,
}

LEGACY_REGISTRY["liver"] = {
    "name": "Liver Disease (ILPD)",
    "source": "UCI ILPD, 583x10",
    "classes": {0: "Healthy liver", 1: "Liver patient"},
    "fields": [
        _f("Age", "AGE", "yrs", 4, 90, 45, step=1),
        _sel("Gender", "GENDER", "0F 1M", 0, 1, SEX_OPTS, 1),
        _f("Total_Bilirubin", "TOTAL BILIRUBIN", "mg/dl", 0.3, 75.0, 1.0, step=0.1),
        _f("Direct_Bilirubin", "DIRECT BILIRUBIN", "mg/dl", 0.1, 19.7, 0.3, step=0.1),
        _f("Alkaline_Phosphotase", "ALK PHOSPHATASE", "IU/L", 63, 2110, 210, step=1),
        _f("Alamine_Aminotransferase", "SGPT (ALT)", "IU/L", 10, 2000, 35, step=1),
        _f("Aspartate_Aminotransferase", "SGOT (AST)", "IU/L", 10, 4929, 40, step=1),
        _f("Total_Protiens", "TOTAL PROTEINS", "g/dl", 2.7, 9.6, 6.8, step=0.1),
        _f("Albumin", "ALBUMIN", "g/dl", 0.9, 5.5, 3.4, step=0.1),
        _f("Albumin_and_Globulin_Ratio", "A/G RATIO", "-", 0.3, 2.8, 1.0, step=0.1),
    ],
}

LEGACY_REGISTRY["parkinsons"] = {
    "name": "Parkinson's Detection (Oxford)",
    "source": "UCI Oxford Parkinsons, 195x22 voice features",
    "classes": {0: "Healthy", 1: "Parkinson's"},
    "fields": [
        _f("MDVP:Fo(Hz)", "AVG F0", "Hz", 88.33, 260.11, 145.2, step=0.01),
        _f("MDVP:Fhi(Hz)", "MAX F0", "Hz", 102.0, 592.03, 190.5, step=0.01),
        _f("MDVP:Flo(Hz)", "MIN F0", "Hz", 65.48, 239.17, 105.0, step=0.01),
        _f("MDVP:Jitter(%)", "JITTER %", "%", 0.00168, 0.03344, 0.005, step=0.0001),
        _f("MDVP:Jitter(Abs)", "JITTER ABS", "ms", 0.000007, 0.00026, 0.00005, step=0.000001),
        _f("MDVP:RAP", "RAP", "-", 0.00068, 0.02144, 0.003, step=0.0001),
        _f("MDVP:PPQ", "PPQ", "-", 0.00092, 0.01958, 0.003, step=0.0001),
        _f("Jitter:DDP", "JITTER DDP", "-", 0.00204, 0.06433, 0.009, step=0.0001),
        _f("MDVP:Shimmer", "SHIMMER", "-", 0.00954, 0.11908, 0.028, step=0.0001),
        _f("MDVP:Shimmer(dB)", "SHIMMER DB", "dB", 0.085, 1.302, 0.26, step=0.001),
        _f("Shimmer:APQ3", "APQ3", "-", 0.00455, 0.07342, 0.016, step=0.0001),
        _f("Shimmer:APQ5", "APQ5", "-", 0.0057, 0.13795, 0.019, step=0.0001),
        _f("MDVP:APQ", "APQ", "-", 0.00763, 0.14521, 0.022, step=0.0001),
        _f("Shimmer:DDA", "SHIMMER DDA", "-", 0.01364, 0.22027, 0.048, step=0.0001),
        _f("NHR", "NHR", "-", 0.00085, 0.31482, 0.022, step=0.0001),
        _f("HNR", "HNR", "dB", 8.441, 33.047, 22.0, step=0.001),
        _f("RPDE", "RPDE", "-", 0.25657, 0.68515, 0.47, step=0.001),
        _f("DFA", "DFA", "-", 0.57428, 0.82528, 0.71, step=0.001),
        _f("spread1", "SPREAD1", "-", -7.96498, -2.43403, -5.4, step=0.001),
        _f("spread2", "SPREAD2", "-", 0.00627, 0.45049, 0.2, step=0.001),
        _f("D2", "D2", "-", 1.42329, 3.67116, 2.3, step=0.001),
        _f("PPE", "PPE", "-", 0.04454, 0.52737, 0.19, step=0.001),
    ],
}

SEX_MF_OPTS = [{"value": "m", "label": "Male"}, {"value": "f", "label": "Female"}]

MUSA_REGISTRY: dict = {
    "musa_heart": {
        "family": "musa",
        "module": "HEART",
        "name": "Heart Disease — Musa2609/SIH- module",
        "source": "UCI #45 Cleveland, 303x13, seed-42 stratified 80/20",
        "ml": "HistGradientBoosting (91.80% acc)",
        "qml": "4-qubit PennyLane VQC (77.05% acc)",
        "classes": {0: "Absence of significant CAD (<50% stenosis)", 1: "Presence of significant CAD (>=50% stenosis)"},
        "fields": [
            _f("age", "AGE", "yrs", 18, 100, 52, step=1),
            _sel("sex", "SEX", "0F 1M", 0, 1, SEX_OPTS, 1),
            _sel("cp", "CHEST PAIN", "1-4", 1, 4,
                 [{"value": 1, "label": "typical angina"}, {"value": 2, "label": "atypical angina"},
                  {"value": 3, "label": "non-anginal"}, {"value": 4, "label": "asymptomatic"}], 4),
            _f("trestbps", "RESTING BP", "mmHg", 70, 250, 125),
            _f("chol", "CHOLESTEROL", "mg/dl", 100, 600, 212),
            _sel("fbs", "FASTING BS >120", "0/1", 0, 1,
                 [{"value": 0, "label": "false"}, {"value": 1, "label": "true"}], 0),
            _sel("restecg", "REST ECG", "0-2", 0, 2,
                 [{"value": 0, "label": "normal"}, {"value": 1, "label": "ST-T abnormality"},
                  {"value": 2, "label": "LVH"}], 2),
            _f("thalach", "MAX HEART RATE", "bpm", 60, 230, 150),
            _sel("exang", "EXERCISE ANGINA", "0/1", 0, 1,
                 [{"value": 0, "label": "no"}, {"value": 1, "label": "yes"}], 0),
            _f("oldpeak", "ST DEPRESSION", "mm", 0, 10, 1.0, step=0.1),
            _sel("slope", "ST SLOPE", "1-3", 1, 3,
                 [{"value": 1, "label": "upsloping"}, {"value": 2, "label": "flat"},
                  {"value": 3, "label": "downsloping"}], 3),
            _f("ca", "MAJOR VESSELS", "0-3", 0, 3, 0, step=1),
            _sel("thal", "THAL", "3/6/7", 3, 7,
                 [{"value": 3, "label": "normal"}, {"value": 6, "label": "fixed defect"},
                  {"value": 7, "label": "reversible defect"}], 6),
        ],
    },
    "musa_hcv": {
        "family": "musa",
        "module": "HCV",
        "name": "Hepatitis C — Musa2609/SIH- module",
        "source": "UCI #571 hcvdat0, 615x12, seed-42 stratified 80/20",
        "ml": "XGBoost (98.37% acc)",
        "qml": "4-qubit PennyLane VQC (91.87% acc)",
        "classes": {0: "Healthy / blood-donor control", 1: "HCV-related pathology (hepatitis/fibrosis/cirrhosis)"},
        "fields": [
            _f("Age", "AGE", "yrs", 18, 100, 45, step=1),
            _sel("Sex", "SEX", "m/f", 0, 1, SEX_MF_OPTS, "m"),
            _f("ALB", "ALBUMIN", "g/L", 10, 70, 38.5, step=0.1),
            _f("ALP", "ALK PHOSPHATASE", "U/L", 5, 500, 52.5, step=0.1),
            _f("ALT", "ALANINE TRANSAMINASE", "U/L", 1, 400, 25.0, step=0.1),
            _f("AST", "ASPARTATE TRANSAMINASE", "U/L", 1, 500, 22.1, step=0.1),
            _f("BIL", "BILIRUBIN", "umol/L", 0.5, 250, 11.0, step=0.1),
            _f("CHE", "CHOLINESTERASE", "kU/L", 0.5, 25, 6.93, step=0.01),
            _f("CHOL", "CHOLESTEROL", "mmol/L", 0.5, 15, 3.23, step=0.01),
            _f("CREA", "CREATININE", "umol/L", 10, 1000, 74.0, step=1),
            _f("GGT", "GAMMA-GT", "U/L", 1, 1000, 12.1, step=0.1),
            _f("PROT", "TOTAL PROTEIN", "g/L", 30, 100, 69.0, step=0.1),
        ],
    },
    "musa_diabetes": {
        "family": "musa",
        "module": "DIABETES",
        "name": "Diabetes (3-class) — Musa2609/SIH- module",
        "source": "Rashid et al., Baghdad Medical City, 264x11, cohort-standardized features",
        "ml": "Random Forest (98.11% acc)",
        "qml": "4-qubit PennyLane VQC (73.58% acc)",
        "classes": {0: "Non-Diabetic", 1: "Pre-Diabetic", 2: "Diabetic"},
        "note": "Inputs are cohort z-scores — the team's published pipeline ships standardized features only.",
        # z-score inputs; examples are real healthy-cohort (Class 0) medoid rows —
        # the pipeline ships standardized features only, so raw units have no mapping.
        "fields": [
            _f("Gender", "GENDER", "z", -5, 5, -1.06, step=0.1, help="−1 ≈ female pole, +1 ≈ male"),
            _f("AGE", "AGE", "z", -5, 5, -0.28, step=0.1, help="relative to cohort median age"),
            _f("Urea", "UREA", "z", -5, 5, -0.28, step=0.1, help="0 = cohort average"),
            _f("Cr", "CREATININE", "z", -5, 5, -0.31, step=0.1, help="0 = cohort average"),
            _f("HbA1c", "HbA1c", "z", -5, 5, -0.76, step=0.1, help="lower z = better glycemia"),
            _f("Chol", "CHOLESTEROL", "z", -5, 5, -0.15, step=0.1, help="0 = cohort average"),
            _f("TG", "TRIGLYCERIDES", "z", -5, 5, -0.57, step=0.1, help="0 = cohort average"),
            _f("HDL", "HDL", "z", -5, 5, -0.20, step=0.1, help="0 = cohort average"),
            _f("LDL", "LDL", "z", -5, 5, 0.49, step=0.1, help="0 = cohort average"),
            _f("VLDL", "VLDL", "z", -5, 5, -0.25, step=0.1, help="0 = cohort average"),
            _f("BMI", "BMI", "z", -5, 5, -0.91, step=0.1, help="0 = cohort average"),
        ],
    },
}

# Musa's own CLI validation ranges (HEART/predict_heart.py FEATURE_RANGES) —
# enforced on the /predict path so inputs stay inside the audited envelope.
MUSA_HEART_RANGES: dict = {
    "age": (18.0, 100.0), "sex": (0.0, 1.0), "cp": (1.0, 4.0),
    "trestbps": (70.0, 250.0), "chol": (100.0, 600.0), "fbs": (0.0, 1.0),
    "restecg": (0.0, 2.0), "thalach": (60.0, 230.0), "exang": (0.0, 1.0),
    "oldpeak": (0.0, 10.0), "slope": (1.0, 3.0), "ca": (0.0, 3.0),
    "thal": (3.0, 7.0),
}


def all_datasets() -> dict:
    """Unified view for /predict-featured & /models: key -> descriptor.

    Serving scope (Sept 2026 decision): ONLY the three Musa2609/SIH- modules.
    The legacy 5-dataset registry (heart, diabetes, breast_cancer, liver,
    parkinsons) is kept above for artifact provenance and potential
    retraining, but is NOT served by the API and NOT selectable in the UI.
    """
    return {k: dict(v) for k, v in MUSA_REGISTRY.items()}


def feature_order(key: str) -> list:
    """Ordered field keys for a dataset id (validation + column order)."""
    reg = all_datasets().get(key)
    if not reg:
        raise KeyError(key)
    return [f["key"] for f in reg["fields"]]




