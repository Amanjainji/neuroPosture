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

## Run on localhost first, then deploy

**Local setup:** Follow **[docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md)** for a step-by-step guide (MongoDB, `.env`, install, run backend + frontend, and quick checks). Summary below.

| Step | What to do |
|------|------------|
| **1. Python** | Use Python 3.11 (3.12+ may work; 3.11 is safest for OpenCV/MediaPipe). |
| **2. Node.js** | Install Node 18+ and npm (for the frontend). |
| **3. MongoDB** | Run MongoDB locally or create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas). Required for login and user profiles. |
| **4. Backend .env** | Create `backend/.env` with `MONGODB_URI=mongodb://localhost:27017` (or your Atlas URI). See `backend/.env.example`. |
| **5. Install deps** | Backend: `pip install -r backend/requirements.txt`. Frontend: `cd frontend && npm install`. |
| **6. Run both** | Backend from **project root** (see Quick Start below). Frontend: `cd frontend && npm run dev`. |

**Deploy later:** Once it works locally, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for production deployment.

## Quick Start

**0. MongoDB** (for user data)
```bash
# Create backend/.env with your MongoDB URI:
# MONGODB_URI=mongodb://localhost:27017
# Or use MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

**1. Install dependencies** (from project root)
```bash
pip install -r backend/requirements.txt
cd frontend && npm install
```

**2. Start backend** (terminal 1, from **project root**)
```bash
uvicorn backend.main:app --reload --port 8000
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

## Deployment

- **[Deployment guide](docs/DEPLOYMENT.md)** – How to deploy (single server, frontend/backend separate), environment variables, MongoDB, and optional Docker.
- **Railway / Render / Docker free tier**: Use **light mode** (Python 3.11 + `requirements-light.txt` or `Dockerfile.light`) so the app runs in 512 MB without OpenCV/MediaPipe; dashboard, profile, devices, IoT, and diet plan work; posture/coach return a “light mode” message until you deploy with the full ML stack.

## ML & IoT

- **[ML and IoT guide](docs/ML-AND-IOT.md)** – How to run ML models (data collection, training, detection) and how to send IoT sensor data (ESP32/MPU6050) to the website and injury-prediction pipeline.
