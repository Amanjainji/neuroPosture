#!/usr/bin/env python3
"""
Interactive webcam data collector for NeuroPosture AI.
Record exercise videos with labels for ML training.
Uses MediaPipe 0.10 Tasks API (PoseLandmarker).
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import cv2
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

EXERCISES = ["squat", "lunge", "bicep_curl", "plank", "proper", "improper"]
LANDMARK_COLS = [f"lm{i}_{c}" for i in range(33) for c in ("x", "y", "z")]


def _find_pose_model() -> Path | None:
    """Look for pose_landmarker_lite.task in several places (no single 'models' folder)."""
    name = "pose_landmarker_lite.task"
    root = Path(__file__).resolve().parent
    # 1) ml_models/models/
    p = root / "models" / name
    if p.is_file():
        return p
    # 2) ml_models/ (same folder as this script)
    p = root / name
    if p.is_file():
        return p
    # 3) backend/models/ (if running from repo root)
    p = root.parent / "backend" / "models" / name
    if p.is_file():
        return p
    # 4) backend/
    p = root.parent / "backend" / name
    if p.is_file():
        return p
    return None


def get_pose_landmarker():
    """Create PoseLandmarker (MediaPipe 0.10). Uses existing model or downloads on first use."""
    try:
        from mediapipe.tasks.python.core import base_options as base_options_lib
        from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions
        from mediapipe.tasks.python.vision.core import vision_task_running_mode
    except ImportError as e:
        print(f"ERROR: MediaPipe 0.10 required: {e}")
        return None
    model_path = _find_pose_model()
    if model_path is None:
        model_dir = Path(__file__).resolve().parent / "models"
        model_path = model_dir / "pose_landmarker_lite.task"
        model_dir.mkdir(parents=True, exist_ok=True)
        if not model_path.is_file():
            print("Downloading pose_landmarker_lite.task (first run only)...")
            try:
                import urllib.request
                url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
                urllib.request.urlretrieve(url, model_path)
                print("Download done.")
            except Exception as e:
                print(f"ERROR: Could not download model: {e}")
                return None
    else:
        print(f"Using pose model: {model_path}")
    try:
        base_options = base_options_lib.BaseOptions(model_asset_path=str(model_path))
        options = PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision_task_running_mode.VisionTaskRunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        return PoseLandmarker.create_from_options(options)
    except Exception as e:
        print(f"ERROR: Could not create PoseLandmarker: {e}")
        return None


def main():
    landmarker = get_pose_landmarker()
    if landmarker is None:
        return

    try:
        from mediapipe.tasks.python.vision import drawing_utils, drawing_styles
        from mediapipe.tasks.python.vision import PoseLandmarksConnections
    except ImportError:
        drawing_utils = None
        drawing_styles = None
        PoseLandmarksConnections = None

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam. Check camera permissions.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    data_dir = Path("data/collected")
    data_dir.mkdir(parents=True, exist_ok=True)

    current_label = "squat"
    recording = False
    frames = []
    start_time = None

    print("\n=== NeuroPosture AI - Webcam Data Collector ===\n")
    print("Keys:")
    print("  1-6: Set label (squat, lunge, bicep_curl, plank, proper, improper)")
    print("  SPACE: Start/Stop recording")
    print("  s: Save session to CSV")
    print("  q: Quit")
    print()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]

        try:
            from mediapipe.tasks.python.vision.core import image as image_lib
            mp_image = image_lib.Image(image_lib.ImageFormat.SRGB, np.ascontiguousarray(rgb))
            result = landmarker.detect(mp_image)
        except Exception:
            result = None

        if result and result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks = result.pose_landmarks[0]
            if drawing_utils and PoseLandmarksConnections is not None:
                try:
                    drawing_utils.draw_landmarks(
                        frame,
                        landmarks,
                        PoseLandmarksConnections.POSE_LANDMARKS,
                        landmark_drawing_spec=drawing_styles.get_default_pose_landmarks_style(),
                    )
                except Exception:
                    pass
            if recording:
                row = {"label": current_label, "timestamp": datetime.now().isoformat()}
                for i, lm in enumerate(landmarks):
                    row[f"lm{i}_x"] = getattr(lm, "x", None) or 0.0
                    row[f"lm{i}_y"] = getattr(lm, "y", None) or 0.0
                    row[f"lm{i}_z"] = getattr(lm, "z", None) or 0.0
                frames.append(row)

        status = "RECORDING" if recording else "PAUSED"
        color = (0, 0, 255) if recording else (0, 255, 0)
        cv2.putText(frame, f"Label: {current_label}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, status, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, f"Frames: {len(frames)}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

        cv2.imshow("NeuroPosture - Data Collection", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord(" "):
            recording = not recording
            if recording:
                start_time = datetime.now()
                print(f"Started recording {current_label}")
            else:
                print(f"Stopped. Captured {len(frames)} frames.")
        elif key in (ord("1"), ord("2"), ord("3"), ord("4"), ord("5"), ord("6")):
            idx = key - ord("1")
            current_label = EXERCISES[idx]
            print(f"Label: {current_label}")
        elif key == ord("s") and frames:
            out_path = data_dir / f"{current_label}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df = pd.DataFrame(frames)
            df.to_csv(out_path, index=False)
            print(f"Saved {len(df)} frames to {out_path}")
            frames = []

    cap.release()
    cv2.destroyAllWindows()

    if frames:
        out_path = data_dir / f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        pd.DataFrame(frames).to_csv(out_path, index=False)
        print(f"Auto-saved {len(frames)} frames to {out_path}")


if __name__ == "__main__":
    main()
