"""
VQC training — src/qml/train_vqc.py
python src/qml/train_vqc.py --dataset heart --qubits 8 --shots 512 --iter 100
Saves to models/quantum/vqc_<dataset>/ and results/metrics/vqc_<dataset>.json
"""
import argparse, pathlib, json, time, joblib
import numpy as np
import pennylane as qml
from pennylane import numpy as pnp
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from src.utils.config import DATA_PROCESSED, MODELS_QUANTUM, RESULTS_METRICS

parser = argparse.ArgumentParser()
parser.add_argument("--dataset", choices=["heart","diabetes","breast_cancer","liver","parkinsons"], required=True)
parser.add_argument("--qubits", type=int, default=8)
parser.add_argument("--shots", type=int, default=512)
parser.add_argument("--iter", type=int, default=100)
args = parser.parse_args()

data = np.load(DATA_PROCESSED/f"split_{args.dataset}.npz")
X_train, X_test, y_train, y_test = data["X_train_p"], data["X_test_p"], data["y_train"], data["y_test"]
print(f"Loaded {args.dataset}: train {X_train.shape} test {X_test.shape}")

# Scale [0, pi] for AngleEmbedding
X_train = np.clip(X_train, -3, 3)
X_train = (X_train + 3) / 6 * np.pi
X_test = np.clip(X_test, -3, 3)
X_test = (X_test + 3) / 6 * np.pi

n_qubits = args.qubits
dev = qml.device("lightning.qubit", wires=n_qubits)

def circuit(params, x):
    qml.AngleEmbedding(x, wires=range(n_qubits), rotation='Y')
    qml.StronglyEntanglingLayers(params, wires=range(n_qubits))
    return qml.expval(qml.PauliZ(0))

weight_shapes = {"params": (2, n_qubits, 3)}
qnode = qml.QNode(circuit, dev, interface="autograd")

def predict(params, X):
    return np.array([ 1 if qnode(params, x) > 0 else 0 for x in X ])

np.random.seed(42)
params = pnp.random.uniform(0, np.pi, size=weight_shapes["params"], requires_grad=True)
opt = qml.AdamOptimizer(stepsize=0.1)

def cost(params, X, y):
    preds = pnp.array([(qnode(params, x)+1)/2 for x in X])
    eps=1e-7
    return -pnp.mean(y*pnp.log(preds+eps) + (1-y)*pnp.log(1-preds+eps))

# Subsample for speed if large
if len(X_train) > 200:
    idx = np.random.choice(len(X_train), 200, replace=False)
    X_tr, y_tr = X_train[idx], y_train[idx]
else:
    X_tr, y_tr = X_train, y_train

print(f"Training VQC {len(X_tr)} samples {n_qubits}q {args.iter} iter...")
start=time.time()
for i in range(args.iter):
    params, c = opt.step_and_cost(lambda p: cost(p, X_tr, y_tr), params)
    if i%20==0:
        print(f"iter {i} cost {c:.4f}")
train_time = time.time()-start

y_pred = predict(params, X_test)
y_prob = np.array([(qnode(params, x)+1)/2 for x in X_test])
metrics = {
    "accuracy": float(accuracy_score(y_test, y_pred)),
    "precision": float(precision_score(y_test, y_pred, zero_division=0)),
    "recall": float(recall_score(y_test, y_pred, zero_division=0)),
    "f1": float(f1_score(y_test, y_pred, zero_division=0)),
    "roc_auc": float(roc_auc_score(y_test, y_prob)),
    "confusion": confusion_matrix(y_test, y_pred).tolist(),
    "train_time_s": float(train_time),
    "qubits": n_qubits,
    "shots": args.shots,
    "circuit_depth": 2*n_qubits*2,
}
print(metrics)

out = MODELS_QUANTUM/f"vqc_{args.dataset}"
out.mkdir(parents=True, exist_ok=True)
pnp.save(out/"params.npy", params)
with open(RESULTS_METRICS/f"vqc_{args.dataset}.json","w") as f:
    json.dump(metrics, f, indent=2)
with open(out/"metrics.json","w") as f:
    json.dump(metrics, f, indent=2)
# Legacy for backend/app.py compatibility
import pathlib as pl, shutil
legacy = pl.Path("backend/models")
if legacy.exists():
    legacy.mkdir(parents=True, exist_ok=True)
    # copy metrics json
    pathlib.Path(f"backend/models/vqc_{args.dataset}").mkdir(parents=True, exist_ok=True)
    pnp.save(f"backend/models/vqc_{args.dataset}/params.npy", params)
    with open(f"backend/models/vqc_{args.dataset}/metrics.json","w") as f:
        json.dump(metrics, f, indent=2)
print(f"Saved to {out} and results/metrics/")
