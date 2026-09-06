"""Musa2609/SIH- QML model — exact re-implementation for inference.

Source of truth: github.com/Musa2609/SIH- (HEART/HCV/DIABETES pipelines).
Architecture: PennyLane AngleEmbedding -> StronglyEntanglingLayers (2 layers)
-> <Z> expectations on every wire -> torch Linear readout to n_classes.
state_dict keys: weights (PL canon tensors), readout.{weight,bias}.
Inference: local/global simulate — no shots, matches the repo's training-time
default.qubit behaviour and reproduced metrics to 1e-6 (see scripts/validate_models.py).
"""
import torch
import torch.nn as nn
import pennylane as qml


class MusaVQC(nn.Module):
    """Same parameter surface as HEART/HCV/DIABETES QuantumClassifier classes."""

    def __init__(self, n_qubits: int, n_layers: int = 2, n_classes: int = 2):
        super().__init__()
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        dev = qml.device("default.qubit", wires=n_qubits)

        @qml.qnode(dev, interface="torch", diff_method="backprop")
        def circuit(inputs, weights):
            qml.AngleEmbedding(inputs, wires=range(n_qubits))
            qml.StronglyEntanglingLayers(weights, wires=range(n_qubits))
            return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

        self.circuit = circuit
        weight_shape = qml.StronglyEntanglingLayers.shape(n_layers=n_layers, n_wires=n_qubits)
        # randn draw is overwritten by load_state_dict; only the shape matters
        self.weights = nn.Parameter(0.1 * torch.randn(weight_shape, dtype=torch.float32))
        self.readout = nn.Linear(n_qubits, n_classes)

    def forward(self, x):
        res = self.circuit(x, self.weights)
        q_out = torch.stack(res, dim=1).float()
        return self.readout(q_out)


class MusaVQCRuntime:
    """Loads trained weights, exposes batch predict / predict_proba.
    n_qubits / n_layers / n_classes are inferred from the checkpoint shapes when
    not given: weights (n_layers, n_qubits, n_qubits), readout.weight (n_classes, n_qubits)."""

    def __init__(self, weights_path, n_qubits=None, n_classes=None, n_layers=None):
        state = torch.load(weights_path, map_location="cpu", weights_only=True)
        if n_layers is None:
            n_layers = state["weights"].shape[0]
        if n_qubits is None:
            n_qubits = state["weights"].shape[1]
        if n_classes is None:
            n_classes = state["readout.weight"].shape[0]
        self.n_qubits = n_qubits
        self.n_classes = n_classes
        self.model = MusaVQC(n_qubits=n_qubits, n_layers=n_layers, n_classes=n_classes)
        self.model.load_state_dict(state)  # strict=True — mismatch must fail loudly
        self.model.eval()

    @torch.no_grad()
    def predict_proba(self, X):
        """X: (n, n_qubits) numpy -> (n, n_classes) numpy softmax probabilities."""
        logits = self.model(torch.as_tensor(X, dtype=torch.float32))
        return torch.softmax(logits, dim=1).numpy()

    @torch.no_grad()
    def predict(self, X):
        return self.predict_proba(X).argmax(axis=1)

    @torch.no_grad()
    def expectations(self, X):
        """Per-wire <Z> expectations BEFORE the classical readout head.

        X: (n, n_qubits) numpy -> (n, n_qubits) numpy. Additive introspection
        for the XQAI attribution panel; used by inference nowhere.
        """
        res = self.model.circuit(
            torch.as_tensor(X, dtype=torch.float32), self.model.weights
        )
        return torch.stack(res, dim=1).numpy()

