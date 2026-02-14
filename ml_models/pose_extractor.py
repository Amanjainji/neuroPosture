"""
Extract MediaPipe pose landmarks from video or webcam.
Reference: https://github.com/NgoQuocBao1010/Exercise-Correction
"""
import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Generator, Optional

# MediaPipe Pose landmark indices (33 landmarks)
LANDMARKS = {
    "nose": 0, "left_eye_inner": 1, "left_eye": 2, "left_eye_outer": 3,
    "right_eye_inner": 4, "right_eye": 5, "right_eye_outer": 6,
    "left_ear": 7, "right_ear": 8, "mouth_left": 9, "mouth_right": 10,
    "left_shoulder": 11, "right_shoulder": 12, "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16, "left_pinky": 17, "right_pinky": 18,
    "left_index": 19, "right_index": 20, "left_thumb": 21, "right_thumb": 22,
    "left_hip": 23, "right_hip": 24, "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28, "left_heel": 29, "right_heel": 30,
    "left_foot_index": 31, "right_foot_index": 32,
}


def get_landmark_names():
    """Return ordered landmark names for CSV columns."""
    return sorted(LANDMARKS, key=LANDMARKS.get)


def extract_from_video(
    video_path: str,
    label: Optional[str] = None,
    max_frames: Optional[int] = None,
) -> pd.DataFrame:
    """
    Extract pose landmarks from a video file.
    Returns DataFrame with columns: frame, label, lm0_x, lm0_y, lm0_z, ... lm32_z
    """
    mp_pose = mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    cap = cv2.VideoCapture(video_path)
    rows = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if max_frames and frame_idx >= max_frames:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = mp_pose.process(rgb)

        row = {"frame": frame_idx}
        if label is not None:
            row["label"] = label

        if results.pose_landmarks:
            for i, lm in enumerate(results.pose_landmarks.landmark):
                row[f"lm{i}_x"] = lm.x
                row[f"lm{i}_y"] = lm.y
                row[f"lm{i}_z"] = lm.z
        else:
            for i in range(33):
                row[f"lm{i}_x"] = np.nan
                row[f"lm{i}_y"] = np.nan
                row[f"lm{i}_z"] = np.nan

        rows.append(row)
        frame_idx += 1

    cap.release()
    mp_pose.close()
    return pd.DataFrame(rows)


def extract_from_webcam(
    output_csv: str,
    label: str = "unknown",
    duration_sec: int = 30,
    fps: int = 10,
) -> pd.DataFrame:
    """
    Capture from webcam and extract landmarks. Saves to CSV.
    Press 'q' to stop early, 's' to save snapshot.
    """
    mp_pose = mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    rows = []
    frame_idx = 0
    max_frames = duration_sec * fps
    frame_interval = max(1, int(30 / fps))  # ~30fps cam, sample at fps

    print(f"Recording {label} for up to {duration_sec}s at ~{fps} fps. Press 'q' to stop.")

    while frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = mp_pose.process(rgb)

            row = {"frame": len(rows), "label": label}
            if results.pose_landmarks:
                for i, lm in enumerate(results.pose_landmarks.landmark):
                    row[f"lm{i}_x"] = lm.x
                    row[f"lm{i}_y"] = lm.y
                    row[f"lm{i}_z"] = lm.z
            else:
                for i in range(33):
                    row[f"lm{i}_x"] = np.nan
                    row[f"lm{i}_y"] = np.nan
                    row[f"lm{i}_z"] = np.nan
            rows.append(row)

        cv2.putText(frame, f"Label: {label} | Frames: {len(rows)}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("NeuroPosture - Data Collection", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break

        frame_idx += 1

    cap.release()
    cv2.destroyAllWindows()
    mp_pose.close()

    df = pd.DataFrame(rows)
    Path(output_csv).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"Saved {len(df)} frames to {output_csv}")
    return df


def landmarks_to_row(lm_list) -> dict:
    """Convert MediaPipe landmark list to flat dict for DataFrame."""
    row = {}
    for i, lm in enumerate(lm_list):
        row[f"lm{i}_x"] = lm.x if hasattr(lm, "x") else lm[0]
        row[f"lm{i}_y"] = lm.y if hasattr(lm, "y") else lm[1]
        row[f"lm{i}_z"] = lm.z if hasattr(lm, "z") else lm[2] if len(lm) > 2 else 0
    return row


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", "-v", help="Video file path")
    parser.add_argument("--webcam", "-w", action="store_true", help="Use webcam")
    parser.add_argument("--label", "-l", default="squat", help="Exercise label (squat, lunge, bicep_curl, plank)")
    parser.add_argument("--output", "-o", default="data/collected.csv", help="Output CSV")
    parser.add_argument("--duration", "-d", type=int, default=30, help="Webcam duration (sec)")
    parser.add_argument("--fps", type=int, default=10, help="Sample rate for webcam")
    args = parser.parse_args()

    if args.webcam:
        extract_from_webcam(args.output, args.label, args.duration, args.fps)
    elif args.video:
        df = extract_from_video(args.video, args.label)
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(args.output, index=False)
        print(f"Saved {len(df)} frames to {args.output}")
    else:
        print("Use --webcam or --video <path>")
