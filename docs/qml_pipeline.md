# QML Pipeline — src/qml/

```
X_train_pca8 (scaled [0, pi]) → AngleEmbedding (1 feature per qubit)
        ↓
   StronglyEntanglingLayers 2 layers ring (8 qubits, RY RZ, 512 shots)
        ↓
   Adam (SPSA-like) 100 iter on 200 subsample (fits 680M 25-60s)
        ↓
   train_vqc.py → models/quantum/vqc_<dataset>/params.npy + results/metrics/vqc_*.json

Alternative: QSVM ZZFeatureMap reps2 + FidelityQuantumKernel + SVC
        → src/qml/train_qsvm.py → models/quantum/qsvm_*.pkl (also backend/models/)
```

Why 8 qubits: 2^8=256 amplitude, 4KB state, CPU-friendly; 12q would be 15+ min on 680M.

Benchmark: src/qml/hybrid_benchmark.py compares classical best vs VQC vs QSVM on same test set — writes docs/benchmark_report.md + results/comparison/benchmark.json (and frontend auto-fetches).

Honest reporting per team plan md:1070: if classical wins, report it.
