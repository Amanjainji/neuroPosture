# NeuroPosture AI

**Smart Injury Risk Prediction & Real-Time AI Coach**

A production-ready full-stack AI × IoT web application combining wearable sensors (ESP32 + MPU6050), computer vision (MediaPipe), and ML for injury risk prediction and real-time posture correction.

## Features

- **IoT Wearable Integration**: ESP32 + MPU6050 sensor data (acceleration, gyro, movement)
- **Webcam Posture Analysis**: Real-time pose detection with injury risk scoring
- **AI Injury Prediction**: LSTM/Random Forest models for movement & fatigue analysis
- **Real-Time AI Coach**: Live feedback for squats, lunges, bicep curls, plank
- **Dashboard Alerts**: "High knee stress detected", "Overtraining risk", etc.
- **Stride Imbalance & Overtraining Detection** (extended features)

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: MongoDB (user profiles & settings)
- **AI/CV**: MediaPipe, OpenCV, scikit-learn
- **Real-time**: WebSocket

## Quick Start

**0. MongoDB** (for user data)
```bash
# Create backend/.env with your MongoDB URI:
# Or use MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

**1. Install dependencies**
```bash
pip install -r backend/requirements.txt
cd frontend && npm install
```

**2. Start backend** (terminal 1)
```bash
cd backend && python -m uvicorn main:app --reload --port 8000
```

**3. Start frontend** (terminal 2)
```bash
cd frontend && npm run dev
```

**4. Open** http://localhost:5173

The frontend proxies `/api` to the backend, so both must run for full functionality.

## Project Structure

```
neuroposture-ai/
├── backend/          # FastAPI + ML services
├── frontend/         # React app
├── ml_models/        # Training scripts & model artifacts
└── docs/             # API & IoT schemas
```

## ML & IoT

- **[ML and IoT guide](docs/ML-AND-IOT.md)** – How to run ML models (data collection, training, detection) and how to send IoT sensor data (ESP32/MPU6050) to the website and injury-prediction pipeline.
