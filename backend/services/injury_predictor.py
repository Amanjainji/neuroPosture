"""
Injury risk prediction from IoT sensor data.
Uses heuristics + Random Forest-like scoring for movement/fatigue.
"""
import math
from typing import Optional
from collections import deque


class InjuryPredictorService:
    _instance: Optional["InjuryPredictorService"] = None

    @classmethod
    def get_instance(cls) -> "InjuryPredictorService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def predict_from_sensor_data(self, readings: list) -> dict:
        if not readings:
            return {
                "risk_level": "low",
                "score": 0.1,
                "alerts": [],
                "recommendations": ["No sensor data yet. Start moving to get analysis."],
                "knee_stress": 0,
                "fatigue_index": 0,
                "stride_imbalance": 0,
            }

        # Compute metrics from accel/gyro
        knee_stress = self._estimate_knee_stress(readings)
        fatigue = self._estimate_fatigue(readings)
        imbalance = self._estimate_stride_imbalance(readings)

        risk_score = min(1.0, (knee_stress * 0.4 + fatigue * 0.4 + imbalance * 0.2))
        alerts = []
        recommendations = []

        if knee_stress > 0.7:
            alerts.append({"type": "danger", "msg": "High knee stress detected"})
            recommendations.append("Reduce intensity. Consider rest or lighter exercises.")
        elif knee_stress > 0.5:
            alerts.append({"type": "warning", "msg": "Elevated knee loading"})
            recommendations.append("Monitor form. Keep knees aligned over toes.")

        if fatigue > 0.7:
            alerts.append({"type": "danger", "msg": "Overtraining risk"})
            recommendations.append("Take a rest day. Recovery is critical.")
        elif fatigue > 0.5:
            alerts.append({"type": "warning", "msg": "Fatigue building"})
            recommendations.append("Consider cooldown soon.")

        if imbalance > 0.6:
            alerts.append({"type": "warning", "msg": "Stride imbalance detected"})
            recommendations.append("Focus on symmetrical movement. Single-leg drills may help.")

        if not alerts:
            alerts.append({"type": "info", "msg": "Movement patterns look good"})

        risk_level = "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low"

        return {
            "risk_level": risk_level,
            "score": round(risk_score, 3),
            "alerts": alerts,
            "recommendations": list(dict.fromkeys(recommendations)),
            "knee_stress": round(knee_stress, 3),
            "fatigue_index": round(fatigue, 3),
            "stride_imbalance": round(imbalance, 3),
        }

    def _estimate_knee_stress(self, readings: list) -> float:
        if len(readings) < 5:
            return 0.2
        # Use vertical accel (z) variance as proxy for impact
        z_vals = [r.get("accel", [0, 0, 0])[2] for r in readings]
        var = sum((z - sum(z_vals) / len(z_vals)) ** 2 for z in z_vals) / len(z_vals)
        return min(1.0, var / 50)

    def _estimate_fatigue(self, readings: list) -> float:
        if len(readings) < 10:
            return 0.2
        hr = [r.get("heart_rate") for r in readings if r.get("heart_rate")]
        if hr:
            # High sustained HR suggests fatigue
            avg_hr = sum(hr) / len(hr)
            return min(1.0, (avg_hr - 60) / 80)
        # Use gyro magnitude decrease over time (movement decay)
        mags = []
        for r in readings:
            g = r.get("gyro", [0, 0, 0])
            mags.append(math.sqrt(sum(x * x for x in g)))
        if len(mags) > 1:
            early = sum(mags[: len(mags) // 2]) / (len(mags) // 2)
            late = sum(mags[len(mags) // 2 :]) / (len(mags) - len(mags) // 2)
            decay = 1 - (late / early) if early > 0.1 else 0
            return max(0, min(1.0, decay))
        return 0.3

    def _estimate_stride_imbalance(self, readings: list) -> float:
        if len(readings) < 10:
            return 0.2
        # Left vs right asymmetry from accel X
        x_vals = [r.get("accel", [0, 0, 0])[0] for r in readings]
        left = [x for x in x_vals if x < 0]
        right = [x for x in x_vals if x > 0]
        if not left or not right:
            return 0.2
        l_avg = abs(sum(left) / len(left))
        r_avg = abs(sum(right) / len(right))
        diff = abs(l_avg - r_avg) / (max(l_avg, r_avg) + 0.01)
        return min(1.0, diff)
