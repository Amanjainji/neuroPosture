"""
Lunge model training.
Detects: knee over toe error.
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import sys
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from utils import lunge_features

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
            f = lunge_features(row)
            # Knee over toe: front knee ahead of ankle = error
            knee_over = 1 if abs(f["left_knee_over_toe"]) > 0.05 or abs(f["right_knee_over_toe"]) > 0.05 else 0
            f["knee_over_toe"] = knee_over
            rows.append(f)
        except Exception:
            continue

    feat_df = pd.DataFrame(rows)
    feature_cols = [c for c in feat_df.columns if c != "knee_over_toe" and isinstance(feat_df[c].iloc[0], (int, float))]
    X = feat_df[feature_cols].fillna(0).values
    y = feat_df["knee_over_toe"].values
    return X, y, feature_cols


def train(X, y, feature_cols):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_s, y_train)
    acc = clf.score(X_test_s, y_test)
    print(f"Lunge knee-over-toe model accuracy: {acc:.3f}")

    joblib.dump(scaler, MODEL_DIR / "scaler.joblib")
    joblib.dump(clf, MODEL_DIR / "knee_over_toe_model.joblib")
    joblib.dump(feature_cols, MODEL_DIR / "feature_cols.joblib")


def main():
    data_dir = Path(__file__).parent.parent / "data"
    csv_paths = list(data_dir.glob("**/lunge*.csv")) + list(data_dir.glob("**/collected/*.csv"))
    if not csv_paths:
        print("No data. Run webcam_collector.py with label lunge")
        return

    X, y, cols = load_and_prepare(csv_paths)
    print(f"Training on {len(X)} samples")
    train(X, y, cols)


if __name__ == "__main__":
    main()
