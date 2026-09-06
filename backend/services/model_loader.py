"""Legacy pipeline loader — backend/services/model_loader.py

Loads the repo's own trained artifacts for the 5 UCI datasets:
  models/preprocessing/{imputer,scaler,pca}_<ds>.pkl   (fit on train only)
  models/classical/<name>_<ds>.pkl                     (LR / SVM / RF)
  models/classical/best_classical_<ds>.json            (optional best-model pick)
  models/quantum/vqc_<ds>/params.npy                   (PennyLane VQC, 8 qubits)

Falls back to backend/models/<...> (legacy flat layout) when the new layout
is missing a file. Everything is cached per-dataset at first use.
"""
import json
import pathlib
import joblib
import numpy as np
import pennylane as qml
from pennylane import numpy as pnp

ROOT = pathlib.Path(__file__).resolve().parents[2]

_cache: dict = {}


def _first(*paths):
    for p in paths:
        p = pathlib.Path(p)
        if p.exists():
            return p
    return None


def load_pipeline(dataset: str):
    """Return (imputer, scaler, pca, clf, best_name, vqc_runtime) for a legacy dataset."""
    if dataset in _cache:
        return _cache[dataset]

    pre = ROOT / "models" / "preprocessing"
    cls = ROOT / "models" / "classical"
    qnt = ROOT / "models" / "quantum" / f"vqc_{dataset}"
    legacy = ROOT / "backend" / "models"

    imp_p = _first(pre / f"imputer_{dataset}.pkl", legacy / f"imputer_{dataset}.pkl")
    scl_p = _first(pre / f"scaler_{dataset}.pkl", legacy / f"scaler_{dataset}.pkl")
    pca_p = _first(pre / f"pca_{dataset}.pkl", legacy / f"pca_{dataset}.pkl")
    if not (imp_p and scl_p and pca_p):
        raise FileNotFoundError(f"preprocessing artifacts missing for '{dataset}'")

    best_name = "svm"
    best_p = _first(cls / f"best_classical_{dataset}.json", legacy / f"best_classical_{dataset}.json")
    if best_p:
        best_name = json.loads(best_p.read_text()).get("best", best_name)

    clf_p = _first(cls / f"{best_name}_{dataset}.pkl", cls / f"svm_{dataset}.pkl",
                   legacy / f"{best_name}_{dataset}.pkl")
    if not clf_p:
        raise FileNotFoundError(f"classical model missing for '{dataset}'")

    imputer = joblib.load(imp_p)
    scaler = joblib.load(scl_p)
    pca = joblib.load(pca_p)
    clf = joblib.load(clf_p)

    vqc = None
    params_p = _first(qnt / "params.npy", legacy / f"vqc_{dataset}" / "params.npy")
    if params_p:
        vqc = LegacyVQC(params_p)

    _cache[dataset] = (imputer, scaler, pca, clf, best_name, vqc)
    return _cache[dataset]


class LegacyVQC:
    """Inference for the repo's own trained VQC (params.npy, 8 qubits, shots-free
    statevector expectation — same circuit as training, deterministic output)."""

    N_QUBITS = 8
    N_LAYERS = 2

    def __init__(self, params_path):
        params = np.load(params_path)
        self.params = pnp.array(params, requires_grad=False)
        n_qubits = params.shape[1]
        if n_qubits != self.N_QUBITS:
            self.N_QUBITS = n_qubits  # trust the artifact over the default
        self.dev = qml.device("default.qubit", wires=self.N_QUBITS)

        @qml.qnode(self.dev, interface="autograd")
        def circuit(params, x):
            qml.AngleEmbedding(x, wires=range(self.N_QUBITS), rotation="Y")
            qml.StronglyEntanglingLayers(params, wires=range(self.N_QUBITS))
            return qml.expval(qml.PauliZ(0))

        self._circuit = circuit

    @staticmethod
    def _to_angle(v: float) -> float:
        """Same [0, pi] mapping used by src/qml/train_vqc.py."""
        v = float(np.clip(v, -3, 3))
        return (v + 3) / 6 * np.pi

    def proba_positive(self, X_pca):
        """P(class=1) = (<Z0> + 1) / 2 — the training-time decision convention."""
        out = []
        for row in np.asarray(X_pca, dtype=float):
            z = self._circuit(self.params, [self._to_angle(v) for v in row])
            out.append((float(z) + 1.0) / 2.0)
        return np.array(out)

