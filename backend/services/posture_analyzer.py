"""
Posture analysis using MediaPipe landmarks.
Heavy deps (cv2, numpy, mediapipe) are lazy-loaded so the app can run without them (e.g. free-tier deploy).
"""
import math
from pathlib import Path
from typing import Optional, Union
import asyncio

# No top-level cv2/numpy/mediapipe - they are imported only when needed in _analyze_frame_sync

# MediaPipe Pose landmark indices
# https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
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


def _angle(p1: list, p2: list, p3: list) -> float:
    """Angle at p2 formed by p1-p2-p3, in degrees."""
    v1 = [p1[0] - p2[0], p1[1] - p2[1]]
    v2 = [p3[0] - p2[0], p3[1] - p2[1]]
    a = math.atan2(v1[1], v1[0]) - math.atan2(v2[1], v2[0])
    return abs(math.degrees(a)) % 360


def _dist(p1: list, p2: list) -> float:
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def _get(pts: list, name: str) -> list:
    i = LANDMARKS.get(name, 0)
    if i < len(pts):
        return pts[i]
    return [0, 0, 0]


def _ml_unavailable_response() -> dict:
    return {
        "detected": False,
        "error": "ML stack not available (light deployment mode)",
        "injury_risk": 0.3,
        "posture_score": 0.5,
        "feedback": ["Server is running in light mode. Deploy with opencv + mediapipe for posture analysis."],
        "corrections": [],
    }


class PostureAnalyzerService:
    _instance: Optional["PostureAnalyzerService"] = None
    _landmarker = None  # MediaPipe 0.10 PoseLandmarker (lazy-loaded)

    @classmethod
    def get_instance(cls) -> "PostureAnalyzerService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._landmarker = None

    def _find_pose_model(self) -> Optional[Path]:
        """Look for pose_landmarker_lite.task in several places (not only backend/models)."""
        name = "pose_landmarker_lite.task"
        backend_dir = Path(__file__).resolve().parent.parent  # backend/
        root = backend_dir.parent  # project root
        for d in (backend_dir / "models", backend_dir, root / "ml_models" / "models", root / "ml_models"):
            p = d / name
            if p.is_file():
                return p
        return None

    def _get_landmarker(self):
        """Create PoseLandmarker (MediaPipe 0.10 Tasks API). Uses existing model or downloads on first use."""
        if self._landmarker is not None:
            return self._landmarker
        if getattr(self, "_landmarker_failed", False):
            return None
        try:
            import urllib.request
            from mediapipe.tasks.python.core import base_options as base_options_lib
            from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions
            from mediapipe.tasks.python.vision.core import vision_task_running_mode
        except ImportError:
            self._landmarker_failed = True
            return None
        model_path = self._find_pose_model()
        if model_path is None:
            model_dir = Path(__file__).resolve().parent.parent / "models"
            model_path = model_dir / "pose_landmarker_lite.task"
            model_dir.mkdir(parents=True, exist_ok=True)
            if not model_path.is_file():
                try:
                    url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
                    urllib.request.urlretrieve(url, model_path)
                except Exception:
                    self._landmarker_failed = True
                    return None
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
            self._landmarker = PoseLandmarker.create_from_options(options)
            return self._landmarker
        except Exception:
            self._landmarker_failed = True
            return None

    def analyze_landmarks(self, landmarks: list) -> dict:
        """Analyze pose from 33 MediaPipe landmarks [[x,y,z], ...]."""
        if len(landmarks) < 33:
            return {
                "detected": False,
                "injury_risk": 0.3,
                "posture_score": 0.5,
                "feedback": ["Need full body in frame for analysis"],
                "exercise": "unknown",
                "corrections": [],
            }

        pts = [p if len(p) >= 3 else [p[0], p[1], 0] for p in landmarks]

        # Squat analysis
        squat_result = self._analyze_squat(pts)
        if squat_result:
            return squat_result

        # Plank analysis
        plank_result = self._analyze_plank(pts)
        if plank_result:
            return plank_result

        # Lunge analysis
        lunge_result = self._analyze_lunge(pts)
        if lunge_result:
            return lunge_result

        # Standing/default
        return self._analyze_standing(pts)

    def _analyze_squat(self, pts: list) -> Optional[dict]:
        l_hip = _get(pts, "left_hip")
        r_hip = _get(pts, "right_hip")
        l_knee = _get(pts, "left_knee")
        r_knee = _get(pts, "right_knee")
        l_ankle = _get(pts, "left_ankle")
        r_ankle = _get(pts, "right_ankle")

        l_angle = _angle(l_hip, l_knee, l_ankle)
        r_angle = _angle(r_hip, r_knee, r_ankle)
        avg_knee = (l_angle + r_angle) / 2

        # Squat: knee angle 70-110 at bottom
        if 50 < avg_knee < 150:
            injury_risk = 0.2
            feedback = []
            corrections = []

            if avg_knee < 70:
                injury_risk += 0.3
                corrections.append("Knees over toes - push knees out, sit back more")
            if abs(l_angle - r_angle) > 15:
                injury_risk += 0.2
                corrections.append("Asymmetry - balance weight evenly")

            posture_score = max(0.3, 1 - injury_risk)
            return {
                "detected": True,
                "exercise": "squat",
                "injury_risk": min(1.0, injury_risk),
                "posture_score": posture_score,
                "feedback": feedback or ["Good squat depth"],
                "corrections": corrections,
                "knee_angle": round(avg_knee, 1),
            }
        return None

    def _analyze_plank(self, pts: list) -> Optional[dict]:
        l_shoulder = _get(pts, "left_shoulder")
        r_shoulder = _get(pts, "right_shoulder")
        l_hip = _get(pts, "left_hip")
        r_hip = _get(pts, "right_hip")
        l_ankle = _get(pts, "left_ankle")

        # Plank: body roughly horizontal
        shoulder_mid = [(l_shoulder[0] + r_shoulder[0]) / 2, (l_shoulder[1] + r_shoulder[1]) / 2]
        hip_mid = [(l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2]
        dy = abs(hip_mid[1] - shoulder_mid[1])
        dx = abs(hip_mid[0] - shoulder_mid[0])
        slope = dy / (dx + 0.01)

        if slope < 0.5:  # fairly horizontal
            injury_risk = 0.2
            feedback = ["Plank form detected"]
            corrections = []
            if slope > 0.3:
                corrections.append("Keep hips level - avoid sagging or piking")
            return {
                "detected": True,
                "exercise": "plank",
                "injury_risk": injury_risk,
                "posture_score": 0.8,
                "feedback": feedback,
                "corrections": corrections,
            }
        return None

    def _analyze_lunge(self, pts: list) -> Optional[dict]:
        l_hip = _get(pts, "left_hip")
        l_knee = _get(pts, "left_knee")
        l_ankle = _get(pts, "left_ankle")
        r_hip = _get(pts, "right_hip")
        r_knee = _get(pts, "right_knee")
        r_ankle = _get(pts, "right_ankle")

        l_angle = _angle(l_hip, l_knee, l_ankle)
        r_angle = _angle(r_hip, r_knee, r_ankle)
        # Lunge: one leg bent ~90, one straighter
        bent = max(l_angle, r_angle)
        straight = min(l_angle, r_angle)
        if 70 < bent < 120 and 140 < straight < 180:
            injury_risk = 0.2
            corrections = []
            # Knee over toe check
            if l_angle < 100:
                kx, ax = l_knee[0], l_ankle[0]
                if abs(kx - ax) > 0.1:
                    injury_risk += 0.3
                    corrections.append("Front knee over toes - shift weight back")
            return {
                "detected": True,
                "exercise": "lunge",
                "injury_risk": min(1.0, injury_risk),
                "posture_score": 0.7,
                "feedback": ["Lunge form detected"],
                "corrections": corrections,
            }
        return None

    def _analyze_standing(self, pts: list) -> dict:
        l_shoulder = _get(pts, "left_shoulder")
        r_shoulder = _get(pts, "right_shoulder")
        l_hip = _get(pts, "left_hip")
        r_hip = _get(pts, "right_hip")

        # Slouch detection: shoulder-hip alignment
        shoulder_dy = abs(l_shoulder[1] - r_shoulder[1])
        injury_risk = min(0.5, 0.2 + shoulder_dy * 2)
        return {
            "detected": True,
            "exercise": "standing",
            "injury_risk": injury_risk,
            "posture_score": 0.8,
            "feedback": ["Standing posture detected. Try squats, lunges, or plank for exercise analysis."],
            "corrections": [],
        }

    async def analyze_frame(self, data: Union[bytes, "np.ndarray"]) -> dict:
        """Analyze posture from raw image bytes or numpy array. Accepts bytes to avoid requiring numpy at call site."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._analyze_frame_sync, data)

    def _analyze_frame_sync(self, data: Union[bytes, "np.ndarray"]) -> dict:
        try:
            import cv2
            import numpy as np
        except ImportError:
            return _ml_unavailable_response()

        if isinstance(data, bytes):
            nparr = np.frombuffer(data, dtype=np.uint8)
        else:
            nparr = data
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"detected": False, "error": "Invalid image"}

        landmarker = self._get_landmarker()
        if landmarker is None:
            return _ml_unavailable_response()

        rgb = np.ascontiguousarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        try:
            from mediapipe.tasks.python.vision.core import image as image_lib
            mp_image = image_lib.Image(image_lib.ImageFormat.SRGB, rgb)
            result = landmarker.detect(mp_image)
        except Exception:
            return _ml_unavailable_response()

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return {
                "detected": False,
                "injury_risk": 0.3,
                "posture_score": 0.5,
                "feedback": ["No pose detected - ensure full body in frame"],
                "corrections": [],
            }

        landmarks = result.pose_landmarks[0]
        pts = []
        for lm in landmarks:
            x = getattr(lm, "x", None) or 0.0
            y = getattr(lm, "y", None) or 0.0
            z = getattr(lm, "z", None) or 0.0
            pts.append([float(x), float(y), float(z)])
        if len(pts) < 33:
            pts.extend([[0.0, 0.0, 0.0]] * (33 - len(pts)))
        result = self.analyze_landmarks(pts[:33])
        # include the raw landmark list so clients can draw them if desired
        result["landmarks"] = pts[:33]
        return result
