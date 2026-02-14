import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Camera, Wifi, Dumbbell, Settings, LayoutDashboard, LogOut, User, Utensils } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'

function Footer() {
  return (
    <footer className="border-t border-slate-700/50 py-4 px-6 bg-slate-900/30 shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
        <span>NeuroPosture AI &copy; {new Date().getFullYear()}</span>
        <div className="flex items-center gap-4">
          <Link to="/app" className="hover:text-slate-400 transition">Dashboard</Link>
          <Link to="/app/settings" className="hover:text-slate-400 transition">Settings</Link>
        </div>
      </div>
    </footer>
  )
}

const nav = [
  { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/profile', label: 'Profile', icon: User },
  { path: '/app/diet', label: 'Diet Plan', icon: Utensils },
  { path: '/app/wearable', label: 'Wearable', icon: Wifi },
  { path: '/app/webcam', label: 'Posture Scan', icon: Camera },
  { path: '/app/coach', label: 'AI Coach', icon: Dumbbell },
  { path: '/app/devices', label: 'Devices', icon: Activity },
  { path: '/app/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="w-64 border-r border-slate-700/50 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700/50">
          <Link to="/app" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neuro-500 to-cyan-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">NeuroPosture AI</h1>
              <p className="text-xs text-slate-400">Injury Prevention</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                loc.pathname === path
                  ? 'bg-neuro-500/20 text-neuro-400 border border-neuro-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700/50">
          {user && (
            <p className="px-4 py-2 text-sm text-slate-400 truncate" title={user.email}>
              {user.name}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-slate-400 hover:bg-slate-800/50 hover:text-rose-400 transition"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
