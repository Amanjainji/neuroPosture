"""
Shared utilities for pose feature extraction.
Reference: Exercise-Correction - angle/distance calculations.
"""
import math
import numpy as np

# MediaPipe landmark indices
LANDMARKS = {
    "nose": 0, "left_shoulder": 11, "right_shoulder": 12,
    "left_elbow": 13, "right_elbow": 14, "left_wrist": 15, "right_wrist": 16,
    "left_hip": 23, "right_hip": 24, "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28,
}


def get_point(row: dict, name: str) -> np.ndarray:
    """Get x,y,z from row for landmark."""
    i = LANDMARKS.get(name, 0)
    return np.array([row.get(f"lm{i}_x", 0), row.get(f"lm{i}_y", 0), row.get(f"lm{i}_z", 0)])


def distance(p1: np.ndarray, p2: np.ndarray) -> float:
    """Euclidean distance between 2 points."""
    return np.sqrt(np.sum((p1[:2] - p2[:2]) ** 2))


def angle_deg(p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
    """
    Angle at p2 formed by p1-p2-p3, in degrees.
    Reference: Exercise-Correction core README
    angle_in_radian = arctan2(y3-y2,x3-x2) - arctan2(y1-y2,x1-x2)
    """
    v1 = p1[:2] - p2[:2]
    v2 = p3[:2] - p2[:2]
    a = np.arctan2(v1[1], v1[0]) - np.arctan2(v2[1], v2[0])
    return abs(np.degrees(a)) % 360


def squat_features(row: dict) -> dict:
    """
    Squat: feet placement, knee placement, stage.
    Landmarks: shoulder, hip, knee, ankle (left/right).
    """
    ls = get_point(row, "left_shoulder")
    rs = get_point(row, "right_shoulder")
    lh = get_point(row, "left_hip")
    rh = get_point(row, "right_hip")
    lk = get_point(row, "left_knee")
    rk = get_point(row, "right_knee")
    la = get_point(row, "left_ankle")
    ra = get_point(row, "right_ankle")

    feet_dist = distance(la, ra)
    shoulder_dist = distance(ls, rs)
    knee_dist = distance(lk, rk)

    feet_shoulder_ratio = feet_dist / (shoulder_dist + 1e-6)
    knee_feet_ratio = knee_dist / (feet_dist + 1e-6)

    l_angle = angle_deg(lh, lk, la)
    r_angle = angle_deg(rh, rk, ra)
    avg_knee_angle = (l_angle + r_angle) / 2

    # Stage: down < 100 deg, up >= 100
    stage = "down" if avg_knee_angle < 100 else "up"

    return {
        "feet_shoulder_ratio": feet_shoulder_ratio,
        "knee_feet_ratio": knee_feet_ratio,
        "left_knee_angle": l_angle,
        "right_knee_angle": r_angle,
        "avg_knee_angle": avg_knee_angle,
        "stage": stage,
    }


def bicep_features(row: dict) -> dict:
    """
    Bicep: lean back (torso angle), elbow angle for peak contraction.
    Landmarks: nose, shoulder, elbow, wrist, hip.
    """
    nose = get_point(row, "nose")
    ls = get_point(row, "left_shoulder")
    rs = get_point(row, "right_shoulder")
    le = get_point(row, "left_elbow")
    re = get_point(row, "right_elbow")
    lw = get_point(row, "left_wrist")
    rw = get_point(row, "right_wrist")
    lh = get_point(row, "left_hip")
    rh = get_point(row, "right_hip")

    shoulder_mid = (ls + rs) / 2
    hip_mid = (lh + rh) / 2

    # Torso angle (vertical) - lean back detection
    torso_vec = shoulder_mid[:2] - hip_mid[:2]
    torso_angle = np.degrees(np.arctan2(torso_vec[1], torso_vec[0] + 1e-6))

    # Elbow angles
    l_elbow_angle = angle_deg(ls, le, lw)
    r_elbow_angle = angle_deg(rs, re, rw)
    avg_elbow = (l_elbow_angle + r_elbow_angle) / 2

    # Wrist height relative to shoulder (peak contraction)
    l_peak = lw[1] - ls[1]  # y: lower = higher
    r_peak = rw[1] - rs[1]

    return {
        "torso_angle": torso_angle,
        "left_elbow_angle": l_elbow_angle,
        "right_elbow_angle": r_elbow_angle,
        "avg_elbow_angle": avg_elbow,
        "left_peak": l_peak,
        "right_peak": r_peak,
    }


def lunge_features(row: dict) -> dict:
    """
    Lunge: knee over toe.
    Landmarks: hip, knee, ankle (front leg).
    """
    lh = get_point(row, "left_hip")
    rh = get_point(row, "right_hip")
    lk = get_point(row, "left_knee")
    rk = get_point(row, "right_knee")
    la = get_point(row, "left_ankle")
    ra = get_point(row, "right_ankle")

    l_angle = angle_deg(lh, lk, la)
    r_angle = angle_deg(rh, rk, ra)

    # Knee over toe: knee x vs ankle x
    l_knee_over = lk[0] - la[0]
    r_knee_over = rk[0] - ra[0]

    bent = max(l_angle, r_angle)
    straight = min(l_angle, r_angle)

    return {
        "left_knee_angle": l_angle,
        "right_knee_angle": r_angle,
        "left_knee_over_toe": l_knee_over,
        "right_knee_over_toe": r_knee_over,
        "bent_angle": bent,
        "straight_angle": straight,
    }


def plank_features(row: dict) -> dict:
    """
    Plank: hip sag (body alignment).
    Landmarks: shoulder, hip, ankle.
    """
    ls = get_point(row, "left_shoulder")
    rs = get_point(row, "right_shoulder")
    lh = get_point(row, "left_hip")
    rh = get_point(row, "right_hip")
    la = get_point(row, "left_ankle")
    ra = get_point(row, "right_ankle")

    shoulder_mid = (ls + rs) / 2
    hip_mid = (lh + rh) / 2
    ankle_mid = (la + ra) / 2

    dy_hip = hip_mid[1] - shoulder_mid[1]
    dx_hip = hip_mid[0] - shoulder_mid[0]
    slope = dy_hip / (abs(dx_hip) + 1e-6)

    return {
        "hip_slope": slope,
        "hip_shoulder_dy": dy_hip,
        "body_alignment": np.sqrt(dy_hip**2 + dx_hip**2),
    }
