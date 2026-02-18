# NeuroPosture AI - ML Models

Posture detection and exercise form correction, inspired by [Exercise-Correction](https://github.com/NgoQuocBao1010/Exercise-Correction).

## Structure

```
ml_models/
├── pose_extractor.py      # Extract landmarks from video/webcam
├── webcam_collector.py    # Interactive data collection
├── detection.py           # Real-time webcam detection
├── utils.py               # Angle/distance helpers
├── squat_model/           # Squat: stage, feet, knee placement
├── bicep_model/           # Bicep: lean back, peak contraction
├── lunge_model/           # Lunge: knee over toe
└── plank_model/           # Plank: hip sag, pike
```

## Quick Start

### 1. Install dependencies

```bash
pip install -r ml_models/requirements.txt
# or from project root: pip install opencv-python mediapipe pandas scikit-learn joblib
```

### 2. Collect data

**Option A – Webcam collector** (interactive):

```bash
cd ml_models
python webcam_collector.py
# Keys: 1-6 = label, SPACE = record, s = save, q = quit
```

**Option B – Pose extractor**:

```bash
python ml_models/pose_extractor.py --webcam --label squat --output data/squat.csv
```

**Option C – Synthetic samples** (no webcam):

```bash
python generate_sample_data.py
```

### 3. Train models

```bash
python squat_model/train.py
python bicep_model/train.py
python lunge_model/train.py
python plank_model/train.py
```

### 4. Run detection (webcam)

```bash
python detection.py
# Keys: 1-4 = exercise, q = quit
```

## Exercises (Reference: Exercise-Correction)

| Exercise    | Errors Detected              | Landmarks                     |
|------------|------------------------------|-------------------------------|
| Squat      | Stage, feet, knee placement  | shoulder, hip, knee, ankle   |
| Lunge      | Knee over toe                | hip, knee, ankle             |
| Bicep Curl | Lean back, peak, loose arm   | nose, shoulder, elbow, wrist |
| Plank      | Hip sag, pike                | shoulder, hip, ankle         |

## IoT Sensor Model

For ESP32 + MPU6050: collect accel/gyro, extract features, train Random Forest or LSTM in `backend/services/injury_predictor.py`.
