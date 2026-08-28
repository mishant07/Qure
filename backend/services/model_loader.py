import pathlib, json, joblib

# Supports both new layout (models/preprocessing|classical) and legacy (backend/models)
_cache = {}

def load_pipeline(dataset: str):
    if dataset in _cache:
        return _cache[dataset]
    # Try new layout first
    new_imputer = pathlib.Path(f"models/preprocessing/imputer_{dataset}.pkl")
    new_scaler = pathlib.Path(f"models/preprocessing/scaler_{dataset}.pkl")
    new_pca = pathlib.Path(f"models/preprocessing/pca_{dataset}.pkl")
    new_best = pathlib.Path(f"models/classical/best_classical_{dataset}.json")
    # Fallback legacy
    legacy_dir = pathlib.Path("backend/models")
    if not new_imputer.exists() and legacy_dir.exists():
        new_imputer = legacy_dir / f"imputer_{dataset}.pkl"
        new_scaler = legacy_dir / f"scaler_{dataset}.pkl"
        new_pca = legacy_dir / f"pca_{dataset}.pkl"
        new_best = legacy_dir / f"best_classical_{dataset}.json"

    imputer = joblib.load(new_imputer)
    scaler = joblib.load(new_scaler)
    pca = joblib.load(new_pca)

    best_name = json.loads(new_best.read_text())["best"] if new_best.exists() else "svm"
    # Try new classical path
    clf_path = pathlib.Path(f"models/classical/{best_name}_{dataset}.pkl")
    if not clf_path.exists():
        clf_path = pathlib.Path(f"models/classical/svm_{dataset}.pkl")
    if not clf_path.exists():
        clf_path = pathlib.Path(f"backend/models/{best_name}_{dataset}.pkl")
    clf = joblib.load(clf_path)

    qsvm_path = pathlib.Path(f"models/quantum/qsvm_{dataset}.pkl")
    if not qsvm_path.exists():
        qsvm_path = pathlib.Path(f"backend/models/qsvm_{dataset}.pkl")
    qsvm = joblib.load(qsvm_path) if qsvm_path.exists() else None

    _cache[dataset] = (imputer, scaler, pca, clf, best_name, qsvm)
    return _cache[dataset]
