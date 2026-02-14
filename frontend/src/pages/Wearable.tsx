import { useEffect, useState, useCallback } from 'react'
import { Wifi, Play, Square, Activity } from 'lucide-react'
import { getIotRisk, ingestSensor } from '../lib/api'

const DEVICE_ID = 'esp32-demo-1'

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function Wearable() {
  const [connected, setConnected] = useState(false)
  const [risk, setRisk] = useState<{
    risk_level: string
    score: number
    alerts: { type: string; msg: string }[]
    knee_stress: number
    fatigue_index: number
    stride_imbalance: number
  } | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)

  const fetchRisk = useCallback(() => {
    getIotRisk(DEVICE_ID).then((r) => setRisk(r as typeof risk)).catch(() => setRisk(null))
  }, [])

  useEffect(() => {
    if (connected) fetchRisk()
  }, [connected, fetchRisk])

  const startSimulation = () => {
    if (intervalId) return
    setConnected(true)
    const id = setInterval(() => {
      ingestSensor({
        device_id: DEVICE_ID,
        accel_x: rand(-2, 2),
        accel_y: rand(-2, 2),
        accel_z: rand(8, 11),
        gyro_x: rand(-0.5, 0.5),
        gyro_y: rand(-0.5, 0.5),
        gyro_z: rand(-0.5, 0.5),
        heart_rate: Math.round(rand(65, 95)),
      }).catch(() => {})
    }, 200)
    setIntervalId(id)
    setSimulating(true)
    setTimeout(fetchRisk, 500)
  }

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setSimulating(false)
    setConnected(false)
    setRisk(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Wearable Sensor</h1>
        <p className="text-slate-400 mt-1">
          ESP32 + MPU6050 – Simulate or connect a real device
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Device Connection
          </h2>
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                connected ? 'bg-neuro-500/20' : 'bg-slate-700'
              }`}
            >
              <Activity className={`w-8 h-8 ${connected ? 'text-neuro-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className="font-medium text-white">ESP32 + MPU6050</p>
              <p className="text-sm text-slate-400">{connected ? 'Connected' : 'Disconnected'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={startSimulation}
              disabled={simulating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              {simulating ? 'Simulating...' : 'Start Simulation'}
            </button>
            <button
              onClick={stopSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Simulates accelerometer, gyroscope, and heart rate data for injury risk analysis.
          </p>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">Injury Risk Analysis</h2>
          {risk ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                <span className="text-slate-400">Risk Level</span>
                <span
                  className={`font-semibold capitalize ${
                    risk.risk_level === 'high' ? 'text-rose-400' : risk.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {risk.risk_level}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-400">Knee Stress</p>
                  <p className="text-lg font-semibold text-white">{Math.round(risk.knee_stress * 100)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-400">Fatigue</p>
                  <p className="text-lg font-semibold text-white">{Math.round(risk.fatigue_index * 100)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-400">Imbalance</p>
                  <p className="text-lg font-semibold text-white">{Math.round(risk.stride_imbalance * 100)}%</p>
                </div>
              </div>
              {risk.alerts?.length ? (
                <div className="space-y-2">
                  {risk.alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`text-sm p-3 rounded-lg ${
                        a.type === 'danger' ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {a.msg}
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                onClick={fetchRisk}
                className="w-full py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Refresh Analysis
              </button>
            </div>
          ) : (
            <p className="text-slate-400">
              Start simulation to see injury risk predictions from sensor data.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
