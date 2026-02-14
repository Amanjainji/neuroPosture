# NeuroPosture AI – Deployment Guide

This guide covers how to deploy the NeuroPosture AI app (React frontend + FastAPI backend + MongoDB) to a server or PaaS.

---

## Table of contents

1. [Overview](#overview)
2. [Lightweight deploy (Railway / Render / Docker free tier)](#lightweight-deploy-railway--render--docker-free-tier)
3. [Environment variables](#environment-variables)
4. [Option A: Single server (backend serves frontend)](#option-a-single-server-backend-serves-frontend)
5. [Option B: Frontend and backend separately](#option-b-frontend-and-backend-separately)
6. [MongoDB](#mongodb)
7. [Production run](#production-run)
8. [Platform notes (Railway, Render, Vercel, etc.)](#platform-notes-railway-render-vercel-etc)
9. [Docker (optional)](#docker-optional)

---

## Overview

- **Frontend**: React + Vite, build output in `frontend/dist`.
- **Backend**: FastAPI (Python), serves `/api/*` and optionally the built frontend.
- **Database**: MongoDB (user profiles, settings). Required for login/profile persistence.

You can either:

- **Option A**: Build the frontend and serve it from the FastAPI process (one URL, one server).
- **Option B**: Deploy frontend and backend to different hosts (e.g. Vercel + Railway), and point the frontend at the backend API URL.

---

## Lightweight deploy (Railway / Render / Docker free tier)

Free tiers often fail with the **full** backend because of:

1. **Python version** – 3.13 (or newer) can break some deps. **Use Python 3.11.**
2. **Memory (512 MB)** – OpenCV + MediaPipe + scikit-learn need ~700 MB–1 GB at import.
3. **Native binaries** – MediaPipe/OpenCV expect system libs that minimal images don’t have.

**Solution: run in “light” mode** – no OpenCV/MediaPipe/scikit-learn at install or startup. The app still serves:

- Dashboard, Profile, Settings, Devices, Diet Plan, Users (MongoDB)
- IoT ingest and injury risk from sensor data (heuristics only)
- Health and API docs

**Posture Scan** and **AI Coach** (image/pose analysis) will return a friendly “ML stack not available (light deployment mode)” message until you deploy with the full ML stack.

### 1. Pin Python to 3.11

- **Render**: `runtime.txt` in the repo root with:
  ```text
  python-3.11.9
  ```
- **Railway**: Set Python version in dashboard or use `Dockerfile.light` (below).
- **Docker**: Use `FROM python:3.11-slim` (see `Dockerfile.light`).

### 2. Use light dependencies

Install only the light requirements (no opencv, mediapipe, scikit-learn):

```bash
pip install -r backend/requirements-light.txt
```

Do **not** use `backend/requirements.txt` on 512 MB / free-tier hosts unless you have a larger plan.

### 3. Railway / Render (no Docker)

- **Build command**: build frontend, then install Python deps.
  - Example (root): `cd frontend && npm ci && npm run build && cd ../backend && pip install -r requirements-light.txt`
- **Start command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`  
  Or from root: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` (set `PYTHONPATH=/app` or project root).
- **Root directory**: project root (so `backend/` and `frontend/` exist).
- Set env: `MONGODB_URI`, `CORS_ORIGINS`, and if you built frontend: `FRONTEND_DIST=./frontend/dist` (path relative to where you run uvicorn).

### 4. Docker (light image)

Use the provided light Dockerfile (Python 3.11, no ML libs):

```bash
docker build -f Dockerfile.light -t neuroposture-ai .
docker run -p 8000:8000 -e MONGODB_URI="your-uri" neuroposture-ai
```

- **Railway**: Set Dockerfile path to `Dockerfile.light` in the dashboard.
- **Render**: In “Docker” deploy, set Dockerfile to `Dockerfile.light`.

Heavy ML (posture from images) is only available if you later deploy with the full `requirements.txt` and a runtime that supports OpenCV/MediaPipe (e.g. paid tier or self-hosted with enough RAM).

---

## Environment variables

### Backend (`backend/.env` or host’s env)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes (for profiles) | MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/atlas)). |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (e.g. `https://myapp.com`). Defaults to localhost. |
| `FRONTEND_DIST` | No | Absolute or relative path to `frontend/dist` when serving SPA from FastAPI (Option A). |

### Frontend (Option B only)

If the frontend is on a different domain than the API, set the API base URL at build time:

- Add to `frontend/.env.production` (create if missing):
  ```env
  VITE_API_URL=https://your-api.example.com/api
  ```
  Use the full API base including `/api` (e.g. `https://neuroposture-api.railway.app/api`). The app already reads `VITE_API_URL` in `src/lib/api.ts` and falls back to `/api` when unset. Rebuild after changing.

---

## Option A: Single server (backend serves frontend)

One deployment: FastAPI serves both the API and the built React app.

### 1. Build the frontend

```bash
cd frontend
npm ci
npm run build
```

Output: `frontend/dist/`.

### 2. Backend environment

Create `backend/.env` (or set env vars on the host):

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
# Optional: allow your domain if you use a reverse proxy
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
# Path to frontend build (relative to backend working directory or absolute)
FRONTEND_DIST=../frontend/dist
```

From the **backend** directory, `../frontend/dist` is one level up and into `frontend/dist`. If you run the app from the project root, use `frontend/dist`.

### 3. Run the backend (production)

From the **backend** directory:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

- Open `http://your-server:8000` for the app.
- API: `http://your-server:8000/api/...`
- Docs: `http://your-server:8000/docs`

No separate frontend server needed; the backend serves the SPA and falls back to `index.html` for client-side routes.

---

## Option B: Frontend and backend separately

Example: frontend on Vercel/Netlify, backend on Railway/Render.

### 1. Backend

- Set `MONGODB_URI` and `CORS_ORIGINS` (include your frontend URL, e.g. `https://myapp.vercel.app`).
- Do **not** set `FRONTEND_DIST`.
- Deploy the `backend/` app and note the API URL (e.g. `https://neuroposture-api.railway.app`).

### 2. Frontend

- Set `VITE_API_URL` to that API URL (see [Environment variables](#environment-variables)).
- Build: `npm run build`.
- Deploy the contents of `frontend/dist` to your static host.

The app will call `VITE_API_URL` (e.g. `https://neuroposture-api.railway.app/api`) for all requests.

---

## MongoDB

- **Atlas (recommended)**: Create a cluster, get the connection string, and set `MONGODB_URI`. Add your server’s IP (or use 0.0.0.0/0 for cloud backends) in Network Access.
- **Self-hosted**: Run MongoDB and set e.g. `MONGODB_URI=mongodb://localhost:27017`. The app uses database name `neuroposture`.

Without a valid `MONGODB_URI`, login and profile save will use in-memory fallbacks and data will not persist across restarts or reloads.

---

## Production run

- Use a process manager (e.g. systemd, Supervisor) or your platform’s start command.
- Multiple workers (optional):
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
  ```
- For HTTPS, put a reverse proxy (Nginx, Caddy, or your host’s proxy) in front and keep `uvicorn` on HTTP.

---

## Platform notes (Railway, Render, Vercel, etc.)

### Railway / Render (backend) – use light mode on free tier

- **Free tier**: Use **Lightweight deploy** above: `requirements-light.txt`, Python 3.11, and optionally `Dockerfile.light`. Do not use full `requirements.txt` on 512 MB.
- Set env: `MONGODB_URI`, `CORS_ORIGINS` (your frontend URL).
- Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` from repo root (or `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`).
- If you built frontend in the same repo, set `FRONTEND_DIST=./frontend/dist` (or the path where `dist` lives relative to the working directory).

### Vercel / Netlify (frontend only)

- Build: `npm run build`, publish `frontend/dist` (or set build output to `frontend` and output dir to `dist`).
- Set `VITE_API_URL` in the dashboard to your backend API base URL (no `/api` suffix if your backend serves at `https://api.example.com/api` – then use `https://api.example.com` so the app can call `/api` relative to that; or point directly to `https://api.example.com` and in code use that as base and path `/api`).

Actually: if `BASE = import.meta.env.VITE_API_URL || '/api'`, then `VITE_API_URL` should be the full base for API calls, e.g. `https://api.example.com` and in `api.ts` you’d do `BASE + path` where path is `/api/health` etc. So the backend must serve at `https://api.example.com/api/...`. So `VITE_API_URL=https://api.example.com` and paths in code are like `/api/health` → full URL `https://api.example.com/api/health`. Good.

### Single app on Railway / Render (Option A)

- Build frontend in a build step, then run backend with `FRONTEND_DIST` set to the path where `dist` was produced (e.g. `./frontend/dist` if you’re at repo root and built frontend there).
- Start: from repo root, e.g. `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`, and set `FRONTEND_DIST=../frontend/dist` if you’re in `backend` and frontend was built at `frontend/dist`.

---

## Docker (optional)

### Light image (recommended for free tier)

Uses Python 3.11 and **no** OpenCV/MediaPipe – stays under 512 MB and avoids native binary issues:

```bash
docker build -f Dockerfile.light -t neuroposture-ai .
docker run -p 8000:8000 -e MONGODB_URI="your-uri" neuroposture-ai
```

See [Lightweight deploy](#lightweight-deploy-railway--render--docker-free-tier) for what works in this mode.

### Full image (ML posture analysis)

Only use on hosts with enough RAM (~1 GB+) and compatible system libs:

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend with full ML stack
FROM python:3.11-slim
WORKDIR /app
COPY backend/ ./backend/
RUN apt-get update && apt-get install -y --no-install-recommends libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY --from=frontend /app/frontend/dist ./frontend/dist
ENV FRONTEND_DIST=/app/frontend/dist
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t neuroposture-ai .
docker run -p 8000:8000 -e MONGODB_URI="your-uri" neuroposture-ai
```

---

## Checklist

- [ ] `MONGODB_URI` set and reachable from the backend.
- [ ] `CORS_ORIGINS` includes your frontend URL (if frontend and backend are on different origins).
- [ ] For Option A: `FRONTEND_DIST` set and `frontend/dist` built and available to the backend process.
- [ ] For Option B: `VITE_API_URL` set and frontend rebuilt; backend allows the frontend origin in CORS.
- [ ] Backend listens on `0.0.0.0` and the port your host expects (e.g. `$PORT`).
- [ ] HTTPS and domain handled by your reverse proxy or platform.

For ML models and IoT ingestion, see [ML-AND-IOT.md](ML-AND-IOT.md).
