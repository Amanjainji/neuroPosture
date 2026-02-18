# Run NeuroPosture AI on localhost

Use this guide to get the app running locally first. After it works, follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy.

---

## 1. Prerequisites

- **Python 3.11** (or 3.12): `python3 --version`
- **Node.js 18+** and npm: `node --version` and `npm --version`
- **MongoDB**: either local or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## 2. MongoDB (choose one)

### Option A: MongoDB locally

- Install and start MongoDB (e.g. `sudo systemctl start mongod` on Linux, or start the MongoDB service on Windows/Mac).
- Use this URI in step 3: `mongodb://localhost:27017`

### Option B: MongoDB Atlas (free)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and get the connection string.
3. In the cluster, click **Connect** → **Connect your application** → copy the URI (e.g. `mongodb+srv://user:password@cluster.mongodb.net/`).
4. Replace `<password>` in the URI with your database user password. Use that URI in step 3.

---

## 3. Backend environment

From the **project root** (the folder that contains `backend/` and `frontend/`):

```bash
# Create backend/.env (copy from example if you have it)
echo "MONGODB_URI=mongodb://localhost:27017" > backend/.env
```

- If using **Atlas**, put your full URI in `backend/.env`:
  ```env
  MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/
  ```

---

## 4. Install dependencies

From the **project root**:

```bash
# Backend (Python)
pip install -r backend/requirements.txt

# Frontend (Node)
cd frontend && npm install && cd ..
```

Use a virtualenv if you prefer:

```bash
python3 -m venv venv
source venv/bin/activate   # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install -r backend/requirements.txt
```

---

## 5. Start the backend

**Terminal 1** – from the **project root**:

```bash
uvicorn backend.main:app --reload --port 8000
```

You should see something like:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

- API docs: http://localhost:8000/docs  
- Health: http://localhost:8000/api/health  

If you get **database connection errors**, check that MongoDB is running and that `backend/.env` has the correct `MONGODB_URI`.

---

## 6. Start the frontend

**Terminal 2** – from the **project root**:

```bash
cd frontend && npm run dev
```

You should see:

```text
  Vite dev server running at http://localhost:5173
```

---

## 7. Use the app

1. Open **http://localhost:5173** in your browser.
2. Register or log in (uses MongoDB for persistence).
3. Try:
   - **Dashboard** – overview
   - **Webcam / Posture** – camera + posture analysis (needs full backend with OpenCV/MediaPipe)
   - **AI Coach** – exercise feedback
   - **Wearable** – IoT risk (can test with API or simulator)
   - **Profile, Settings, Diet plan** – user features

The frontend proxies `/api` to `http://localhost:8000`, so **both backend and frontend must be running**.

---

## 8. Quick checks

| Check | Command / URL |
|-------|----------------|
| Backend up | http://localhost:8000/api/health → `{"status":"ok"}` or similar |
| API docs | http://localhost:8000/docs |
| Frontend up | http://localhost:5173 loads the app |

---

## 9. Optional: run without MongoDB

If you don’t have MongoDB yet, the app may still start but **login/register can fail**. For a quick backend-only test:

- Open http://localhost:8000/docs and try **GET /api/health** and **GET /api/devices**.
- Set up MongoDB and `backend/.env` when you want to use login and profiles.

---

## Next: deploy

Once everything works on localhost, see **[DEPLOYMENT.md](DEPLOYMENT.md)** for:

- Deploying backend + frontend (single server or separate)
- Environment variables in production
- Light mode (no OpenCV/MediaPipe) for free-tier hosts
- Docker and platform notes (Railway, Render, etc.)
