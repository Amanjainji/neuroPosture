import { useState, useEffect } from "react";
import { Utensils, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const GENERATE_DELAY_MS = 4000;

const GENERATE_PHASES = [
  "Analyzing your profile and goals...",
  "Building your personalized meal plan...",
  "Optimizing for posture and recovery...",
  "Finalizing recommendations...",
];

const PLAN_1 = {
  title: "Balanced support for posture & recovery",
  intro:
    "Anti-inflammatory foods and nutrients that support joint flexibility and muscle recovery.",
  days: [
    {
      day: "Monday",
      meals: {
        breakfast: "Oatmeal with banana, walnuts, cinnamon. Green tea.",
        lunch: "Grilled chicken salad with leafy greens, olive oil, quinoa.",
        dinner: "Salmon with steamed broccoli and sweet potato. Greek yogurt.",
      },
    },
    {
      day: "Tuesday",
      meals: {
        breakfast: "Greek yogurt with berries and honey. Avocado toast.",
        lunch: "Lentil soup with whole-grain bread. Apple.",
        dinner: "Turkey stir-fry with brown rice and mixed vegetables.",
      },
    },
    {
      day: "Wednesday",
      meals: {
        breakfast: "Smoothie: spinach, banana, almond milk, protein powder.",
        lunch: "Tuna wrap with greens and hummus.",
        dinner: "Baked cod with asparagus and couscous.",
      },
    },
    {
      day: "Thursday",
      meals: {
        breakfast: "Scrambled eggs with spinach and whole-grain toast.",
        lunch: "Chickpea and cucumber salad with olive oil dressing.",
        dinner: "Grilled paneer/tofu with roasted vegetables.",
      },
    },
    {
      day: "Friday",
      meals: {
        breakfast: "Chia pudding with almonds and berries.",
        lunch: "Brown rice bowl with grilled chicken and veggies.",
        dinner: "Vegetable soup with whole-grain bread and yogurt.",
      },
    },
    {
      day: "Saturday",
      meals: {
        breakfast: "Porridge with flaxseeds and banana.",
        lunch: "Rajma (kidney beans) with brown rice and salad.",
        dinner: "Grilled fish with sautéed greens.",
      },
    },
    {
      day: "Sunday",
      meals: {
        breakfast: "Omelet with mushrooms and tomatoes.",
        lunch: "Quinoa salad with mixed vegetables and feta.",
        dinner: "Light chicken soup with whole-grain toast.",
      },
    },
  ],
  tips: [
    "Drink 2–2.5L water daily.",
    "Include omega-3 rich foods for joint health.",
    "Protein in every meal for muscle repair.",
  ],
};
const PLAN_2 = {
  title: "Energy & muscle-friendly plan",
  intro:
    "Focused on sustained energy and nutrients for muscle function and injury prevention.",
  days: [
    {
      day: "Monday",
      meals: {
        breakfast: "Eggs with whole-grain toast and spinach.",
        lunch: "Chickpea bowl with tahini and pita.",
        dinner: "Grilled chicken with roasted vegetables and rice.",
      },
    },
    {
      day: "Tuesday",
      meals: {
        breakfast: "Cottage cheese with pineapple and almonds.",
        lunch: "Turkey avocado sandwich. Carrot sticks.",
        dinner: "Salmon with quinoa and mixed salad.",
      },
    },
    {
      day: "Wednesday",
      meals: {
        breakfast: "Porridge with nuts and berries.",
        lunch: "Bean chili with greens.",
        dinner: "Tofu stir-fry with brown rice.",
      },
    },
    {
      day: "Thursday",
      meals: {
        breakfast: "Smoothie bowl with seeds and fruits.",
        lunch: "Paneer wrap with whole wheat tortilla.",
        dinner: "Lean beef/chicken curry with roti.",
      },
    },
    {
      day: "Friday",
      meals: {
        breakfast: "Boiled eggs and fruit bowl.",
        lunch: "Quinoa and grilled vegetables.",
        dinner: "Baked fish with sweet potato.",
      },
    },
    {
      day: "Saturday",
      meals: {
        breakfast: "Oats with peanut butter and banana.",
        lunch: "Dal with brown rice and salad.",
        dinner: "Chicken soup with whole-grain toast.",
      },
    },
    {
      day: "Sunday",
      meals: {
        breakfast: "Greek yogurt parfait.",
        lunch: "Vegetable pulao with raita.",
        dinner: "Grilled tofu/paneer with sautéed vegetables.",
      },
    },
  ],
  tips: [
    "Eat every 3-4 hours.",
    "Include magnesium-rich foods.",
    "Reduce processed foods.",
  ],
};
const PLAN_3 = {
  title: "Vegetarian joint & recovery plan",
  intro:
    "Plant-based plan focused on reducing inflammation and supporting posture.",
  days: [
    {
      day: "Monday",
      meals: {
        breakfast: "Oats with almond milk and flaxseeds.",
        lunch: "Rajma with brown rice.",
        dinner: "Tofu stir-fry with vegetables.",
      },
    },
    {
      day: "Tuesday",
      meals: {
        breakfast: "Smoothie: banana, peanut butter, soy milk.",
        lunch: "Chickpea salad bowl.",
        dinner: "Vegetable khichdi with yogurt.",
      },
    },
    {
      day: "Wednesday",
      meals: {
        breakfast: "Whole-grain toast with avocado.",
        lunch: "Lentil soup and salad.",
        dinner: "Paneer with sautéed greens.",
      },
    },
    {
      day: "Thursday",
      meals: {
        breakfast: "Chia pudding with berries.",
        lunch: "Tofu wrap.",
        dinner: "Mixed vegetable curry with roti.",
      },
    },
    {
      day: "Friday",
      meals: {
        breakfast: "Greek yogurt with nuts.",
        lunch: "Quinoa bowl with beans.",
        dinner: "Palak paneer with brown rice.",
      },
    },
    {
      day: "Saturday",
      meals: {
        breakfast: "Porridge with seeds.",
        lunch: "Vegetable pulao.",
        dinner: "Dal and roti.",
      },
    },
    {
      day: "Sunday",
      meals: {
        breakfast: "Fruit smoothie.",
        lunch: "Chole with salad.",
        dinner: "Light vegetable soup.",
      },
    },
  ],
  tips: [
    "Add flaxseed for omega-3.",
    "Combine protein sources (dal + rice).",
    "Stay hydrated.",
  ],
};
const PLAN_4 = {
  title: "High-protein injury prevention plan",
  intro:
    "Higher protein intake to support muscle repair and reduce injury risk.",
  days: [
    {
      day: "Monday",
      meals: {
        breakfast: "Protein smoothie with whey and banana.",
        lunch: "Grilled chicken with quinoa.",
        dinner: "Salmon with broccoli.",
      },
    },
    {
      day: "Tuesday",
      meals: {
        breakfast: "Egg omelet with vegetables.",
        lunch: "Turkey sandwich with whole grain.",
        dinner: "Lean beef with brown rice.",
      },
    },
    {
      day: "Wednesday",
      meals: {
        breakfast: "Greek yogurt with nuts.",
        lunch: "Paneer bowl with vegetables.",
        dinner: "Grilled fish with salad.",
      },
    },
    {
      day: "Thursday",
      meals: {
        breakfast: "Oats with protein powder.",
        lunch: "Chicken salad with olive oil.",
        dinner: "Tofu stir fry.",
      },
    },
    {
      day: "Friday",
      meals: {
        breakfast: "Boiled eggs and fruit.",
        lunch: "Dal with rice.",
        dinner: "Chicken curry with roti.",
      },
    },
    {
      day: "Saturday",
      meals: {
        breakfast: "Cottage cheese with almonds.",
        lunch: "Grilled paneer wrap.",
        dinner: "Fish with sweet potato.",
      },
    },
    {
      day: "Sunday",
      meals: {
        breakfast: "Protein pancakes.",
        lunch: "Vegetable quinoa bowl.",
        dinner: "Light chicken soup.",
      },
    },
  ],
  tips: [
    "Aim for protein in every meal.",
    "Post-workout protein within 45 minutes.",
    "Include stretching with nutrition plan.",
  ],
};

const SAMPLE_PLANS = [PLAN_1, PLAN_2, PLAN_3, PLAN_4];

export default function DietPlan() {
  //const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<(typeof SAMPLE_PLANS)[0] | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const startGenerating = () => {
    setPlan(null);
    setGenerating(true);
    setProgress(0);
  };

  useEffect(() => {
    if (!generating) return;
    setPhase(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / GENERATE_DELAY_MS) * 100));
      const step = Math.floor(
        (elapsed / GENERATE_DELAY_MS) * GENERATE_PHASES.length,
      );
      setPhase(Math.min(step, GENERATE_PHASES.length - 1));
    }, 200);
    const t = setTimeout(() => {
      clearInterval(interval);
      setGenerating(false);
      setProgress(100);

      // RANDOM PLAN SELECTION
      const idx = Math.floor(Math.random() * SAMPLE_PLANS.length);
      setPlan(SAMPLE_PLANS[idx]);
    }, GENERATE_DELAY_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [generating]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Diet Plan</h1>
        <p className="text-slate-400 mt-1">
          Personalized nutrition to support posture and injury prevention
        </p>
      </div>

      {!plan && !generating && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
          <Utensils className="w-16 h-16 text-neuro-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-6">
            Generate a diet plan tailored to your profile and goals.
          </p>
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
            <p className="text-white font-medium mb-1">
              Generating your personalized diet plan...
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {GENERATE_PHASES[phase]}
            </p>
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
            <h2 className="text-xl font-semibold text-white mb-2">
              {plan.title}
            </h2>
            <p className="text-slate-400">{plan.intro}</p>
          </div>
          {plan.days.map((d) => (
            <div
              key={d.day}
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6"
            >
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
  );
}
