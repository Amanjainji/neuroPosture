import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { analyzeLandmarks } from '../lib/api'

// MediaPipe JS imports
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose'
import { Camera as MpCamera } from '@mediapipe/camera_utils'

export default function WebcamPosture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null) // hidden for screenshot
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null) // overlay for landmarks
  const [stream, setStream] = useState<MediaStream | null>(null)
  // const [analyzing, setAnalyzing] = useState(false)  // removed, no longer needed
  const [result, setResult] = useState<{
    detected: boolean
    injury_risk?: number
    posture_score?: number
    feedback?: string[]
    corrections?: string[]
    exercise?: string
  } | null>(null)
  const [live, setLive] = useState(false) // continuous analysis
  const [landmarks, setLandmarks] = useState<number[][] | null>(null)
  const landmarksRef = useRef<number[][] | null>(null)
  const liveIntervalRef = useRef<number | null>(null)
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

  // set up MediaPipe pose when stream starts
  useEffect(() => {
    if (!stream) return
    const video = videoRef.current
    const landmarkCanvas = landmarkCanvasRef.current
    if (!video || !landmarkCanvas) return

    const pose = new Pose({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`})
    pose.setOptions({modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5})
    pose.onResults((res: Results) => {
      if (res.poseLandmarks && res.poseLandmarks.length > 0) {
        const pts = res.poseLandmarks.map((lm) => [lm.x, lm.y, lm.z])
        setLandmarks(pts)
        // draw overlay
        const lc = landmarkCanvas
        lc.width = video.videoWidth
        lc.height = video.videoHeight
        const lctx = lc.getContext('2d')
        if (lctx) {
          lctx.clearRect(0, 0, lc.width, lc.height)
          lctx.fillStyle = 'rgba(0,255,0,0.8)'
          pts.forEach((lm) => {
            const x = lm[0] * lc.width
            const y = lm[1] * lc.height
            lctx.beginPath()
            lctx.arc(x, y, 5, 0, 2 * Math.PI)
            lctx.fill()
          })
        }
      }
    })
    const camera = new MpCamera(video, {
      onFrame: async () => await pose.send({image: video}),
      width: 640,
      height: 480,
    })
    camera.start()
    return () => {
      camera.stop()
      pose.close()
    }
  }, [stream])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
    video.play().catch(() => {})
  }, [stream])

  const stopCamera = useCallback(() => {
    // stop live loop and camera stream
    setLive(false)
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
    }
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setResult(null)
  }, [stream])

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  // read landmarks from ref to avoid re-creating interval effect when landmarks change
  const captureAndAnalyze = useCallback(async () => {
    const pts = landmarksRef.current
    if (!pts) return
    setResult(null)
    try {
      const res = await analyzeLandmarks(pts)
      setResult(res as any)
    } catch (e) {
      setResult({ detected: false, feedback: [(e as Error).message] })
    }
  }, [])

  // continuous capture loop when live mode is active
  // interval used during live mode (milliseconds). bump to 1000 for one-second updates.
  const LIVE_INTERVAL = 500

  // keep landmarksRef in sync with latest landmarks
  useEffect(() => {
    landmarksRef.current = landmarks
  }, [landmarks])

  useEffect(() => {
    if (!live || !stream) {
      // ensure interval cleared when stopping live or stopping stream
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
        liveIntervalRef.current = null
      }
      return
    }

    // start a single interval that sends at LIVE_INTERVAL regardless of frame rate
    if (!liveIntervalRef.current) {
      liveIntervalRef.current = window.setInterval(() => {
        const pts = landmarksRef.current
        if (pts) {
          // fire-and-forget; captureAndAnalyze updates state
          void captureAndAnalyze()
        }
      }, LIVE_INTERVAL) as unknown as number
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
        liveIntervalRef.current = null
      }
    }
  }, [live, stream, captureAndAnalyze])

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
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={landmarkCanvasRef}
                    className="absolute top-0 left-0"
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  />
                </div>
                <canvas ref={captureCanvasRef} className="hidden" />
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
                  disabled={!landmarks || live}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 disabled:opacity-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Analyze Posture
                </button>
                <button
                  onClick={() => setLive((l) => !l)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  {live ? 'Stop Live' : 'Start Live'}
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
            <>
              <p className="text-sm text-slate-400">{live && 'Live mode'} </p>
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
            </>  
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
