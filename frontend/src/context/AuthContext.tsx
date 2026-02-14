import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser } from '../lib/api'

type User = { email: string; name: string; id?: string; settings?: { api_url?: string; default_device?: string } }

type AuthContextType = {
  user: User | null
  login: (email: string, password: string, displayName?: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  setUser: (u: User | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'neuroposture_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }, [user])

  const login = async (email: string, _password: string, displayName?: string): Promise<boolean> => {
    const trimmed = email.trim()
    const derivedName = trimmed.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const name = (displayName && displayName.trim()) || derivedName || 'User'
    const fallback = {
      email: trimmed,
      name,
      settings: { api_url: 'http://localhost:8000', default_device: 'esp32-demo-1' } as const,
    }
    try {
      const u = await loginUser(trimmed, name)
      setUser({
        email: u.email ?? trimmed,
        name: (u.name ?? name) || 'User',
        settings: u.settings ?? fallback.settings,
      })
      return true
    } catch {
      setUser(fallback)
      return true
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
