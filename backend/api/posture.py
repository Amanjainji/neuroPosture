"""Posture analysis from webcam/CV data. Passes bytes to analyzer (no numpy at API layer for light deploy)."""
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
import base64

from backend.services.posture_analyzer import PostureAnalyzerService

router = APIRouter()


class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float
    visibility: Optional[float] = 1.0


class PoseLandmarks(BaseModel):
    landmarks: List[LandmarkPoint]


@router.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    analyzer = PostureAnalyzerService.get_instance()
    result = await analyzer.analyze_frame(contents)
    return result


@router.post("/analyze/landmarks")
def analyze_landmarks(landmarks: PoseLandmarks):
    """Analyze pose from MediaPipe landmarks (client-side pose)."""
    analyzer = PostureAnalyzerService.get_instance()
    pts = [[p.x, p.y, p.z] for p in landmarks.landmarks]
    result = analyzer.analyze_landmarks(pts)
    return result


@router.post("/analyze/base64")
async def analyze_base64(data: dict):
    """Analyze frame from base64-encoded image (for webcam)."""
    img_b64 = data.get("image")
    if not img_b64:
        return {"error": "Missing 'image' field"}
    raw = base64.b64decode(img_b64)
    analyzer = PostureAnalyzerService.get_instance()
    result = await analyzer.analyze_frame(raw)
    return result
