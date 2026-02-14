import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, TrendingUp, Zap, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { health, listDevices, getIotRisk } from '../lib/api'

type Health = { status: string }
type Device = { id: string; name: string; connected: boolean }
type Risk = {
  risk_level: string
  score: number
  alerts: { type: string; msg: string }[]
  recommendations?: string[]
  knee_stress?: number
  fatigue_index?: number
}

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<Health | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [risk, setRisk] = useState<Risk | null>(null)
  const [chartData] = useState([
    { name: 'Mon', stress: 0.3, fatigue: 0.2 },
    { name: 'Tue', stress: 0.5, fatigue: 0.4 },
    { name: 'Wed', stress: 0.2, fatigue: 0.3 },
    { name: 'Thu', stress: 0.6, fatigue: 0.5 },
    { name: 'Fri', stress: 0.4, fatigue: 0.6 },
    { name: 'Sat', stress: 0.3, fatigue: 0.4 },
    { name: 'Sun', stress: 0.2, fatigue: 0.2 },
  ])

  useEffect(() => {
    health().then(setHealthStatus).catch(() => setHealthStatus({ status: 'offline' }))
    listDevices().then(setDevices).catch(() => setDevices([]))
  }, [])

  useEffect(() => {
    const deviceId = devices[0]?.id ?? 'esp32-demo-1'
    getIotRisk(deviceId).then((r) => setRisk(r as Risk)).catch(() => setRisk(null))
  }, [devices])

  const connectedCount = devices.filter((d) => d.connected).length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your injury risk & movement analytics</p>
        </div>
        <Link
          to="/app/profile"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 hover:border-neuro-500/50 text-slate-300 hover:text-neuro-400 transition"
        >
          <User className="w-5 h-5" />
          Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">API Status</p>
              <p className="text-xl font-semibold text-white mt-1">
                {healthStatus?.status === 'healthy' ? 'Online' : 'Offline'}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                healthStatus?.status === 'healthy' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              }`}
            >
              <Activity className={`w-6 h-6 ${healthStatus?.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Devices Connected</p>
              <p className="text-xl font-semibold text-white mt-1">{connectedCount} / {devices.length || 1}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-neuro-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-neuro-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Injury Risk</p>
              <p className="text-xl font-semibold text-white mt-1 capitalize">
                {risk?.risk_level ?? '—'}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                risk?.risk_level === 'high' ? 'bg-rose-500/20' : risk?.risk_level === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
              }`}
            >
              <TrendingUp
                className={`w-6 h-6 ${
                  risk?.risk_level === 'high' ? 'text-rose-400' : risk?.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Risk Score</p>
              <p className="text-xl font-semibold text-white mt-1">
                {risk ? Math.round(risk.score * 100) : '—'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">Weekly Stress & Fatigue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
                <Bar dataKey="stress" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Knee Stress" />
                <Bar dataKey="fatigue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fatigue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">Live Alerts</h2>
          <div className="space-y-3">
            {risk?.alerts?.length ? (
              risk.alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    a.type === 'danger' ? 'bg-rose-500/10 border border-rose-500/30' : a.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-700/30'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-200">{a.msg}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">No active alerts. Connect a wearable or run a posture scan.</p>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              to="/app/wearable"
              className="px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors"
            >
              Wearable
            </Link>
            <Link
              to="/app/webcam"
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Posture Scan
            </Link>
          </div>
        </div>
      </div>

      {risk?.recommendations?.length ? (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">AI Recommendations</h2>
          <ul className="space-y-2">
            {risk.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-neuro-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
