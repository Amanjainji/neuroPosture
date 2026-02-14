"""
Squat exercise model training.
Detects: stage (up/down), feet placement, knee placement.
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib

# Add parent for utils
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import squat_features, get_point

MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)


def load_and_prepare(csv_paths: list) -> tuple:
    """Load CSVs, extract features, return X, y."""
    dfs = []
    for p in csv_paths:
        p = Path(p)
        if p.exists():
            dfs.append(pd.read_csv(p))
    if not dfs:
        raise FileNotFoundError("No CSV files found. Run webcam_collector.py or pose_extractor.py first.")
    df = pd.concat(dfs, ignore_index=True)

    rows = []
    for _, row in df.iterrows():
        try:
            f = squat_features(row)
            f["stage"] = 1 if f["avg_knee_angle"] >= 100 else 0  # 1=up, 0=down
            rows.append(f)
        except Exception:
            continue

    feat_df = pd.DataFrame(rows)
    feature_cols = [c for c in feat_df.columns if c != "stage" and isinstance(feat_df[c].iloc[0], (int, float))]
    X = feat_df[feature_cols].fillna(0).values
    y = feat_df["stage"].astype(int).values  # 0=down, 1=up
    return X, y, feature_cols


def train(X, y, feature_cols):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_s, y_train)
    acc = clf.score(X_test_s, y_test)
    print(f"Squat stage model accuracy: {acc:.3f}")

    joblib.dump(scaler, MODEL_DIR / "scaler.joblib")
    joblib.dump(clf, MODEL_DIR / "stage_model.joblib")
    joblib.dump(feature_cols, MODEL_DIR / "feature_cols.joblib")
    return clf, scaler


def main():
    data_dir = Path(__file__).parent.parent / "data"
    csv_paths = list(data_dir.glob("**/*.csv")) if data_dir.exists() else []
    if not csv_paths:
        csv_paths = [Path(__file__).parent.parent / "data" / "collected" / "squat_sample.csv"]
        if not csv_paths[0].exists():
            print("No data. Run: python webcam_collector.py or python pose_extractor.py --webcam --label squat")
            return

    X, y, cols = load_and_prepare(csv_paths)
    print(f"Training on {len(X)} samples, {len(cols)} features")
    train(X, y, cols)


if __name__ == "__main__":
    main()
