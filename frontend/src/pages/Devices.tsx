import { useEffect, useState } from 'react'
import { Activity, Plus, Trash2, X } from 'lucide-react'
import { listDevices, registerDevice } from '../lib/api'

type Device = { id: string; name: string; type?: string; connected: boolean }

const DEVICE_TYPES = [
  { value: 'esp32', label: 'ESP32' },
  { value: 'mpu6050', label: 'MPU6050 Sensor' },
  { value: 'heart_rate', label: 'Heart Rate Monitor' },
]

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', type: 'esp32' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchDevices = () => {
    listDevices().then(setDevices).catch(() => setDevices([]))
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const id = form.id.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-') || 'device-' + Date.now()
    const name = form.name.trim() || id
    if (!name) {
      setError('Enter a device name')
      return
    }
    setLoading(true)
    try {
      await registerDevice({
        id: id || 'device-' + Date.now(),
        name,
        type: form.type,
        connected: false,
      })
      setShowModal(false)
      setForm({ id: '', name: '', type: 'esp32' })
      fetchDevices()
    } catch (err) {
      setError((err as Error).message || 'Failed to add device')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Devices</h1>
        <p className="text-slate-400 mt-1">Manage connected wearables (ESP32, MPU6050)</p>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-white">Registered Devices</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {devices.length ? (
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      d.connected ? 'bg-neuro-500/20' : 'bg-slate-600/50'
                    }`}
                  >
                    <Activity className={`w-6 h-6 ${d.connected ? 'text-neuro-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{d.name || d.id}</p>
                    <p className="text-sm text-slate-400">{d.id} • {d.type || 'sensor'} • {d.connected ? 'Connected' : 'Disconnected'}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-600 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 py-8 text-center">
            No devices registered. Click &quot;Add Device&quot; or use the Wearable page to simulate.
          </p>
        )}
      </div>

      {/* Add Device Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add Device</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Device Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. ESP32 Living Room"
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Device ID (optional)</label>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Auto-generated if blank"
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-neuro-500"
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-rose-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-neuro-500 hover:bg-neuro-600 text-white font-medium transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
