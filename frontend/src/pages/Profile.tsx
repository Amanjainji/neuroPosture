import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile, updateUserProfile } from '../lib/api'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }
    getUserProfile()
      .then((u) => {
        setName(u.name ?? user?.name ?? '')
        if (user && setUser) setUser({ ...user, name: u.name ?? user.name, email: u.email ?? user.email })
      })
      .catch(() => {
        setName(user?.name ?? '')
      })
      .finally(() => setLoading(false))
  }, [user?.email])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    try {
      const u = await updateUserProfile({ name: name.trim() })
      setUser?.({ ...user, name: u.name })
      setMessage({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Your account information</p>
      </div>

      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 max-w-xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-neuro-500/20 flex items-center justify-center">
            <User className="w-10 h-10 text-neuro-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Email</p>
            <p className="text-white font-medium">{user?.email ?? '—'}</p>
          </div>
        </div>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : null}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500"
              placeholder="Your name"
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
