"""Quantum circuit helpers — src/qml/circuit.py"""
import pennylane as qml

def angle_embedding(features, wires):
    qml.AngleEmbedding(features, wires=wires, rotation='Y')

def zz_feature_map_circuit(features, wires, reps=2):
    for _ in range(reps):
        for w in wires:
            qml.Hadamard(wires=w)
        for i, w in enumerate(wires):
            qml.RZ(features[i], wires=w)
        for i in range(len(wires)-1):
            qml.CNOT(wires=[wires[i], wires[i+1]])
            qml.RZ(features[i]*features[i+1], wires=wires[i+1])
            qml.CNOT(wires=[wires[i], wires[i+1]])
