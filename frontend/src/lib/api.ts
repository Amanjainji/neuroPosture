const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || '/api'

function getUserEmail(): string | null {
  try {
    const u = localStorage.getItem('neuroposture_user')
    return u ? JSON.parse(u).email : null
  } catch {
    return null
  }
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchApiWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const email = getUserEmail()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) }
  if (email) headers['X-User-Email'] = email
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function postApi<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function patchApiWithAuth<T>(path: string, body: unknown): Promise<T> {
  return fetchApiWithAuth<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const health = () => fetchApi<{ status: string }>('/health')
export const listDevices = () => fetchApi<{ id: string; name: string; type?: string; connected: boolean }[]>('/devices')
export const registerDevice = (data: { id: string; name: string; type: string; connected?: boolean }) =>
  postApi('/devices/register', { ...data, connected: data.connected ?? false })
export const getIotRisk = (deviceId: string) => fetchApi(`/iot/${deviceId}/risk`)
export const getIotHistory = (deviceId: string, limit = 50) =>
  fetchApi(`/iot/${deviceId}/history?limit=${limit}`)
export const ingestSensor = (data: {
  device_id: string
  accel_x: number
  accel_y: number
  accel_z: number
  gyro_x: number
  gyro_y: number
  gyro_z: number
  heart_rate?: number
}) => postApi('/iot/ingest', data)
export const analyzePosture = (imageBase64: string) =>
  postApi('/posture/analyze/base64', { image: imageBase64 })
export const analyzeLandmarks = (landmarks: number[][]) =>
  postApi('/posture/analyze/landmarks', {
    landmarks: landmarks.map(([x, y, z]) => ({ x, y, z, visibility: 1 })),
  })
export const listExercises = () => fetchApi<{ exercises: { id: string; name: string; description?: string }[] }>('/coach/exercises')

// User & settings (MongoDB) - login with 4s timeout to avoid slow hang
const LOGIN_TIMEOUT_MS = 4000
export function loginUser(email: string, name: string): Promise<{ email: string; name: string; settings?: { api_url?: string; default_device?: string } }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS)
  return fetchApi<{ email: string; name: string; settings?: { api_url?: string; default_device?: string } }>(
    '/users/login',
    { method: 'POST', body: JSON.stringify({ email, name }), signal: controller.signal }
  ).finally(() => clearTimeout(timeoutId))
}
export type ProfilePayload = {
  name?: string
  full_name?: string
  phone?: string
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  bmi?: number
  occupation?: string
  previous_injuries?: string[]
}
export const getUserProfile = () => fetchApiWithAuth<{
  email: string
  name: string
  full_name?: string
  phone?: string
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  bmi?: number
  occupation?: string
  previous_injuries?: string[]
  settings?: Record<string, string>
}>('/users/me')
export const updateUserProfile = (data: ProfilePayload) => patchApiWithAuth<{ email: string; name: string }>('/users/me', data)
export const getUserSettings = () => fetchApiWithAuth<{ api_url?: string; default_device?: string }>('/users/me/settings')
export const updateUserSettings = (data: { api_url?: string; default_device?: string }) =>
  patchApiWithAuth<{ api_url?: string; default_device?: string }>('/users/me/settings', data)
