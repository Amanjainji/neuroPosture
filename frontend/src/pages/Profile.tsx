import { useState, useEffect, useMemo } from 'react'
import { User, Briefcase, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile, updateUserProfile, type ProfilePayload } from '../lib/api'

const OCCUPATIONS = [
  'Student',
  'Office Worker',
  'Software Developer',
  'Athlete',
  'Gym Trainer',
  'Driver',
  'Gamer',
]

const INJURY_OPTIONS = [
  'Lower Back Pain',
  'Neck Pain',
  'Shoulder Injury',
  'Knee Injury',
  'Ankle Sprain',
  'Wrist Pain',
  'none',
]

function bmi(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg || heightCm <= 0) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [gender, setGender] = useState('')
  const [heightCm, setHeightCm] = useState<number | ''>('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [occupation, setOccupation] = useState('')
  const [previousInjuries, setPreviousInjuries] = useState<string[]>([])

  const bmiValue = useMemo(() => {
    const h = typeof heightCm === 'number' ? heightCm : parseFloat(String(heightCm))
    const w = typeof weightKg === 'number' ? weightKg : parseFloat(String(weightKg))
    if (!h || !w) return null
    return bmi(h, w)
  }, [heightCm, weightKg])

  useEffect(() => {
    setFullName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user?.name, user?.email])

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }
    getUserProfile()
      .then((u) => {
        setFullName(u.full_name ?? u.name ?? user?.name ?? '')
        setEmail(u.email ?? user?.email ?? '')
        setPhone((u as { phone?: string }).phone ?? '')
        setAge((u as { age?: number }).age ?? '')
        setGender((u as { gender?: string }).gender ?? '')
        setHeightCm((u as { height_cm?: number }).height_cm ?? '')
        setWeightKg((u as { weight_kg?: number }).weight_kg ?? '')
        setOccupation((u as { occupation?: string }).occupation ?? '')
        setPreviousInjuries((u as { previous_injuries?: string[] }).previous_injuries ?? [])
        if (user && setUser) setUser({ ...user, name: (u.full_name ?? u.name) || user.name, email: u.email ?? user.email })
      })
      .catch(() => {
        setFullName(user?.name ?? '')
        setEmail(user?.email ?? '')
      })
      .finally(() => setLoading(false))
  }, [user?.email])

  const toggleInjury = (item: string) => {
    if (item === 'none') {
      setPreviousInjuries([])
      return
    }
    setPreviousInjuries((prev) => {
      const next = prev.filter((i) => i !== 'none' && i !== item)
      if (prev.includes(item)) return next
      return [...next, item]
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    const payload: ProfilePayload = {
      name: fullName.trim() || user.name,
      full_name: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      age: typeof age === 'number' ? age : age === '' ? undefined : Number(age),
      gender: gender || undefined,
      height_cm: typeof heightCm === 'number' ? heightCm : heightCm === '' ? undefined : Number(heightCm),
      weight_kg: typeof weightKg === 'number' ? weightKg : weightKg === '' ? undefined : Number(weightKg),
      bmi: bmiValue ?? undefined,
      occupation: occupation || undefined,
      previous_injuries: previousInjuries.length ? previousInjuries : undefined,
    }
    try {
      const u = await updateUserProfile(payload)
      setUser?.({ ...user, name: u.name })
      setMessage({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neuro-500'
  const labelClass = 'block text-sm text-slate-400 mb-1'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Your account and health info for injury prediction</p>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Personal */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-neuro-400" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} readOnly className={inputClass + ' opacity-80'} />
              </div>
              <div>
                <label className={labelClass}>Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="25"
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input
                  type="number"
                  min={50}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="170"
                />
              </div>
              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="70"
                />
              </div>
              <div>
                <label className={labelClass}>BMI (auto-calculated)</label>
                <div className="px-4 py-2 rounded-lg bg-slate-700/30 border border-slate-600 text-white">
                  {bmiValue != null ? bmiValue : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Occupation */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-neuro-400" />
              Occupation & Work Style
            </h2>
            <div>
              <label className={labelClass}>Occupation</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Injury history */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Injury & Health History
            </h2>
            <p className="text-slate-400 text-sm mb-4">Critical for injury prediction AI.</p>
            <div className="flex flex-wrap gap-3">
              {INJURY_OPTIONS.map((item) => (
                <label
                  key={item}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${
                    previousInjuries.includes(item) || (item === 'none' && previousInjuries.length === 0)
                      ? 'border-neuro-500 bg-neuro-500/20 text-neuro-300'
                      : 'border-slate-600 bg-slate-700/30 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={previousInjuries.includes(item) || (item === 'none' && previousInjuries.length === 0)}
                    onChange={() => toggleInjury(item)}
                    className="sr-only"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}
    </div>
  )
}
