"""
Real-time detection using trained models + MediaPipe.
Run with webcam for live posture feedback.
"""
import cv2
# Use MediaPipe 0.10 Tasks API like other scripts
import numpy as np
from pathlib import Path

# helper to create landmarker (same as pose_extractor)
import sys, os
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from ml_models.webcam_collector import get_pose_landmarker
except ImportError:
    try:
        from webcam_collector import get_pose_landmarker
    except ImportError:
        # if helper isn't available, we can inline minimal version later
        get_pose_landmarker = None

# Add parent
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import joblib
    from utils import squat_features, bicep_features, lunge_features, plank_features
except ImportError as e:
    print(f"Import error: {e}. Ensure utils.py exists.")
    sys.exit(1)

MODELS_DIR = Path(__file__).parent
LANDMARKS = 33


MODEL_FILES = {"squat": "stage_model.joblib", "bicep": "lean_back_model.joblib", "lunge": "knee_over_toe_model.joblib", "plank": "form_model.joblib"}


def load_model(exercise: str):
    """Load scaler + classifier for exercise."""
    model_dir = MODELS_DIR / f"{exercise}_model" / "model"
    model_file = MODEL_FILES.get(exercise, "stage_model.joblib")
    if not model_dir.exists() or not (model_dir / model_file).exists():
        return None, None, None
    try:
        scaler = joblib.load(model_dir / "scaler.joblib")
        model = joblib.load(model_dir / model_file)
        feats = joblib.load(model_dir / "feature_cols.joblib")
        return scaler, model, feats
    except Exception:
        return None, None, None


def row_from_landmarks(landmarks) -> dict:
    """Convert MediaPipe landmarks to row dict.
    Accepts either a solution-style object or a list from PoseLandmarker.
    """
    row = {}
    # tasks API returns a list of NormalizedLandmark; solutions returned a
    # object with .landmark property
    if hasattr(landmarks, "landmark"):
        iterable = landmarks.landmark
    else:
        iterable = landmarks
    for i, lm in enumerate(iterable):
        row[f"lm{i}_x"] = lm.x
        row[f"lm{i}_y"] = lm.y
        row[f"lm{i}_z"] = lm.z
    return row


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", "-v", help="Optional video file for detection")
    args = parser.parse_args()

    # create MediaPipe PoseLandmarker
    landmarker = None
    if get_pose_landmarker:
        landmarker = get_pose_landmarker()
    if landmarker is None:
        print("ERROR: Could not initialize MediaPipe pose landmarker")
        return

    # drawing utilities from tasks API (fallback to solutions if available)
    try:
        from mediapipe.tasks.python.vision import drawing_utils, drawing_styles
        from mediapipe.tasks.python.vision import PoseLandmarksConnections
    except ImportError:
        # if tasks drawing not available, use solutions (unlikely)
        import mediapipe as mp
        drawing_utils = mp.solutions.drawing_utils
        drawing_styles = mp.solutions.drawing_styles
        PoseLandmarksConnections = mp.solutions.pose.POSE_CONNECTIONS

    source = args.video if args.video else 0
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Could not open {'video' if args.video else 'webcam'}:", source)
        return

    exercise = "squat"
    scaler, model, feats = load_model(exercise)

    print("Keys: 1=squat, 2=lunge, 3=bicep, 4=plank, q=quit")
    print("Using heuristic analysis (trained models optional).")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        from mediapipe.tasks.python.vision.core import image as image_lib
        mp_image = image_lib.Image(image_lib.ImageFormat.SRGB, np.ascontiguousarray(rgb))
        results = landmarker.detect(mp_image)

        feedback = ""
        if results and results.pose_landmarks and len(results.pose_landmarks) > 0:
            landmarks = results.pose_landmarks[0]
            try:
                drawing_utils.draw_landmarks(
                    frame,
                    landmarks,
                    PoseLandmarksConnections.POSE_LANDMARKS,
                    landmark_drawing_spec=drawing_styles.get_default_pose_landmarks_style(),
                )
            except Exception:
                pass
            row = row_from_landmarks(landmarks)

            try:
                if exercise == "squat":
                    f = squat_features(row)
                    stage = "UP" if f["avg_knee_angle"] >= 100 else "DOWN"
                    # simple error checks
                    err = []
                    if f["feet_shoulder_ratio"] < 0.5:
                        err.append("feet too narrow")
                    elif f["feet_shoulder_ratio"] > 1.5:
                        err.append("feet too wide")
                    if f["knee_feet_ratio"] < 0.5:
                        err.append("knees too close")
                    elif f["knee_feet_ratio"] > 1.2:
                        err.append("knees too far")
                    feedback = f"Squat: {stage} | Knee: {f['avg_knee_angle']:.0f}°"
                    if err:
                        feedback += " | " + ",".join(err)
                elif exercise == "lunge":
                    f = lunge_features(row)
                    err = []
                    # knee over toe positive means knee ahead of ankle
                    if f["left_knee_over_toe"] > 0.05 or f["right_knee_over_toe"] > 0.05:
                        err.append("knee over toe")
                    feedback = f"Lunge | Bent: {f['bent_angle']:.0f}°"
                    if err:
                        feedback += " | " + ",".join(err)
                elif exercise == "bicep_curl":
                    f = bicep_features(row)
                    err = []
                    if abs(f['torso_angle']) > 10:
                        err.append("lean back")
                    if f['avg_elbow_angle'] < 30:
                        err.append("peak")
                    feedback = f"Bicep | Elbow: {f['avg_elbow_angle']:.0f}°"
                    if err:
                        feedback += " | " + ",".join(err)
                elif exercise == "plank":
                    f = plank_features(row)
                    err = []
                    # hip sag if slope positive, pike if negative large
                    if f['hip_slope'] > 0.2:
                        err.append("hip sag")
                    elif f['hip_slope'] < -0.2:
                        err.append("pike")
                    feedback = f"Plank | Slope: {f['hip_slope']:.2f}"
                    if err:
                        feedback += " | " + ",".join(err)
            except Exception as e:
                feedback = str(e)[:50]

        cv2.putText(frame, f"Exercise: {exercise}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, feedback, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.imshow("NeuroPosture - Detection", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("1"):
            exercise = "squat"
        elif key == ord("2"):
            exercise = "lunge"
        elif key == ord("3"):
            exercise = "bicep"
        elif key == ord("4"):
            exercise = "plank"

    cap.release()
    cv2.destroyAllWindows()
    try:
        landmarker.close()
    except Exception:
        pass


if __name__ == "__main__":
    main()
