"""VQC circuit definition — src/qml/vqc.py"""
import pennylane as qml

def vqc_circuit(params, x, wires):
    qml.AngleEmbedding(x, wires=wires, rotation='Y')
    qml.StronglyEntanglingLayers(params, wires=wires)
    return qml.expval(qml.PauliZ(wires[0]))
