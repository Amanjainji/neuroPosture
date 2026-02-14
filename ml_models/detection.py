"""
Real-time detection using trained models + MediaPipe.
Run with webcam for live posture feedback.
"""
import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path

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
    """Convert MediaPipe landmarks to row dict."""
    row = {}
    for i, lm in enumerate(landmarks.landmark):
        row[f"lm{i}_x"] = lm.x
        row[f"lm{i}_y"] = lm.y
        row[f"lm{i}_z"] = lm.z
    return row


def main():
    mp_pose = mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    mp_draw = mp.solutions.drawing_utils
    mp_draw_styles = mp.solutions.drawing_styles

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Could not open webcam")
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
        results = mp_pose.process(rgb)

        feedback = ""
        if results.pose_landmarks:
            mp_draw.draw_landmarks(
                frame,
                results.pose_landmarks,
                mp.solutions.pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_draw_styles.get_default_pose_landmarks_style(),
            )
            row = row_from_landmarks(results.pose_landmarks)

            try:
                if exercise == "squat":
                    f = squat_features(row)
                    stage = "UP" if f["avg_knee_angle"] >= 100 else "DOWN"
                    feedback = f"Squat: {stage} | Knee: {f['avg_knee_angle']:.0f}°"
                elif exercise == "lunge":
                    f = lunge_features(row)
                    feedback = f"Lunge | Bent: {f['bent_angle']:.0f}°"
                elif exercise == "bicep_curl":
                    f = bicep_features(row)
                    feedback = f"Bicep | Elbow: {f['avg_elbow_angle']:.0f}°"
                elif exercise == "plank":
                    f = plank_features(row)
                    feedback = f"Plank | Slope: {f['hip_slope']:.2f}"
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
    mp_pose.close()


if __name__ == "__main__":
    main()
