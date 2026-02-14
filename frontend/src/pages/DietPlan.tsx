import { useState, useEffect } from 'react'
import { Utensils, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const GENERATE_DELAY_MS = 4000

const GENERATE_PHASES = [
  'Analyzing your profile and goals...',
  'Building your personalized meal plan...',
  'Optimizing for posture and recovery...',
  'Finalizing recommendations...',
]

const SAMPLE_PLANS = [
  {
    title: 'Balanced support for posture & recovery',
    intro: 'Based on your profile, this plan emphasizes anti-inflammatory foods and nutrients that support joint and muscle recovery.',
    days: [
      {
        day: 'Monday',
        meals: {
          breakfast: 'Oatmeal with banana, walnuts, and a dash of cinnamon. Green tea.',
          lunch: 'Grilled chicken salad with leafy greens, olive oil, and quinoa.',
          dinner: 'Salmon with steamed broccoli and sweet potato. Side of Greek yogurt.',
        },
      },
      {
        day: 'Tuesday',
        meals: {
          breakfast: 'Greek yogurt with berries and honey. Whole-grain toast with avocado.',
          lunch: 'Lentil soup with whole-grain bread. Apple.',
          dinner: 'Lean turkey stir-fry with brown rice and mixed vegetables.',
        },
      },
      {
        day: 'Wednesday',
        meals: {
          breakfast: 'Smoothie: spinach, banana, almond milk, protein powder.',
          lunch: 'Tuna wrap with whole-wheat tortilla, greens, and hummus.',
          dinner: 'Baked cod with asparagus and a small portion of couscous.',
        },
      },
    ],
    tips: [
      'Stay hydrated: aim for 2–2.5 L of water per day.',
      'Include omega-3s (fish, flaxseed) to support joint health.',
      'Eat protein at each meal to aid muscle repair.',
    ],
  },
  {
    title: 'Energy & muscle-friendly plan',
    intro: 'Focused on sustained energy and nutrients that help with muscle function and injury prevention.',
    days: [
      {
        day: 'Monday',
        meals: {
          breakfast: 'Eggs with whole-grain toast and spinach. Orange juice.',
          lunch: 'Chickpea bowl with tahini, cucumber, and pita.',
          dinner: 'Grilled chicken with roasted vegetables and a small portion of rice.',
        },
      },
      {
        day: 'Tuesday',
        meals: {
          breakfast: 'Cottage cheese with pineapple and a handful of almonds.',
          lunch: 'Turkey and avocado sandwich on whole grain. Carrot sticks.',
          dinner: 'Salmon, quinoa, and a large mixed salad.',
        },
      },
      {
        day: 'Wednesday',
        meals: {
          breakfast: 'Porridge with nuts, seeds, and berries.',
          lunch: 'Bean chili with a side of greens.',
          dinner: 'Lean beef or tofu with stir-fried vegetables and brown rice.',
        },
      },
    ],
    tips: [
      'Space meals evenly to keep energy stable.',
      'Add magnesium-rich foods (nuts, leafy greens) for muscle support.',
      'Limit processed foods to reduce inflammation.',
    ],
  },
]

export default function DietPlan() {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<typeof SAMPLE_PLANS[0] | null>(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  const startGenerating = () => {
    setPlan(null)
    setGenerating(true)
    setProgress(0)
  }

  useEffect(() => {
    if (!generating) return
    setPhase(0)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, (elapsed / GENERATE_DELAY_MS) * 100))
      const step = Math.floor((elapsed / GENERATE_DELAY_MS) * GENERATE_PHASES.length)
      setPhase(Math.min(step, GENERATE_PHASES.length - 1))
    }, 200)
    const t = setTimeout(() => {
      clearInterval(interval)
      setGenerating(false)
      setProgress(100)
      const idx = user?.name?.length ? user.name.length % SAMPLE_PLANS.length : 0
      setPlan(SAMPLE_PLANS[idx])
    }, GENERATE_DELAY_MS)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [generating])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Diet Plan</h1>
        <p className="text-slate-400 mt-1">Personalized nutrition to support posture and injury prevention</p>
      </div>

      {!plan && !generating && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
          <Utensils className="w-16 h-16 text-neuro-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-6">Generate a diet plan tailored to your profile and goals.</p>
          <button
            onClick={startGenerating}
            className="px-6 py-3 rounded-lg bg-neuro-500 text-white hover:bg-neuro-600 transition-colors font-medium"
          >
            Generate My Diet Plan
          </button>
        </div>
      )}

      {generating && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-neuro-400 animate-spin mb-4" />
            <p className="text-white font-medium mb-1">Generating your personalized diet plan...</p>
            <p className="text-slate-400 text-sm mb-6">{GENERATE_PHASES[phase]}</p>
            <div className="w-full max-w-md h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-neuro-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {plan && !generating && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-2">{plan.title}</h2>
            <p className="text-slate-400">{plan.intro}</p>
          </div>
          {plan.days.map((d) => (
            <div key={d.day} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
              <h3 className="font-semibold text-neuro-400 mb-4">{d.day}</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-slate-500 text-sm">Breakfast</dt>
                  <dd className="text-slate-200">{d.meals.breakfast}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-sm">Lunch</dt>
                  <dd className="text-slate-200">{d.meals.lunch}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-sm">Dinner</dt>
                  <dd className="text-slate-200">{d.meals.dinner}</dd>
                </div>
              </dl>
            </div>
          ))}
          <div className="rounded-xl bg-neuro-500/10 border border-neuro-500/30 p-6">
            <h3 className="font-semibold text-neuro-400 mb-3">Tips</h3>
            <ul className="space-y-2 text-slate-300">
              {plan.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-neuro-500">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={startGenerating}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
          >
            Regenerate Plan
          </button>
        </div>
      )}
    </div>
  )
}
