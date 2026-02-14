#!/usr/bin/env python3
"""
Interactive webcam data collector for NeuroPosture AI.
Record exercise videos with labels for ML training.
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

EXERCISES = ["squat", "lunge", "bicep_curl", "plank", "proper", "improper"]
LANDMARK_COLS = [f"lm{i}_{c}" for i in range(33) for c in ("x", "y", "z")]


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
        results = mp_pose.process(rgb)

        if results.pose_landmarks:
            mp_draw.draw_landmarks(
                frame,
                results.pose_landmarks,
                mp.solutions.pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_draw_styles.get_default_pose_landmarks_style(),
            )

            if recording:
                row = {"label": current_label, "timestamp": datetime.now().isoformat()}
                for i, lm in enumerate(results.pose_landmarks.landmark):
                    row[f"lm{i}_x"] = lm.x
                    row[f"lm{i}_y"] = lm.y
                    row[f"lm{i}_z"] = lm.z
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
    mp_pose.close()

    if frames:
        out_path = data_dir / f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        pd.DataFrame(frames).to_csv(out_path, index=False)
        print(f"Auto-saved {len(frames)} frames to {out_path}")


if __name__ == "__main__":
    main()
