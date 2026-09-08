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
  // musa_diabetes: inputs are RAW clinical values (AGE yrs, Urea/Cr/Chol/TG/HDL/LDL/
  // VLDL in mmol/L (Cr in µmol/L), HbA1c %, BMI kg/m²). The backend converts them to
  // the model's cohort z-scores (see backend/services/diabetes_units.py). Typical
  // values = the healthy (Non-Diabetic) cohort medoid of the Rashid 2020 data.
  musa_diabetes: [
    { k: 'Gender', label: 'GENDER', unit: '0F 1M', min: 0, max: 1, ex: 0, help: 'female 0 · male 1', opts: [{ value: 0, label: 'Female' }, { value: 1, label: 'Male' }] },
    { k: 'AGE', label: 'AGE', unit: 'yrs', min: 25, max: 77, ex: 44, step: 1, help: 'age in years' },
    { k: 'Urea', label: 'UREA', unit: 'mmol/L', min: 1, max: 27, ex: 4.4, step: 0.1, help: 'urea · kidney marker' },
    { k: 'Cr', label: 'CR', unit: 'µmol/L', min: 5, max: 200, ex: 55, step: 1, help: 'creatinine · kidney marker' },
    { k: 'HbA1c', label: 'HBA1C', unit: '%', min: 3, max: 15, ex: 4.9, step: 0.1, help: 'glycated haemoglobin · %' },
    { k: 'Chol', label: 'CHOL', unit: 'mmol/L', min: 1, max: 10, ex: 4.2, step: 0.1, help: 'total cholesterol' },
    { k: 'TG', label: 'TG', unit: 'mmol/L', min: 0.5, max: 9, ex: 1.4, step: 0.1, help: 'triglycerides' },
    { k: 'HDL', label: 'HDL', unit: 'mmol/L', min: 0.4, max: 4, ex: 1.1, step: 0.1, help: 'HDL · protective lipid' },
    { k: 'LDL', label: 'LDL', unit: 'mmol/L', min: 0.3, max: 6, ex: 2.6, step: 0.1, help: 'LDL cholesterol' },
    { k: 'VLDL', label: 'VLDL', unit: 'mmol/L', min: 0.2, max: 3, ex: 0.7, step: 0.1, help: 'VLDL cholesterol' },
    { k: 'BMI', label: 'BMI', unit: 'kg/m²', min: 18, max: 45, ex: 22, step: 0.1, help: 'body-mass index' },
  ],
}

export const DATASETS = [
  { id: 'musa_heart', label: 'HEART', sub: 'UCI 303×13' },
  { id: 'musa_hcv', label: 'HCV', sub: 'UCI 615×12' },
  { id: 'musa_diabetes', label: 'DIABETES', sub: 'BAGHDAD 264×11' },
]
