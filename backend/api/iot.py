"""IoT sensor data ingestion endpoints (ESP32/MPU6050)."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from services.iot_simulator import IoTDataStore
from services.injury_predictor import InjuryPredictorService

router = APIRouter()


class SensorReading(BaseModel):
    device_id: str
    accel_x: float
    accel_y: float
    accel_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float
    heart_rate: Optional[float] = None
    timestamp: Optional[str] = None


class BatchReadings(BaseModel):
    readings: List[SensorReading]


@router.post("/ingest")
def ingest_sensor_data(reading: SensorReading):
    ts = reading.timestamp or datetime.utcnow().isoformat()
    IoTDataStore.add(reading.device_id, {
        "accel": [reading.accel_x, reading.accel_y, reading.accel_z],
        "gyro": [reading.gyro_x, reading.gyro_y, reading.gyro_z],
        "heart_rate": reading.heart_rate,
        "timestamp": ts,
    })
    return {"received": True, "timestamp": ts}


@router.post("/ingest/batch")
def ingest_batch(readings: BatchReadings):
    for r in readings.readings:
        ts = r.timestamp or datetime.utcnow().isoformat()
        IoTDataStore.add(r.device_id, {
            "accel": [r.accel_x, r.accel_y, r.accel_z],
            "gyro": [r.gyro_x, r.gyro_y, r.gyro_z],
            "heart_rate": r.heart_rate,
            "timestamp": ts,
        })
    return {"received": len(readings.readings)}


@router.get("/{device_id}/risk")
def get_injury_risk(device_id: str):
    predictor = InjuryPredictorService.get_instance()
    data = IoTDataStore.get_recent(device_id)
    result = predictor.predict_from_sensor_data(data)
    return result


@router.get("/{device_id}/history")
def get_sensor_history(device_id: str, limit: int = 100):
    return IoTDataStore.get_recent(device_id, limit)
