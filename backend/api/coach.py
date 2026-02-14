"""Real-time AI Coach endpoints."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json

from services.posture_analyzer import PostureAnalyzerService

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, msg: dict):
        for ws in self.active:
            try:
                await ws.send_json(msg)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws")
async def coach_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    analyzer = PostureAnalyzerService.get_instance()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "landmarks":
                pts = msg.get("landmarks", [])
                result = analyzer.analyze_landmarks(pts)
                await websocket.send_json({
                    "type": "feedback",
                    **result,
                })
            elif msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/exercises")
def list_exercises():
    return {
        "exercises": [
            {"id": "squat", "name": "Squat", "description": "Lower body strength"},
            {"id": "lunge", "name": "Lunge", "description": "Balance & leg strength"},
            {"id": "bicep_curl", "name": "Bicep Curl", "description": "Arm strength"},
            {"id": "plank", "name": "Plank", "description": "Core stability"},
        ]
    }
