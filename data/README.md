# Data — SIH26139 Dual Demo

## Datasets (Public/Open per PS)

- **Heart:** UCI Cleveland `processed.cleveland.data` → `data/raw/heart.csv` (303×13, target 0-4 → binarized 0/1, 54% imbalance)
  - Source: https://archive.ics.uci.edu/dataset/45/heart+disease
  - Missing: `ca, thal = "?"` → median
- **Diabetes:** Pima Indians → `data/raw/diabetes.csv` (768×8, target Outcome 0/1, 65% imbalance)
  - Source: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database
  - Hidden NaN: Glucose, BloodPressure, SkinThickness, Insulin, BMI `0 → NaN` → median

## Flow (fit on train only!)

```
raw/*.csv → src/data/preprocessing.py (SimpleImputer → StandardScaler → PCA 8) → processed/*.npz + models/preprocessing/*.pkl
                                         ↓
                                    8 features = 8 qubits (verify explained_variance >0.90)
```

## For Abdul/Mishti

Fill `data_dict.md` lives in `docs/` canonical; this README is data-specific. Deliver `data_dict` per feature before Day 2.

## Fetch

```bash
python -c "from src.data.dataset import fetch_data; fetch_data()"
# or python src/data/dataset.py
```
