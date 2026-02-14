"""Device management and wearable connection endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class DeviceInfo(BaseModel):
    id: str
    name: str
    type: str  # esp32, mpu6050, heart_rate
    connected: bool
    last_seen: Optional[str] = None


# In-memory device registry (replace with DB in production)
_devices: dict[str, DeviceInfo] = {}


@router.get("", response_model=List[DeviceInfo])
def list_devices():
    return list(_devices.values())


@router.post("/register", response_model=DeviceInfo)
def register_device(info: DeviceInfo):
    _devices[info.id] = info
    return info


@router.post("/{device_id}/disconnect")
def disconnect_device(device_id: str):
    if device_id in _devices:
        d = _devices[device_id]
        _devices[device_id] = DeviceInfo(**{**d.model_dump(), "connected": False})
    return {"ok": True}


@router.post("/{device_id}/connect")
def connect_device(device_id: str):
    if device_id in _devices:
        d = _devices[device_id]
        _devices[device_id] = DeviceInfo(**{**d.model_dump(), "connected": True})
    return {"ok": True}
