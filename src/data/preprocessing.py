"""
Preprocessing: fit on train only, save to models/preprocessing/, export processed/*.npz
Run: python src/data/preprocessing.py --dataset heart --pca 8
     python src/data/preprocessing.py --dataset diabetes --pca 8
Prevents leakage per team plan md:1225-1229
"""
import argparse, pathlib, joblib, json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from src.utils.config import DATA_RAW, DATA_PROCESSED, MODELS_PREPROCESSING, RANDOM_STATE

def load_heart(p):
    df = pd.read_csv(p)
    df["target"] = (df["target"] > 0).astype(int)
    X = df.drop(columns=["target"])
    y = df["target"]
    return X, y

def load_diabetes(p):
    df = pd.read_csv(p)
    X = df.drop(columns=["Outcome"])
    y = df["Outcome"]
    cols_zero_nan = ["Glucose","BloodPressure","SkinThickness","Insulin","BMI"]
    X[cols_zero_nan] = X[cols_zero_nan].replace(0, np.nan)
    return X, y

parser = argparse.ArgumentParser()
parser.add_argument("--dataset", choices=["heart","diabetes"], required=True)
parser.add_argument("--pca", type=int, default=8)
args = parser.parse_args()

raw = DATA_RAW / f"{args.dataset}.csv"
if not raw.exists():
    raise SystemExit(f"Missing {raw}. Run: python src/data/dataset.py")

X, y = load_heart(raw) if args.dataset=="heart" else load_diabetes(raw)

# Split BEFORE fit
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE)
print(f"Split {args.dataset}: train {X_train.shape} test {X_test.shape} pos={y_train.mean():.2f}")

imputer = SimpleImputer(strategy="median")
scaler = StandardScaler()
pca = PCA(n_components=args.pca, random_state=RANDOM_STATE)

# Fit on train only
X_train_imp = imputer.fit_transform(X_train)
X_test_imp = imputer.transform(X_test)

X_train_scl = scaler.fit_transform(X_train_imp)
X_test_scl = scaler.transform(X_test_imp)

X_train_p = pca.fit_transform(X_train_scl)
X_test_p = pca.transform(X_test_scl)
print(f"PCA {args.pca} explained variance: {pca.explained_variance_ratio_.sum():.3f}")

# Save
MODELS_PREPROCESSING.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
joblib.dump(imputer, MODELS_PREPROCESSING/f"imputer_{args.dataset}.pkl")
joblib.dump(scaler, MODELS_PREPROCESSING/f"scaler_{args.dataset}.pkl")
joblib.dump(pca, MODELS_PREPROCESSING/f"pca_{args.dataset}.pkl")
# Compat: also copy to backend legacy path if exists
import shutil
legacy = pathlib.Path("backend/models")
if legacy.exists():
    for f in MODELS_PREPROCESSING.glob(f"*_{args.dataset}.pkl"):
        shutil.copy(f, legacy/f.name)

np.savez(DATA_PROCESSED/f"split_{args.dataset}.npz", X_train_p=X_train_p, X_test_p=X_test_p, y_train=y_train.values, y_test=y_test.values)
print(f"Saved models to {MODELS_PREPROCESSING} and split to {DATA_PROCESSED}/split_{args.dataset}.npz")
print(f"Legacy copy to backend/models if exists: done")
