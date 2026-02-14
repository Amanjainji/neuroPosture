import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Wearable from './pages/Wearable'
import WebcamPosture from './pages/WebcamPosture'
import Coach from './pages/Coach'
import Devices from './pages/Devices'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/wearable"
          element={
            <ProtectedRoute>
              <Layout>
                <Wearable />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/webcam"
          element={
            <ProtectedRoute>
              <Layout>
                <WebcamPosture />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/coach"
          element={
            <ProtectedRoute>
              <Layout>
                <Coach />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/devices"
          element={
            <ProtectedRoute>
              <Layout>
                <Devices />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
