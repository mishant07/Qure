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

# Ensure dirs
for p in [DATA_RAW, DATA_PROCESSED, MODELS_PREPROCESSING, MODELS_CLASSICAL, MODELS_QUANTUM, RESULTS_METRICS, RESULTS_CM, RESULTS_COMPARISON]:
    p.mkdir(parents=True, exist_ok=True)
