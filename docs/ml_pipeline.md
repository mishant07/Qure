# ML Pipeline — src/ml/

```
data/raw/heart.csv (303x13) + diabetes.csv (768x8)
        ↓ stratify 80/20 (random_state 42) — src/data/preprocessing.py
   imputer(median) → scaler(Standard) → PCA 8 (fit train only)
        ↓
   SMOTE (train only) → LogisticRegression / SVM(RBF) / RandomForest(200) / XGB
        ↓
   evaluate.py — Acc/Prec/Recall/F1/ROC + confusion → results/metrics/*.json
        ↓
   best per F1 → models/classical/best_classical_*.json + .pkl (also legacy backend/models/)
```

Key principle from team plan md:1225-1229: scaler/pca fitted on train only, same pipeline in backend/services/model_loader.py.

Dual demo proves scalability to PS's cancer/neuro.
