import { useRef, useState, useCallback, useEffect } from 'react'
import { Dumbbell } from 'lucide-react'
import { listExercises, analyzePosture } from '../lib/api'

type Exercise = { id: string; name: string; description?: string }

export default function Coach() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    injury_risk?: number
    posture_score?: number
    corrections?: string[]
    exercise?: string
  } | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    listExercises().then((r) => setExercises(r.exercises || [])).catch(() => {})
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      setStream(s)
    } catch {
      setFeedback({ corrections: ['Camera access denied'] })
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
    video.play().catch(() => {})
  }, [stream])

  const stopSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setActive(false)
    setFeedback(null)
  }, [stream])

  const runAnalysis = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !stream) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    const base64 = dataUrl.split(',')[1]
    if (!base64) return

    try {
      const res = (await analyzePosture(base64)) as { injury_risk?: number; posture_score?: number; corrections?: string[]; exercise?: string }
      setFeedback({
        injury_risk: res.injury_risk,
        posture_score: res.posture_score,
        corrections: res.corrections,
        exercise: res.exercise,
      })
    } catch {
      setFeedback({ corrections: ['Analysis failed'] })
    }
  }, [stream])

  const startSession = useCallback(async () => {
    if (!stream) {
      await startCamera()
    }
    setActive(true)
    runAnalysis()
    const id = setInterval(runAnalysis, 1500)
    intervalRef.current = id
  }, [stream, startCamera, runAnalysis])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Real-Time AI Coach</h1>
        <p className="text-slate-400 mt-1">
          Live posture correction for squats, lunges, bicep curls, plank
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <div className="text-center text-slate-500">
                <Dumbbell className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Start a session to begin</p>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            {!active ? (
              <button
                onClick={startSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors"
              >
                <Dumbbell className="w-4 h-4" />
                Start AI Coach Session
              </button>
            ) : (
              <button
                onClick={stopSession}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                Stop Session
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">Exercises Supported</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {exercises.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  selected === e.id ? 'bg-neuro-500/20 border border-neuro-500/50' : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                }`}
              >
                <p className="font-medium text-white">{e.name}</p>
                <p className="text-xs text-slate-400">{e.description}</p>
              </button>
            ))}
          </div>

          <h2 className="font-semibold text-white mb-4">Live Feedback</h2>
          {feedback ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg bg-slate-700/30">
                  <p className="text-sm text-slate-400">Injury Risk</p>
                  <p className="text-xl font-bold text-white">
                    {feedback.injury_risk != null ? Math.round(feedback.injury_risk * 100) : '—'}%
                  </p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-slate-700/30">
                  <p className="text-sm text-slate-400">Form Score</p>
                  <p className="text-xl font-bold text-white">
                    {feedback.posture_score != null ? Math.round(feedback.posture_score * 100) : '—'}%
                  </p>
                </div>
              </div>
              {feedback.exercise && (
                <p className="text-slate-300">
                  Detected: <span className="font-medium text-neuro-400 capitalize">{feedback.exercise}</span>
                </p>
              )}
              {feedback.corrections?.length ? (
                <div>
                  <p className="text-sm text-amber-400 mb-2">Corrections</p>
                  <ul className="space-y-1">
                    {feedback.corrections.map((c, i) => (
                      <li key={i} className="text-amber-300/90">• {c}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-emerald-400">Form looks good! Keep it up.</p>
              )}
            </div>
          ) : (
            <p className="text-slate-400">
              Start a session to get real-time posture correction feedback.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
