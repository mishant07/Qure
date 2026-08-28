"""Fetch Heart + Diabetes raw CSVs — fallback for Abdul 48h box"""
import urllib.request
from pathlib import Path
import pandas as pd
from src.utils.config import DATA_RAW

HEART_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
HEART_COLS = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal","target"]
DIAB_URL = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
DIAB_COLS = ["Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin","BMI","DiabetesPedigreeFunction","Age","Outcome"]

def fetch_data():
    DATA_RAW.mkdir(parents=True, exist_ok=True)
    # Heart
    try:
        print("Fetching Heart (UCI Cleveland)...")
        urllib.request.urlretrieve(HEART_URL, DATA_RAW/"heart.csv")
        df = pd.read_csv(DATA_RAW/"heart.csv", header=None, names=HEART_COLS, na_values="?")
        df.to_csv(DATA_RAW/"heart.csv", index=False)
        print(f"Heart: {df.shape} → {DATA_RAW/'heart.csv'}")
    except Exception as e:
        print(f"Heart fetch failed: {e}")
    # Diabetes
    try:
        print(f"Fetching Diabetes from {DIAB_URL}...")
        urllib.request.urlretrieve(DIAB_URL, DATA_RAW/"diabetes.csv")
        df = pd.read_csv(DATA_RAW/"diabetes.csv", header=None, names=DIAB_COLS)
        df.to_csv(DATA_RAW/"diabetes.csv", index=False)
        print(f"Diabetes: {df.shape} → {DATA_RAW/'diabetes.csv'}")
    except Exception as e:
        print(f"Diabetes fetch failed: {e}")
    print("Done. Next: python src/data/preprocessing.py --dataset heart --pca 8")

if __name__=="__main__":
    fetch_data()
