# Squat Model

Based on [Exercise-Correction](https://github.com/NgoQuocBao1010/Exercise-Correction).

## Errors detected

- **Stage**: up vs down (knee angle)
- **Feet placement**: ratio feet_width / shoulder_width
- **Knee placement**: knees out wider than feet

## Landmarks

left_shoulder, right_shoulder, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle

## Training

```bash
# 1. Collect data
python ../webcam_collector.py
# or
python ../pose_extractor.py --webcam --label squat --output data/squat.csv

# 2. Train
python train.py
```

## Output

- `model/stage_model.joblib` - Stage classifier
- `model/scaler.joblib` - Input scaler
- `model/feature_cols.joblib` - Feature names
