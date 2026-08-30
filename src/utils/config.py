"""Central config — mirrors ~/Projects/SIH26139 merged plan"""
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
DATA_RAW = ROOT / "data/raw"
DATA_PROCESSED = ROOT / "data/processed"
MODELS_PREPROCESSING = ROOT / "models/preprocessing"
MODELS_CLASSICAL = ROOT / "models/classical"
MODELS_QUANTUM = ROOT / "models/quantum"
RESULTS_METRICS = ROOT / "results/metrics"
RESULTS_CM = ROOT / "results/confusion_matrices"
RESULTS_COMPARISON = ROOT / "results/comparison"

# Default hyperparams (solo-proof: fit 680M)
DEFAULT_QUBITS = 8
DEFAULT_PCA_COMPONENTS = 8
DEFAULT_SHOTS = 512
DEFAULT_VQC_ITER = 100
DEFAULT_TEST_SIZE = 0.2
RANDOM_STATE = 42

# Dataset feature orders (for backend validation)
HEART_FEATURES = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]
DIABETES_FEATURES = ["Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin","BMI","DiabetesPedigreeFunction","Age"]
# New datasets (added 2026-08-31 from UCI raw, fit-on-train only, PCA 8 -> 8 qubits)
BREAST_CANCER_FEATURES = [
    "radius_mean","texture_mean","perimeter_mean","area_mean","smoothness_mean",
    "compactness_mean","concavity_mean","concave_points_mean","symmetry_mean","fractal_dimension_mean",
    "radius_se","texture_se","perimeter_se","area_se","smoothness_se",
    "compactness_se","concavity_se","concave_points_se","symmetry_se","fractal_dimension_se",
    "radius_worst","texture_worst","perimeter_worst","area_worst","smoothness_worst",
    "compactness_worst","concavity_worst","concave_points_worst","symmetry_worst","fractal_dimension_worst",
]
LIVER_FEATURES = ["Age","Gender","Total_Bilirubin","Direct_Bilirubin","Alkaline_Phosphotase",
                  "Alamine_Aminotransferase","Aspartate_Aminotransferase","Total_Protiens","Albumin","Albumin_and_Globulin_Ratio"]
PARKINSONS_FEATURES = [
    "MDVP:Fo(Hz)","MDVP:Fhi(Hz)","MDVP:Flo(Hz)","MDVP:Jitter(%)","MDVP:Jitter(Abs)",
    "MDVP:RAP","MDVP:PPQ","Jitter:DDP","MDVP:Shimmer","MDVP:Shimmer(dB)",
    "Shimmer:APQ3","Shimmer:APQ5","MDVP:APQ","Shimmer:DDA","NHR","HNR",
    "RPDE","DFA","spread1","spread2","D2","PPE",
]

# Ensure dirs
for p in [DATA_RAW, DATA_PROCESSED, MODELS_PREPROCESSING, MODELS_CLASSICAL, MODELS_QUANTUM, RESULTS_METRICS, RESULTS_CM, RESULTS_COMPARISON]:
    p.mkdir(parents=True, exist_ok=True)
