"""In-memory store for IoT sensor data (ESP32/MPU6050)."""
from collections import deque
from typing import Optional

_MAX_PER_DEVICE = 500
_data: dict[str, deque] = {}


class IoTDataStore:
    @staticmethod
    def add(device_id: str, reading: dict):
        if device_id not in _data:
            _data[device_id] = deque(maxlen=_MAX_PER_DEVICE)
        _data[device_id].append(reading)

    @staticmethod
    def get_recent(device_id: str, limit: int = 100) -> list:
        if device_id not in _data:
            return []
        items = list(_data[device_id])
        return items[-limit:]

    @staticmethod
    def clear():
        _data.clear()
