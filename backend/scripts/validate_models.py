"""Validation harness — backend/scripts/validate_models.py

Reproduces every model's published test metrics from the artifacts actually
shipped in this backend. No tolerance games: exact splits (seed 42), exact
preprocessing order, exact circuit. Exit code 1 if any check drifts > 0.01.

Run: .venv/bin/python backend/scripts/validate_models.py
"""
import json
import pathlib
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score

PROJ = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJ))

from backend.services import datasets as DS  # noqa: E402
from backend.services.model_loader import load_pipeline  # noqa: E402
from backend.services.musa_service import MUSA_DIR  # noqa: E402
from backend.services.musa_vqc import MusaVQCRuntime  # noqa: E402
from backend.services import predictor  # noqa: E402

RESULTS = []


def check(name, acc, f1, pub_acc, pub_f1, tol=0.01):
    ok = abs(acc - pub_acc) <= tol and abs(f1 - pub_f1) <= tol
    RESULTS.append((name, acc, f1, pub_acc, pub_f1, ok))
    flag = "PASS" if ok else "FAIL"
    print(f"  [{flag}] {name:38s} acc {acc:.4f} (pub {pub_acc:.4f})  f1 {f1:.4f} (pub {pub_f1:.4f})")


def f1_for(y_true, y_pred):
    """Binary F1 for 2-class problems, Macro F1 otherwise (matches the JSONs)."""
    if len(np.unique(y_true)) > 2:
        return f1_score(y_true, y_pred, average="macro")
    return f1_score(y_true, y_pred)


def legacy_split(ds):
    """Mirror src/data/preprocessing.py loaders + seed-42 stratified 80/20."""
    from sklearn.model_selection import train_test_split

    raw = pd.read_csv(PROJ / "data" / "raw" / f"{ds}.csv")
    if ds == "heart":
        raw["target"] = (raw["target"] > 0).astype(int)
        X, y = raw.drop(columns=["target"]), raw["target"]
    elif ds == "diabetes":
        X, y = raw.drop(columns=["Outcome"]), raw["Outcome"]
        X[["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]] = \
            X[["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]].replace(0, np.nan)
    elif ds == "breast_cancer":
        X, y = raw.drop(columns=["diagnosis"]), raw["diagnosis"].astype(int)
    elif ds == "liver":
        if raw["Selector"].max() == 2:
            raw["Selector"] = (raw["Selector"] == 1).astype(int)
        X, y = raw.drop(columns=["Selector"]), raw["Selector"].astype(int)
    elif ds == "parkinsons":
        X, y = raw.drop(columns=["status"]), raw["status"].astype(int)
    return train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

def validate_legacy():
    print("\n=== Legacy 5 UCI datasets (repo's own artifacts) ===")
    for ds in DS.LEGACY_REGISTRY:
        X_tr, X_te, y_tr, y_te = legacy_split(ds)
        imputer, scaler, pca, clf, best_name, _ = load_pipeline(ds)
        X_pca = pca.transform(scaler.transform(imputer.transform(X_te)))

        pred = clf.predict(X_pca)
        pub = json.loads((PROJ / "results" / "metrics" / f"{best_name}_{ds}.json").read_text())
        check(f"{ds} [{best_name}]", accuracy_score(y_te, pred), f1_for(y_te, pred),
              pub["accuracy"], pub["f1"])

        # VQC — same PCA features, deterministic statevector expectation
        runtime = predictor._qml_runtime(ds)
        if runtime is not None:
            p1 = runtime(X_pca)
            qpred = (np.asarray(p1) >= 0.5).astype(int)
            pub_q = json.loads((PROJ / "results" / "metrics" / f"vqc_{ds}.json").read_text())
            check(f"{ds} [vqc_{pca.n_components_}q]", accuracy_score(y_te, qpred),
                  f1_for(y_te, qpred), pub_q["accuracy"], pub_q["f1"])
        else:
            print(f"  [SKIP] {ds}: no params.npy — VQC not trained")


def validate_musa_heart():
    print("\n=== Musa HEART (their artifacts) ===")
    base = MUSA_DIR / "HEART"
    Xt = pd.read_csv(base / "cleaned_data" / "X_test.csv")
    yt = pd.read_csv(base / "cleaned_data" / "y_test.csv").iloc[:, 0].values
    perf = json.loads((base / "heart_metrics.json").read_text())["models_performance"]

    ml = joblib.load(base / "best_heart_ml_model.joblib")
    pred = ml.predict(Xt.values)
    pub = perf["HistGradientBoosting"]
    check("musa_heart ML [HistGradientBoosting]", accuracy_score(yt, pred), f1_for(yt, pred),
          pub["Accuracy"], pub["F1-Score"])

    X4 = joblib.load(base / "heart_pca_4.joblib").transform(Xt.values)
    qpred = MusaVQCRuntime(base / "heart_qml_model_weights.pt").predict(X4)
    pub = perf["QML (4 Qubits)"]
    check("musa_heart QML [4q]", accuracy_score(yt, qpred), f1_for(yt, qpred),
          pub["Accuracy"], pub["F1-Score"])


def validate_musa_hcv():
    print("\n=== Musa HCV (their artifacts) ===")
    base = MUSA_DIR / "HCV"
    Xt = pd.read_csv(full_hcv_path())
    yt = pd.read_csv(MUSA_DIR / "HCV" / "test_data" / "y_test.csv").iloc[:, 0].values
    metrics = json.loads((MUSA_DIR / "HCV" / "hcv_metrics.json").read_text())
    perf = metrics["models_performance"]

    ml_name = metrics["best_classical_ml"]  # XGBoost
    ml = joblib.load(MUSA_DIR / "HCV" / "best_hcv_ml_model.joblib")
    pred = ml.predict(Xt.values)
    pub = perf[ml_name]
    check(f"musa_hcv ML [{ml_name}]", accuracy_score(yt, pred), f1_for(yt, pred),
          pub["Accuracy"], pub["F1-Score"])

    X4 = joblib.load(MUSA_DIR / "HCV" / "hcv_pca_4.joblib").transform(Xt.values)
    qpred = MusaVQCRuntime(MUSA_DIR / "HCV" / "hcv_qml_model_weights.pt").predict(X4)
    pub = perf["QML (4 Qubits)"]
    check("musa_hcv QML [4q]", accuracy_score(yt, qpred), f1_for(yt, qpred),
          pub["Accuracy"], pub["F1-Score"])


def full_hcv_path():
    """HCV test X is the pre-scaled cleaned_data file shipped with the team's split."""
    p = MUSA_DIR / "HCV" / "test_data" / "X_test.csv"
    if p.exists():
        return p
    raise FileNotFoundError("HCV X_test.csv missing from backend/models/musa/HCV/test_data")

def validate_musa_diabetes():
    print("\n=== Musa DIABETES 3-class (their artifacts) ===")
    base = MUSA_DIR / "DIABETES"
    df = pd.read_csv(base / "test_data" / "diabetes_multiclass3_X_test_ML.csv")
    yt = df["Class"].values
    X = df.drop(columns=["Class"])
    metrics = json.loads((base / "metrics.json").read_text())
    perf = metrics["models_performance"]

    # their pipeline re-standardizes the (already z-scored) split files — keep exact order
    X_scaled = joblib.load(base / "scaler.joblib").transform(X)
    ml_name = metrics["best_classical_ml"]  # Random Forest
    ml = joblib.load(base / "best_ml_model.joblib")
    pred = ml.predict(X_scaled)
    pub = perf[ml_name]
    check(f"musa_diabetes ML [{ml_name}]", accuracy_score(yt, pred),
          f1_score(yt, pred, average="macro"), pub["Accuracy"], pub["Macro F1"])

    X4 = joblib.load(base / "pca_4.joblib").transform(X_scaled)
    qpred = MusaVQCRuntime(base / "qml_model_weights.pt").predict(X4)
    pub = perf["QML (4 Qubits)"]
    check("musa_diabetes QML [4q]", accuracy_score(yt, qpred),
          f1_score(yt, qpred, average="macro"), pub["Accuracy"], pub["Macro F1"])


def validate_registry():
    print("\n=== Registry consistency ===")
    expected = {
        "musa_heart": ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
                       "thalach", "exang", "oldpeak", "slope", "ca", "thal"],
        "musa_hcv": ["Age", "Sex", "ALB", "ALP", "ALT", "AST", "BIL", "CHE",
                     "CHOL", "CREA", "GGT", "PROT"],
        "musa_diabetes": ["Gender", "AGE", "Urea", "Cr", "HbA1c", "Chol", "TG",
                          "HDL", "LDL", "VLDL", "BMI"],
    }
    for key, exp in expected.items():
        got = DS.feature_order(key)
        print(f"  [{'PASS' if got == exp else 'FAIL'}] {key} feature order")
        RESULTS.append((f"registry {key}", 1, 1, 1, 1, got == exp))
    for ds in DS.LEGACY_REGISTRY:
        load_pipeline(ds)
    print("  [PASS] all 5 legacy pipelines load")


def smoke_services():
    print("\n=== Service smoke (run_prediction / predict_musa) ===")
    raw_heart = pd.read_csv(PROJ / "data" / "raw" / "heart.csv").drop(columns=["target"]).iloc[0]
    feats = {k: float(v) for k, v in raw_heart.items()}
    # Legacy ids are gated: run_prediction must refuse them (KeyError via
    # DS.feature_order) — the intended post-gating behavior.
    try:
        predictor.run_prediction("heart", feats)
        gated_ok = False
    except KeyError:
        gated_ok = True
    print(f"  [{'PASS' if gated_ok else 'FAIL'}] legacy 'heart' is gated (KeyError)")
    RESULTS.append(("gating legacy heart", 1, 1, 1, 1, gated_ok))

    from backend.services.musa_service import predict_musa
    # musa_heart expects raw UCI coding (cp 1-4, slope 1-3, thal 3/6/7) —
    # NOT the legacy repo's 0-based heart.csv coding.
    r = predict_musa("musa_heart", {
        "age": 52, "sex": 1, "cp": 4, "trestbps": 125, "chol": 212, "fbs": 0,
        "restecg": 2, "thalach": 150, "exang": 0, "oldpeak": 1.0, "slope": 3,
        "ca": 0, "thal": 6,
    })
    print(f"  musa_heart -> ml={r['ml_prediction']} qml={r['qml_prediction']} risk={r['risk']}")
    assert r["qml_model"] == "vqc_4qubit" and r["risk"] in ("HIGH", "MODERATE", "LOW")

    r = predict_musa("musa_hcv", {"Age": 45, "Sex": "m", "ALB": 38.5, "ALP": 52.5, "ALT": 25,
                                  "AST": 22, "BIL": 11, "CHE": 8.5, "CHOL": 5.2, "CREA": 75,
                                  "GGT": 18, "PROT": 72})
    print(f"  musa_hcv -> ml={r['ml_prediction']} qml={r['qml_prediction']} risk={r['risk']}")

    Xd = pd.read_csv(MUSA_DIR / "DIABETES" / "test_data" / "diabetes_multiclass3_X_test_ML.csv")
    row = Xd.drop(columns=["Class"]).iloc[0].to_dict()
    r = predict_musa("musa_diabetes", row)
    print(f"  musa_diabetes -> ml={r['ml_prediction']} qml={r['qml_prediction']} risk={r['risk']}")


if __name__ == "__main__":
    validate_registry()
    validate_legacy()
    validate_musa_heart()
    validate_musa_hcv()
    validate_musa_diabetes()
    smoke_services()

    fails = [r for r in RESULTS if not r[-1]]
    print(f"\n{'=' * 60}\n{len(RESULTS) - len(fails)}/{len(RESULTS)} checks passed")
    if fails:
        print("FAILED:", *[f[0] for f in fails], sep="\n  - ")
        sys.exit(1)
    print("ALL MODELS REPRODUCE THEIR PUBLISHED METRICS")



