"""
Quantum encoding helpers — angle encoding (1 feature per qubit)
"""
import pennylane as qml
import numpy as np

def angle_embedding(features, wires):
    """AngleEmbedding RY: features scaled to [0, pi] expected"""
    qml.AngleEmbedding(features, wires=wires, rotation='Y')

def zz_feature_map_circuit(features, wires, reps=2):
    """Qiskit-like ZZFeatureMap via PennyLane: Hadamard + RZ entangling"""
    for _ in range(reps):
        for w in wires:
            qml.Hadamard(wires=w)
        for i, w in enumerate(wires):
            qml.RZ(features[i], wires=w)
        # linear entanglement
        for i in range(len(wires)-1):
            qml.CNOT(wires=[wires[i], wires[i+1]])
            qml.RZ(features[i]*features[i+1], wires=wires[i+1])
            qml.CNOT(wires=[wires[i], wires[i+1]])
