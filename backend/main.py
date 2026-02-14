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
from api import devices, posture, coach, health, iot, users
from services.injury_predictor import InjuryPredictorService
from services.iot_simulator import IoTDataStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    InjuryPredictorService.get_instance()
    yield
    IoTDataStore.clear()


app = FastAPI(
    title="NeuroPosture AI API",
    description="Smart Injury Risk Prediction & Real-Time AI Coach",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
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


@app.get("/")
def root():
    return {"app": "NeuroPosture AI", "docs": "/docs", "health": "/api/health"}
