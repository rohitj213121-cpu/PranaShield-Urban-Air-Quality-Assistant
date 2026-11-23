import { useEffect, useState } from 'react';
import { Check, Lightbulb, Loader2, RotateCcw } from 'lucide-react';
import type { CityAirData, CoachTipResponse, Language, RoutineHabit } from '../types/airQuality';
import { DEFAULT_ROUTINE_HABITS } from '../data/cities';
import { UI_COPY } from '../data/translations';
import { fetchCoachTip } from '../utils/geminiService';
import { buildFallbackCoachTip } from '../utils/aiFallbacks';

interface RoutineCoachSectionProps {
  language: Language;
  city: CityAirData;
}

type CategoryFilter = 'all' | RoutineHabit['category'];

const STORAGE_KEY = 'pranashield_habits_v1';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RoutineCoachSection({ language, city }: RoutineCoachSectionProps) {
  const copy = UI_COPY[language].routine;
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return ['wet_mopping', 'clean_indoor_air'];
      const parsed = JSON.parse(raw) as { date?: string; ids?: string[] };
      if (parsed.date === getTodayKey() && Array.isArray(parsed.ids)) {
        return parsed.ids;
      }
      return ['wet_mopping', 'clean_indoor_air'];
    } catch {
      return ['wet_mopping', 'clean_indoor_air'];
    }
  });

  const [aiTip, setAiTip] = useState<CoachTipResponse | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [tipSeed, setTipSeed] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), ids: completedIds }));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedIds]);

  function toggleHabit(id: string) {
    setCompletedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function resetHabits() {
    setCompletedIds([]);
  }

  async function handleGenerateTip() {
    setIsTipLoading(true);
    try {
      const data = await fetchCoachTip({
        city: city.name.en,
        aqi: city.aqi,
        completedCount: completedIds.length,
        totalCount: DEFAULT_ROUTINE_HABITS.length,
        language,
      });
      setAiTip(data);
    } catch {
      setAiTip(buildFallbackCoachTip(city, language, tipSeed));
      setTipSeed((s) => s + 1);
    } finally {
      setIsTipLoading(false);
    }
  }

  const visibleHabits =
    filter === 'all' ? DEFAULT_ROUTINE_HABITS : DEFAULT_ROUTINE_HABITS.filter((h) => h.category === filter);

  const progressPct = Math.round((completedIds.length / DEFAULT_ROUTINE_HABITS.length) * 100);

  return (
    <section id="routine-coach" aria-labelledby="routine-heading" className="scroll-mt-20 flex flex-col h-full">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex-1 flex flex-col justify-between gap-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 id="routine-heading" className="font-display text-xl font-bold text-slate-900">
                {copy.sectionTitle}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{copy.sectionSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={resetHabits}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copy.resetBtn}</span>
            </button>
          </div>

          {/* Progress Bar & Filter Controls */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="font-mono-num">
                {completedIds.length} / {DEFAULT_ROUTINE_HABITS.length} {copy.progressLabel}
              </span>
              <span className="font-mono-num font-bold text-emerald-800">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit max-w-full overflow-x-auto">
              {(
                [
                  { id: 'all', label: copy.filterAll },
                  { id: 'mobility', label: copy.filterMobility },
                  { id: 'home', label: copy.filterHome },
                  { id: 'community', label: copy.filterCommunity },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Habit Checklist */}
          <ul className="mt-4 divide-y divide-slate-100">
            {visibleHabits.map((habit) => {
              const checked = completedIds.includes(habit.id);
              return (
                <li key={habit.id} className="py-3 first:pt-1 last:pb-1">
                  <button
                    type="button"
                    data-demo={`habit-${habit.id}`}
                    onClick={() => toggleHabit(habit.id)}
                    aria-pressed={checked}
                    className="w-full flex items-start gap-3 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md p-1 -m-1"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'bg-white border-slate-300 group-hover:border-emerald-600'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm font-medium leading-snug ${
                          checked ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {habit.title[language]}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">{habit.impact[language]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI Tip Generator */}
        <div className="border border-slate-200 rounded-xl p-4 bg-[#F7FAF8] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{copy.tipGeneratorTitle}</span>
            </div>
            <button
              type="button"
              data-demo="generate-tip-btn"
              onClick={handleGenerateTip}
              disabled={isTipLoading}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {isTipLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>{copy.generatingTipBtn}</span>
                </>
              ) : (
                <span>{copy.generateTipBtn}</span>
              )}
            </button>
          </div>

          {aiTip ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-emerald-900">{aiTip.title}</div>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-semibold shrink-0">
                  ✨ PranaShield AI
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{aiTip.actionStep}</p>
              <div className="text-xs text-slate-600 leading-relaxed">{aiTip.whyItHelps}</div>
              <div className="pt-1 text-xs font-semibold text-emerald-800">
                {copy.impactLabel}: {aiTip.estimatedImpact}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">{copy.tipPlaceholder}</p>
          )}
        </div>
      </div>
    </section>
  );
}
