# NeuroPosture AI – ML & IoT Guide

This guide explains how to **run the ML models** (posture detection, exercise correction) and how to **send IoT sensor data** from a wearable (e.g. ESP32 + MPU6050) to the website and injury-prediction pipeline.

---

## Part 1: Running the ML Models

### Overview

| Purpose | Script / Location | Output |
|--------|-------------------|--------|
| Collect pose data (webcam) | `ml_models/webcam_collector.py` or `pose_extractor.py` | CSV with MediaPipe landmarks |
| Train exercise models | `ml_models/<exercise>_model/train.py` | `model/*.joblib` (scaler + classifier) |
| Run real-time detection | `ml_models/detection.py` | Live webcam + feedback |
| Server-side posture analysis | Backend `POST /api/posture/analyze/*` | Injury risk, corrections, exercise type |

### 1.1 Install ML Dependencies

From the project root:

```bash
pip install -r ml_models/requirements.txt
```

Or manually:

```bash
pip install opencv-python mediapipe pandas scikit-learn joblib numpy
```

### 1.2 Collect Training Data

**Option A – Interactive webcam (recommended for real poses)**

```bash
cd ml_models
python webcam_collector.py
```

- **1–6**: Set label (squat, lunge, bicep_curl, plank, proper, improper)
- **SPACE**: Start / stop recording
- **s**: Save current session to `data/collected/<label>_<timestamp>.csv`
- **q**: Quit (unsaved frames are auto-saved)

**Option B – Pose extractor (single label, timed)**

```bash
cd ml_models
python pose_extractor.py --webcam --label squat --output data/collected/squat.csv --duration 30 --fps 10
```

**Option C – From a video file**

```bash
python pose_extractor.py --video path/to/video.mp4 --label squat --output data/collected/squat.csv
```

**Option D – Synthetic data (no camera)**

```bash
python generate_sample_data.py
```

Creates sample CSVs in `data/collected/` for squat, lunge, bicep, plank.

### 1.3 Train the Models

After you have CSV data in `ml_models/data/collected/` (or `data/`):

```bash
cd ml_models

# Train each exercise model (Random Forest + scaler)
python squat_model/train.py
python bicep_model/train.py
python lunge_model/train.py
python plank_model/train.py
```

Trained artifacts are saved under:

- `ml_models/squat_model/model/` (e.g. `stage_model.joblib`, `scaler.joblib`)
- Same idea for `bicep_model`, `lunge_model`, `plank_model`.

### 1.4 Run Standalone Detection (Webcam)

Uses the trained models + live webcam:

```bash
cd ml_models
python detection.py
```

- **1–4**: Switch exercise (squat, lunge, bicep, plank)
- **q**: Quit

### 1.5 Use ML from the Website

The **web app** does not load the `ml_models/*.joblib` files by default. It uses:

- **Backend** (`backend/services/posture_analyzer.py`): MediaPipe + rule-based angles/distances for posture and injury risk.
- **Endpoints**:
  - `POST /api/posture/analyze/base64` – image (base64) → posture result
  - `POST /api/posture/analyze/landmarks` – 33 MediaPipe landmarks → same result

To use your **trained** squat/bicep/lunge/plank models in the backend, you would:

1. Copy the chosen `model/*.joblib` (and `scaler.joblib`, `feature_cols.joblib`) into the backend (e.g. `backend/models/`).
2. In `posture_analyzer.py`, load those artifacts and call them with the same features produced by `ml_models/utils.py` (squat_features, bicep_features, etc.) before or after the current heuristic logic.

---

## Part 2: Transferring IoT Data to the Website / ML

### Overview

1. **Device** (e.g. ESP32 + MPU6050) sends readings to the **backend**.
2. **Backend** stores them and runs **injury risk** logic (heuristics; can be replaced by an ML model).
3. **Website** (Dashboard, Wearable page) shows risk, alerts, and history.

### 2.1 Backend API for IoT Data

Base URL (when backend runs locally): `http://localhost:8000`. All IoT routes are under `/api/iot/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/iot/ingest` | Send one sensor reading |
| POST | `/api/iot/ingest/batch` | Send multiple readings at once |
| GET | `/api/iot/{device_id}/risk` | Get current injury risk for a device |
| GET | `/api/iot/{device_id}/history` | Get recent stored readings (for charts/debug) |

### 2.2 Single Reading Payload

**POST** `/api/iot/ingest`

```json
{
  "device_id": "esp32-living-room",
  "accel_x": 0.1,
  "accel_y": -0.2,
  "accel_z": 9.8,
  "gyro_x": 0.01,
  "gyro_y": 0.02,
  "gyro_z": -0.01,
  "heart_rate": 72,
  "timestamp": "2025-02-14T12:00:00.000Z"
}
```

- `device_id`: unique ID for this wearable (used in Dashboard and risk/history).
- `accel_*`, `gyro_*`: acceleration (e.g. m/s²) and gyro (e.g. rad/s or deg/s – keep units consistent).
- `heart_rate`: optional (bpm).
- `timestamp`: optional; server adds one if missing.

### 2.3 Batch Payload

**POST** `/api/iot/ingest/batch`

```json
{
  "readings": [
    {
      "device_id": "esp32-living-room",
      "accel_x": 0.1,
      "accel_y": -0.2,
      "accel_z": 9.8,
      "gyro_x": 0.01,
      "gyro_y": 0.02,
      "gyro_z": -0.01,
      "heart_rate": 72
    }
  ]
}
```

### 2.4 Sending Data from ESP32 (Arduino / C++)

Example using **WiFi** and **HTTP POST** (adjust pins and library to your board):

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MPU6050.h>  // or Adafruit_MPU6050, etc.

const char* WIFI_SSID = "YourSSID";
const char* WIFI_PASS = "YourPassword";
const char* BACKEND_URL = "http://YOUR_PC_IP:8000/api/iot/ingest";
const char* DEVICE_ID = "esp32-1";

MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mpu.initialize();
}

void loop() {
  float ax, ay, az, gx, gy, gz;
  mpu.getAcceleration(&ax, &ay, &az);
  mpu.getRotation(&gx, &gy, &gz);

  DynamicJsonDocument doc(256);
  doc["device_id"] = DEVICE_ID;
  doc["accel_x"] = ax;
  doc["accel_y"] = ay;
  doc["accel_z"] = az;
  doc["gyro_x"] = gx;
  doc["gyro_y"] = gy;
  doc["gyro_z"] = gz;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();

  delay(200);  // e.g. 5 Hz
}
```

- Replace `YOUR_PC_IP` with the machine running the backend (e.g. `192.168.1.10`).
- Ensure the ESP32 and your PC are on the same network and that the backend allows that host (CORS is for the browser; the ESP32 just needs HTTP access to the server).

### 2.5 Sending Data from Python (e.g. Raspberry Pi / laptop)

```python
import requests
import time

API = "http://localhost:8000/api/iot/ingest"
DEVICE_ID = "esp32-demo-1"

def send_reading(accel, gyro, heart_rate=None):
    payload = {
        "device_id": DEVICE_ID,
        "accel_x": accel[0], "accel_y": accel[1], "accel_z": accel[2],
        "gyro_x": gyro[0], "gyro_y": gyro[1], "gyro_z": gyro[2],
    }
    if heart_rate is not None:
        payload["heart_rate"] = heart_rate
    r = requests.post(API, json=payload)
    return r.json()

# Example loop (replace with real sensor reads)
while True:
    send_reading([0.1, -0.2, 9.8], [0.01, 0.02, -0.01], heart_rate=72)
    time.sleep(0.2)
```

### 2.6 How IoT Data Reaches the Website and “ML”

1. **Ingest**: Device → `POST /api/iot/ingest` (or batch) → backend stores readings in memory (see `backend/services/iot_simulator.py`).
2. **Risk**: When the **Dashboard** or **Wearable** page requests risk, the frontend calls `GET /api/iot/{device_id}/risk`. The backend uses `InjuryPredictorService` (in `backend/services/injury_predictor.py`) to compute:
   - Knee stress, fatigue index, stride imbalance
   - Risk level, alerts, recommendations
   Currently this is **heuristic**. You can replace or extend it with an LSTM or Random Forest trained on the same IoT streams.
3. **History**: `GET /api/iot/{device_id}/history` returns recent readings (for plotting or debugging).

So: **IoT data is transferred to the website by first sending it to the backend API; the website then reads risk and history from the same backend.** The “ML” that uses this data today is the heuristic predictor; swapping in a trained model (e.g. from `ml_models` or a separate IoT-trained model) is the next step.

### 2.7 Using the Website Without a Real Device

On the **Wearable** page you can click **Start Simulation**. The frontend periodically calls `POST /api/iot/ingest` with random accel/gyro/heart rate. The same risk and history APIs are used, so you can test the full flow without hardware.

---

## Part 3: Next Steps – Training an ML Model on IoT Data

To replace or augment the heuristic injury predictor with a trained model:

1. **Collect labeled data**: Run the wearable (or simulator) and label time windows (e.g. “high knee stress” vs “low”) or use pre-defined thresholds to create labels from existing metrics.
2. **Features**: Use the same aggregates as in `injury_predictor.py` (e.g. variance of accel, gyro magnitude over windows, heart rate stats) and add any domain-specific features.
3. **Train**: Use scikit-learn (Random Forest) or Keras (LSTM) in a script or notebook; save the model (e.g. `joblib` or `.h5`).
4. **Integrate**: Load the model in `backend/services/injury_predictor.py` and call it from `predict_from_sensor_data()` instead of or in addition to the current heuristics.
5. **Re-ingest**: Keep using the same IoT endpoints; only the risk computation changes.

---

## Quick Reference

| Task | Command or endpoint |
|------|----------------------|
| Collect pose data | `cd ml_models && python webcam_collector.py` |
| Train squat model | `cd ml_models && python squat_model/train.py` |
| Run webcam detection | `cd ml_models && python detection.py` |
| Send one IoT reading | `POST /api/iot/ingest` with JSON body |
| Get injury risk | `GET /api/iot/{device_id}/risk` |
| Get sensor history | `GET /api/iot/{device_id}/history` |
| Backend docs | `http://localhost:8000/docs` |

For more detail on the ML pipeline and exercise-specific features, see `ml_models/README.md`.
