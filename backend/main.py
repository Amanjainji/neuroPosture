"""
NeuroPosture AI - FastAPI Backend
Smart Injury Risk Prediction & Real-Time AI Coach
"""
import os
from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api import devices, posture, coach, health, iot, users
from services.injury_predictor import InjuryPredictorService
from services.iot_simulator import IoTDataStore
from db.mongo import connect_db, close_db

# Deployment: comma-separated origins, e.g. https://myapp.com,https://www.myapp.com
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").strip().split(",")
FRONTEND_DIST = os.getenv("FRONTEND_DIST", "../frontend/dist").strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    InjuryPredictorService.get_instance()
    yield
    IoTDataStore.clear()
    await close_db()


app = FastAPI(
    title="NeuroPosture AI API",
    description="Smart Injury Risk Prediction & Real-Time AI Coach",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(posture.router, prefix="/api/posture", tags=["Posture"])
app.include_router(coach.router, prefix="/api/coach", tags=["AI Coach"])
app.include_router(iot.router, prefix="/api/iot", tags=["IoT"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if FRONTEND_DIST and os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend_assets")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


@app.get("/")
def root():
    if FRONTEND_DIST and os.path.isdir(FRONTEND_DIST):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
    return {"app": "NeuroPosture AI", "docs": "/docs", "health": "/api/health"}
