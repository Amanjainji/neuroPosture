"""
Bicep curl model training.
Detects: lean back, weak peak contraction, loose upper arm.
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import bicep_features

MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)


def load_and_prepare(csv_paths: list) -> tuple:
    dfs = []
    for p in csv_paths:
        p = Path(p)
        if p.exists():
            dfs.append(pd.read_csv(p))
    if not dfs:
        raise FileNotFoundError("No CSV files found.")
    df = pd.concat(dfs, ignore_index=True)

    rows = []
    for _, row in df.iterrows():
        try:
            f = bicep_features(row)
            # Heuristic: lean back if torso angle > threshold
            lean_back = 1 if abs(f["torso_angle"]) > 25 else 0
            f["lean_back"] = lean_back
            rows.append(f)
        except Exception:
            continue

    feat_df = pd.DataFrame(rows)
    feature_cols = [c for c in feat_df.columns if c != "lean_back" and isinstance(feat_df[c].iloc[0], (int, float))]
    X = feat_df[feature_cols].fillna(0).values
    y = feat_df["lean_back"].values
    return X, y, feature_cols


def train(X, y, feature_cols):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_s, y_train)
    acc = clf.score(X_test_s, y_test)
    print(f"Bicep lean-back model accuracy: {acc:.3f}")

    joblib.dump(scaler, MODEL_DIR / "scaler.joblib")
    joblib.dump(clf, MODEL_DIR / "lean_back_model.joblib")
    joblib.dump(feature_cols, MODEL_DIR / "feature_cols.joblib")


def main():
    data_dir = Path(__file__).parent.parent / "data"
    csv_paths = list(data_dir.glob("**/bicep*.csv")) + list(data_dir.glob("**/collected/*.csv"))
    if not csv_paths:
        print("No data. Run webcam_collector.py with label bicep_curl")
        return

    X, y, cols = load_and_prepare(csv_paths)
    print(f"Training on {len(X)} samples")
    train(X, y, cols)


if __name__ == "__main__":
    main()
