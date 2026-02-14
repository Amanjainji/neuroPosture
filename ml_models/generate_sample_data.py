"""
Generate synthetic sample data for training (when no webcam data available).
Uses plausible MediaPipe-like landmark values for each exercise.
"""
import numpy as np
import pandas as pd
from pathlib import Path

# MediaPipe-like landmark ranges (normalized 0-1)
def rand_landmarks() -> dict:
    """Random standing pose base."""
    row = {}
    # Simplified: key points with realistic relative positions
    shoulder_y, hip_y = 0.3, 0.5
    for i in range(33):
        row[f"lm{i}_x"] = np.random.uniform(0.3, 0.7)
        row[f"lm{i}_y"] = np.random.uniform(0.1, 0.9)
        row[f"lm{i}_z"] = np.random.uniform(-0.2, 0.2)
    return row


def squat_pose(depth: float) -> dict:
    """depth 0=standing, 1=full squat."""
    row = rand_landmarks()
    # knees bend: 25,26 move down; ankles 27,28
    for i in [25, 26]:  # knees
        row[f"lm{i}_y"] = 0.4 + depth * 0.2
    for i in [27, 28]:
        row[f"lm{i}_y"] = 0.7 + depth * 0.1
    return row


def lunge_pose() -> dict:
    row = rand_landmarks()
    row["lm25_y"] = 0.5   # front knee
    row["lm27_y"] = 0.75  # front ankle
    row["lm26_y"] = 0.4   # back knee
    row["lm28_y"] = 0.6   # back ankle
    return row


def bicep_pose(elbow_angle: float) -> dict:
    row = rand_landmarks()
    # elbow angle affects wrist position
    row["lm13_y"] = 0.45  # elbow
    row["lm15_y"] = 0.35 + (180 - elbow_angle) / 360 * 0.2  # wrist
    return row


def plank_pose(hip_sag: float) -> dict:
    row = rand_landmarks()
    row["lm11_y"] = row["lm12_y"] = 0.3
    row["lm23_y"] = row["lm24_y"] = 0.5 + hip_sag * 0.1
    row["lm27_y"] = row["lm28_y"] = 0.8
    return row


def main():
    out = Path(__file__).parent / "data" / "collected"
    out.mkdir(parents=True, exist_ok=True)

    # Squat
    rows = [squat_pose(d) for d in np.linspace(0, 1, 50)] + [squat_pose(np.random.random()) for _ in range(50)]
    for r in rows:
        r["label"] = "squat"
    pd.DataFrame(rows).to_csv(out / "squat_sample.csv", index=False)
    print(f"Generated {len(rows)} squat samples")

    # Lunge
    rows = [lunge_pose() for _ in range(100)]
    for r in rows:
        r["label"] = "lunge"
    pd.DataFrame(rows).to_csv(out / "lunge_sample.csv", index=False)
    print(f"Generated {len(rows)} lunge samples")

    # Bicep
    rows = [bicep_pose(np.random.uniform(30, 170)) for _ in range(100)]
    for r in rows:
        r["label"] = "bicep_curl"
    pd.DataFrame(rows).to_csv(out / "bicep_sample.csv", index=False)
    print(f"Generated {len(rows)} bicep samples")

    # Plank
    rows = [plank_pose(np.random.uniform(-0.5, 0.5)) for _ in range(100)]
    for r in rows:
        r["label"] = "plank"
    pd.DataFrame(rows).to_csv(out / "plank_sample.csv", index=False)
    print(f"Generated {len(rows)} plank samples")

    print(f"\nData saved to {out}")


if __name__ == "__main__":
    main()
