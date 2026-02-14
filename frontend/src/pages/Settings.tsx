import { useState, useEffect } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserSettings, updateUserSettings } from '../lib/api'

const DEFAULT_API_URL = 'http://localhost:8000'
const DEFAULT_DEVICE = 'esp32-demo-1'

export default function Settings() {
  const { user, setUser } = useAuth()
  const [apiUrl, setApiUrl] = useState(user?.settings?.api_url ?? DEFAULT_API_URL)
  const [defaultDevice, setDefaultDevice] = useState(user?.settings?.default_device ?? DEFAULT_DEVICE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setApiUrl(user?.settings?.api_url ?? DEFAULT_API_URL)
    setDefaultDevice(user?.settings?.default_device ?? DEFAULT_DEVICE)
  }, [user?.settings?.api_url, user?.settings?.default_device])

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }
    getUserSettings()
      .then((s) => {
        if (s.api_url) setApiUrl(s.api_url)
        if (s.default_device) setDefaultDevice(s.default_device)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.email])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await updateUserSettings({ api_url: apiUrl.trim(), default_device: defaultDevice.trim() })
      if (user && setUser) setUser({ ...user, settings: { api_url: apiUrl.trim(), default_device: defaultDevice.trim() } })
      setMessage({ type: 'success', text: 'Settings saved' })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Configure NeuroPosture AI</p>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 max-w-xl">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          General
        </h2>
        {loading ? (
          <p className="text-slate-400 mb-4">Loading...</p>
        ) : null}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500"
              placeholder={DEFAULT_API_URL}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Default Device</label>
            <input
              type="text"
              value={defaultDevice}
              onChange={(e) => setDefaultDevice(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500"
              placeholder={DEFAULT_DEVICE}
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
