// Field metadata for the 3 ACTIVE screening modules (Musa2609/SIH-):
// musa_heart (raw UCI coding), musa_hcv (m/f Sex), musa_diabetes (cohort z-scores).
// Field keys + ranges match the backend registry (backend/services/datasets.py)
// and Musa's own CLI validators (HEART/predict_heart.py FEATURE_RANGES).

export const FIELD_META = {
  musa_heart: [
    { k: 'age', label: 'AGE', unit: 'yrs', min: 18, max: 100, ex: 52, help: '18–100' },
    { k: 'sex', label: 'SEX', unit: '0F 1M', min: 0, max: 1, ex: 1, help: '0 female 1 male', opts: [{ value: 0, label: 'Female' }, { value: 1, label: 'Male' }] },
    { k: 'cp', label: 'CP', unit: '1–4', min: 1, max: 4, ex: 4, help: 'chest pain type (raw UCI)', opts: [{ value: 1, label: 'typical angina' }, { value: 2, label: 'atypical angina' }, { value: 3, label: 'non-anginal' }, { value: 4, label: 'asymptomatic' }] },
    { k: 'trestbps', label: 'TRESTBPS', unit: 'mmHg', min: 70, max: 250, ex: 125, help: 'rest BP' },
    { k: 'chol', label: 'CHOL', unit: 'mg/dl', min: 100, max: 600, ex: 212, help: 'serum chol' },
    { k: 'fbs', label: 'FBS', unit: '0/1', min: 0, max: 1, ex: 0, help: '>120 mg/dl', opts: [{ value: 0, label: 'false' }, { value: 1, label: 'true' }] },
    { k: 'restecg', label: 'RESTECG', unit: '0–2', min: 0, max: 2, ex: 2, help: 'resting ECG', opts: [{ value: 0, label: 'normal' }, { value: 1, label: 'ST-T abnormality' }, { value: 2, label: 'LVH' }] },
    { k: 'thalach', label: 'THALACH', unit: 'bpm', min: 60, max: 230, ex: 150, help: 'max HR' },
    { k: 'exang', label: 'EXANG', unit: '0/1', min: 0, max: 1, ex: 0, help: 'exercise angina', opts: [{ value: 0, label: 'no' }, { value: 1, label: 'yes' }] },
    { k: 'oldpeak', label: 'OLDPEAK', unit: 'ST', min: 0, max: 10, ex: 1.0, help: 'ST depression' },
    { k: 'slope', label: 'SLOPE', unit: '1–3', min: 1, max: 3, ex: 3, help: 'ST slope (raw UCI)', opts: [{ value: 1, label: 'upsloping' }, { value: 2, label: 'flat' }, { value: 3, label: 'downsloping' }] },
    { k: 'ca', label: 'CA', unit: '0–3', min: 0, max: 3, ex: 0, help: 'vessels fluor' },
    { k: 'thal', label: 'THAL', unit: '3/6/7', min: 3, max: 7, ex: 6, help: 'raw UCI coding', opts: [{ value: 3, label: 'normal' }, { value: 6, label: 'fixed defect' }, { value: 7, label: 'reversible defect' }] },
  ],
  musa_hcv: [
    { k: 'Age', label: 'AGE', unit: 'yrs', min: 18, max: 100, ex: 45, help: '18–100' },
    { k: 'Sex', label: 'SEX', unit: 'm/f', min: 0, max: 1, ex: 'm', help: 'laboratory coding', raw: true, opts: [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }] },
    { k: 'ALB', label: 'ALB', unit: 'g/L', min: 10, max: 70, ex: 38.5, help: 'albumin' },
    { k: 'ALP', label: 'ALP', unit: 'U/L', min: 5, max: 500, ex: 52.5, help: 'alk phos' },
    { k: 'ALT', label: 'ALT', unit: 'U/L', min: 1, max: 400, ex: 25.0, help: 'alanine transam.' },
    { k: 'AST', label: 'AST', unit: 'U/L', min: 1, max: 500, ex: 22.1, help: 'aspartate transam.' },
    { k: 'BIL', label: 'BIL', unit: 'μmol/L', min: 0.5, max: 250, ex: 11.0, help: 'bilirubin' },
    { k: 'CHE', label: 'CHE', unit: 'kU/L', min: 0.5, max: 25, ex: 6.93, help: 'cholinesterase' },
    { k: 'CHOL', label: 'CHOL', unit: 'mmol/L', min: 0.5, max: 15, ex: 3.23, help: 'cholesterol' },
    { k: 'CREA', label: 'CREA', unit: 'μmol/L', min: 10, max: 1000, ex: 74, help: 'creatinine' },
    { k: 'GGT', label: 'GGT', unit: 'U/L', min: 1, max: 1000, ex: 12.1, help: 'gamma-GT' },
    { k: 'PROT', label: 'PROT', unit: 'g/L', min: 30, max: 100, ex: 69.0, help: 'total protein' },
  ],
  // musa_diabetes: the pipeline ships cohort z-scores ONLY (scaler is identity),
  // so raw units cannot be mapped back — examples below are REAL medoid rows from
  // the healthy (Class 0) test cohort, not arbitrary numbers. Each is a coherent
  // whole-body profile: female adult, normal kidney/lipid panel, low-normal HbA1c.
  musa_diabetes: [
    { k: 'Gender', label: 'GENDER', unit: 'z', min: -5, max: 5, ex: -1.06, help: 'cohort z-score · −1 ≈ female pole, +1 ≈ male' },
    { k: 'AGE', label: 'AGE', unit: 'z', min: -5, max: 5, ex: -0.28, help: 'cohort z-score · relative to cohort median age' },
    { k: 'Urea', label: 'UREA', unit: 'z', min: -5, max: 5, ex: -0.28, help: 'cohort z-score · 0 = cohort average' },
    { k: 'Cr', label: 'CR', unit: 'z', min: -5, max: 5, ex: -0.31, help: 'creatinine z-score · 0 = cohort average' },
    { k: 'HbA1c', label: 'HBA1C', unit: 'z', min: -5, max: 5, ex: -0.76, help: 'lower z = better glycemia (healthy-cohort level)' },
    { k: 'Chol', label: 'CHOL', unit: 'z', min: -5, max: 5, ex: -0.15, help: 'cohort z-score · 0 = cohort average' },
    { k: 'TG', label: 'TG', unit: 'z', min: -5, max: 5, ex: -0.57, help: 'triglycerides z-score · 0 = cohort average' },
    { k: 'HDL', label: 'HDL', unit: 'z', min: -5, max: 5, ex: -0.20, help: 'cohort z-score · 0 = cohort average' },
    { k: 'LDL', label: 'LDL', unit: 'z', min: -5, max: 5, ex: 0.49, help: 'cohort z-score · 0 = cohort average' },
    { k: 'VLDL', label: 'VLDL', unit: 'z', min: -5, max: 5, ex: -0.25, help: 'cohort z-score · 0 = cohort average' },
    { k: 'BMI', label: 'BMI', unit: 'z', min: -5, max: 5, ex: -0.91, help: 'cohort z-score · 0 = cohort average' },
  ],
}

export const DATASETS = [
  { id: 'musa_heart', label: 'HEART', sub: 'UCI 303×13' },
  { id: 'musa_hcv', label: 'HCV', sub: 'UCI 615×12' },
  { id: 'musa_diabetes', label: 'DIABETES', sub: 'BAGHDAD 264×11' },
]
