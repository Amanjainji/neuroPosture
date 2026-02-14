import { Link } from 'react-router-dom'
import { Activity, Camera, Wifi, Dumbbell, Zap, Shield, BarChart3, ArrowRight } from 'lucide-react'

export default function Landing() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neuro-500 to-cyan-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">NeuroPosture AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-white transition">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-slate-400 hover:text-white transition">
              How it works
            </button>
            <Link to="/login" className="px-5 py-2 rounded-lg bg-neuro-500 hover:bg-neuro-600 text-white font-medium transition">
              Sign In
            </Link>
            <Link to="/register" className="px-5 py-2 rounded-lg border border-neuro-500/50 hover:border-neuro-500 text-neuro-400 hover:text-neuro-300 font-medium transition">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neuro-500/10 border border-neuro-500/30 text-neuro-400 text-sm mb-8">
            <Zap className="w-4 h-4" />
            Smart Injury Risk Prediction
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Train Smarter.
            <br />
            <span className="text-neuro-400">Injure Less.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            AI-powered posture analysis and injury risk prediction. Connect wearables, use your webcam, and get
            real-time coaching for squats, lunges, and more.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-neuro-500 hover:bg-neuro-600 text-white font-semibold text-lg transition shadow-lg shadow-neuro-500/25"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold transition"
            >
              See Features
            </button>
          </div>
          {/* Hero image / mockup */}
          <div className="mt-20 relative">
            <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-neuro-500/10 bg-slate-900/50 aspect-video max-w-4xl mx-auto flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80"
                alt="Fitness and technology"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                <div className="flex-1 p-4 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/50">
                  <p className="text-neuro-400 font-medium">Injury Risk</p>
                  <p className="text-2xl font-bold">Low • 12%</p>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/50">
                  <p className="text-neuro-400 font-medium">Posture Score</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-slate-400 text-center max-w-xl mx-auto mb-16">
            From wearables to webcam, get injury prevention and form correction in one place.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Wifi,
                title: 'IoT Wearables',
                desc: 'Connect ESP32 + MPU6050 sensors for movement and fatigue analysis.',
                img: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=400&q=80',
              },
              {
                icon: Camera,
                title: 'Webcam Posture',
                desc: 'Real-time pose detection and injury risk from your camera.',
                img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
              },
              {
                icon: Dumbbell,
                title: 'AI Coach',
                desc: 'Live feedback for squats, lunges, bicep curls, and plank.',
                img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
              },
              {
                icon: BarChart3,
                title: 'Dashboard Alerts',
                desc: 'Knee stress, fatigue, stride imbalance — all in one view.',
                img: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80',
              },
            ].map(({ icon: Icon, title, desc, img }) => (
              <div
                key={title}
                className="group rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-800/30 hover:border-neuro-500/30 transition"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-neuro-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-neuro-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How it works</h2>
          <p className="text-slate-400 text-center max-w-xl mx-auto mb-20">
            Three simple steps to smarter training.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-neuro-500/20 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-neuro-400">
                1
              </div>
              <h3 className="font-semibold text-xl mb-3">Connect or Scan</h3>
              <p className="text-slate-400">
                Pair your wearable sensor or use your webcam. MediaPipe extracts pose landmarks in real time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-neuro-500/20 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-neuro-400">
                2
              </div>
              <h3 className="font-semibold text-xl mb-3">AI Analysis</h3>
              <p className="text-slate-400">
                Our models detect form errors — knee over toe, lean back, hip sag — and compute injury risk scores.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-neuro-500/20 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-neuro-400">
                3
              </div>
              <h3 className="font-semibold text-xl mb-3">Get Feedback</h3>
              <p className="text-slate-400">
                Receive instant corrections and recommendations. Train safer and improve faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '4', label: 'Exercises supported' },
              { value: '33', label: 'Pose landmarks' },
              { value: 'Real-time', label: 'AI feedback' },
              { value: 'IoT', label: 'Wearable ready' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-bold text-neuro-400 mb-2">{value}</p>
                <p className="text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-16 relative">
            <img
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="relative">
              <Shield className="w-16 h-16 text-neuro-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to train smarter?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join NeuroPosture AI and get real-time posture correction and injury risk alerts.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-neuro-500 hover:bg-neuro-600 text-white font-semibold text-lg transition"
              >
                Sign In to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-neuro-500" />
            <span className="font-semibold">NeuroPosture AI</span>
          </div>
          <p className="text-slate-500 text-sm">
            Smart Injury Risk Prediction & Real-Time AI Coach
          </p>
        </div>
      </footer>
    </div>
  )
}
