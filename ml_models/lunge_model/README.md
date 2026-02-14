# Lunge Model

Based on [Exercise-Correction](https://github.com/NgoQuocBao1010/Exercise-Correction).

## Errors detected

- **Knee over toe**: Front knee should not extend past ankle

## Landmarks

left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle

## Training

```bash
python ../pose_extractor.py --webcam --label lunge
python train.py
```
