import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { analyzePosture } from '../lib/api'

export default function WebcamPosture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    detected: boolean
    injury_risk?: number
    posture_score?: number
    feedback?: string[]
    corrections?: string[]
    exercise?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      setStream(s)
      setResult(null)
    } catch (e) {
      setError('Camera access denied or unavailable')
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
    video.play().catch(() => {})
  }, [stream])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setResult(null)
  }, [stream])

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !stream || analyzing) return

    setAnalyzing(true)
    setResult(null)
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No canvas context')
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataUrl.split(',')[1]
      if (!base64) throw new Error('Failed to capture frame')
      const res = (await analyzePosture(base64)) as {
        detected: boolean
        injury_risk?: number
        posture_score?: number
        feedback?: string[]
        corrections?: string[]
        exercise?: string
      }
      setResult(res)
    } catch (e) {
      setResult({ detected: false, feedback: [(e as Error).message] })
    } finally {
      setAnalyzing(false)
    }
  }, [stream, analyzing])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Posture Scan</h1>
        <p className="text-slate-400 mt-1">
          Use your webcam to detect posture and injury risk
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
                <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Camera off</p>
              </div>
            )}
          </div>
          <div className="p-4 flex gap-3">
            {!stream ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 disabled:opacity-50 transition-colors"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {analyzing ? 'Analyzing...' : 'Analyze Posture'}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>
          {error && <p className="px-4 pb-4 text-rose-400 text-sm">{error}</p>}
        </div>

        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
          <h2 className="font-semibold text-white mb-4">Analysis Results</h2>
          {result ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-lg bg-slate-700/30">
                  <p className="text-sm text-slate-400">Injury Risk</p>
                  <p className="text-2xl font-bold text-white">
                    {result.injury_risk != null ? Math.round(result.injury_risk * 100) : '—'}%
                  </p>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-slate-700/30">
                  <p className="text-sm text-slate-400">Posture Score</p>
                  <p className="text-2xl font-bold text-white">
                    {result.posture_score != null ? Math.round(result.posture_score * 100) : '—'}%
                  </p>
                </div>
              </div>
              {result.exercise && (
                <p className="text-slate-300">
                  Detected: <span className="font-medium text-neuro-400 capitalize">{result.exercise}</span>
                </p>
              )}
              {result.feedback?.length ? (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Feedback</p>
                  <ul className="space-y-1">
                    {result.feedback.map((f, i) => (
                      <li key={i} className="text-slate-300">• {f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.corrections?.length ? (
                <div>
                  <p className="text-sm text-amber-400 mb-2">Corrections</p>
                  <ul className="space-y-1">
                    {result.corrections.map((c, i) => (
                      <li key={i} className="text-amber-300/90">• {c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-slate-400">
              Start the camera and click &quot;Analyze Posture&quot; to get real-time injury risk and posture correction feedback.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
