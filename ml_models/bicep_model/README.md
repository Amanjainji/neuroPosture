# Bicep Curl Model

Based on [Exercise-Correction](https://github.com/NgoQuocBao1010/Exercise-Correction).

## Errors detected

- **Lean back**: Torso angle (ML)
- **Weak peak contraction**: Elbow angle at top
- **Loose upper arm**: Elbow-shoulder angle > 40°

## Landmarks

nose, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_hip, right_hip

## Training

```bash
python ../pose_extractor.py --webcam --label bicep_curl
python train.py
```
