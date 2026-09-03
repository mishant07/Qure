# Data Dictionary — SIH26139 Dual Demo

## Heart Disease — UCI Cleveland (303×13 + target)
Source: https://archive.ics.uci.edu/dataset/45/heart+disease | License: CC-BY 4.0 | Public/Open (PS allows)
- Rows: 303, Features: 13, Target: num (0=no disease, 1-4=disease → binarized 0/1)
- Missing: ca=4, thal=2 as "?" → median impute
- Imbalance: ~54% disease (54.5% has disease) — moderate
- Types:
  - age: int, sex: 0/1, cp: 0-3, trestbps: int, chol: int, fbs: 0/1, restecg: 0-2, thalach: int, exang: 0/1, oldpeak: float, slope: 0-2, ca: 0-4, thal: 0-3

## Diabetes — Pima Indians (768×8 + target)
Source: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database | License: CC0
- Rows: 768, Features: 8, Target: Outcome 0/1
- Missing disguised as 0: Glucose, BloodPressure, SkinThickness, Insulin, BMI → treat 0 as NaN → median
- Imbalance: 65% negative, 35% positive — imbalanced → SMOTE + recall-focused
- Types: all numeric

## Notes for Preprocessing (fit on train only!)

- Heart ca/thal "?" → SimpleImputer(strategy=median) fitted on train
- Diabetes 0s → replace 0 with NaN for cols above, then median
- Encode: Heart cp/slope/thal already numeric but categorical → keep ordinal
- Scale: StandardScaler for VQC path, MinMax for QSVM path (kernel needs [0,1])
- PCA: n_components=8 → 8 qubits, verify explained_variance >0.90
- Split: stratify=y, test_size=0.2, random_state=42, save indices
