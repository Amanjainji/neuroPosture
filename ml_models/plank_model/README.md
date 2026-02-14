# Plank Model

Based on [Exercise-Correction](https://github.com/NgoQuocBao1010/Exercise-Correction).

## Errors detected

- **Hip sag**: Hips drop below shoulder-ankle line
- **Pike**: Hips too high

## Landmarks

left_shoulder, right_shoulder, left_hip, right_hip, left_ankle, right_ankle

## Training

```bash
python ../pose_extractor.py --webcam --label plank
python train.py
```
