"""Health check endpoints."""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("")
def health_check():
    return {
        "status": "healthy",
        "service": "NeuroPosture AI",
        "timestamp": datetime.utcnow().isoformat(),
    }
