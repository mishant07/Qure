"""SVM — src/ml/svm.py"""
import argparse, json, joblib, pathlib
import numpy as np
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from imblearn.over_sampling import SMOTE
from src.utils.config import DATA_PROCESSED, MODELS_CLASSICAL, RESULTS_METRICS

parser = argparse.ArgumentParser()
parser.add_argument("--dataset", required=True, choices=["heart","diabetes","breast_cancer","liver","parkinsons"])
parser.add_argument("--smote", action="store_true", default=True)
args = parser.parse_args()

data = np.load(DATA_PROCESSED/f"split_{args.dataset}.npz")
X_train, X_test, y_train, y_test = data["X_train_p"], data["X_test_p"], data["y_train"], data["y_test"]
if args.smote:
    X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)

clf = SVC(probability=True, kernel="rbf")
clf.fit(X_train, y_train)
pred = clf.predict(X_test)
prob = clf.predict_proba(X_test)[:,1]
metrics = {
    "accuracy": accuracy_score(y_test, pred),
    "precision": precision_score(y_test, pred, zero_division=0),
    "recall": recall_score(y_test, pred, zero_division=0),
    "f1": f1_score(y_test, pred, zero_division=0),
    "roc_auc": roc_auc_score(y_test, prob),
    "confusion": confusion_matrix(y_test, pred).tolist(),
}
MODELS_CLASSICAL.mkdir(parents=True, exist_ok=True)
RESULTS_METRICS.mkdir(parents=True, exist_ok=True)
joblib.dump(clf, MODELS_CLASSICAL/f"svm_{args.dataset}.pkl")
with open(RESULTS_METRICS/f"svm_{args.dataset}.json","w") as f:
    json.dump(metrics, f, indent=2)
print(f"svm {args.dataset}: {metrics}")
