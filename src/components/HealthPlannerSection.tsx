import { useEffect, useState, useCallback, useRef } from 'react';
import { User, Users, HeartPulse, Footprints, Train, Trophy, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import type { CityAirData, Language, OutdoorActivityId, PlannerAdvice, UserProfileId } from '../types/airQuality';
import { UI_COPY } from '../data/translations';
import { fetchHealthPlanner } from '../utils/geminiService';
import { buildFallbackPlannerAdvice } from '../utils/aiFallbacks';

interface HealthPlannerSectionProps {
  language: Language;
  city: CityAirData;
  apiKeyVersion: number;
}

const PROFILES: { id: UserProfileId; icon: typeof User }[] = [
  { id: 'healthy_adult', icon: User },
  { id: 'child_elderly', icon: Users },
  { id: 'respiratory', icon: HeartPulse },
];

const ACTIVITIES: { id: OutdoorActivityId; icon: typeof Footprints }[] = [
  { id: 'morning_walk', icon: Footprints },
  { id: 'commute', icon: Train },
  { id: 'outdoor_sports', icon: Trophy },
];

export function HealthPlannerSection({ language, city, apiKeyVersion }: HealthPlannerSectionProps) {
  const copy = UI_COPY[language].planner;
  const [profile, setProfile] = useState<UserProfileId>('child_elderly');
  const [activity, setActivity] = useState<OutdoorActivityId>('morning_walk');
  const [advice, setAdvice] = useState<PlannerAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlan = useCallback(
    async (targetProfile: UserProfileId, targetActivity: OutdoorActivityId, targetCity: CityAirData, targetLang: Language) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const profileLabel = UI_COPY[targetLang].planner.profiles[targetProfile].label;
        const activityLabel = UI_COPY[targetLang].planner.activities[targetActivity].label;

        const data = await fetchHealthPlanner(
          {
            city: targetCity.name.en,
            aqi: targetCity.aqi,
            pm25: targetCity.pm25,
            pm10: targetCity.pm10,
            verdict: targetCity.verdict,
            bestWindow: targetCity.bestWindow,
            profile: profileLabel,
            activity: activityLabel,
            language: targetLang,
          },
          controller.signal
        );
        setAdvice(data);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setAdvice(buildFallbackPlannerAdvice(targetCity, targetProfile, targetActivity, targetLang));
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchPlan(profile, activity, city, language);
    return () => abortRef.current?.abort();
  }, [profile, activity, city.id, language, apiKeyVersion, fetchPlan]);

  return (
    <section id="health-planner" aria-labelledby="planner-heading" className="scroll-mt-20">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7">
        <div className="pb-5 border-b border-slate-100">
          <h2 id="planner-heading" className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            {copy.sectionTitle}
          </h2>
          <p className="text-sm text-slate-600 mt-1">{copy.sectionSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch">
          {/* Left Controls: Profile & Activity */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2.5">{copy.profileLabel}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                  {PROFILES.map(({ id, icon: Icon }) => {
                    const active = profile === id;
                    const pCopy = copy.profiles[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        data-demo={`profile-${id}`}
                        onClick={() => setProfile(id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors min-h-[48px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                          active
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-700' : 'text-slate-500'}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-tight">{pCopy.label}</div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{pCopy.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2.5">{copy.activityLabel}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                  {ACTIVITIES.map(({ id, icon: Icon }) => {
                    const active = activity === id;
                    const aCopy = copy.activities[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        data-demo={`activity-${id}`}
                        onClick={() => setActivity(id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors min-h-[48px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                          active
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-700' : 'text-slate-500'}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-tight">{aCopy.label}</div>
                          <div className="text-xs text-slate-500 truncate mt-0.5">{aCopy.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-demo="generate-plan-btn"
              onClick={() => fetchPlan(profile, activity, city, language)}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{copy.generatingBtn}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{copy.generateBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Output: AI Recommendation */}
          <div className="lg:col-span-7 border border-slate-200 rounded-xl p-5 bg-[#F9FBF9] flex flex-col justify-between">
            {isLoading ? (
              <div className="space-y-4 animate-pulse" aria-busy="true" aria-label={copy.generatingBtn}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-20 bg-slate-200/80 rounded-lg" />
                  <div className="h-20 bg-slate-200/80 rounded-lg" />
                </div>
                <div className="h-12 bg-slate-200/70 rounded-lg" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-200/80 rounded w-5/6" />
                  <div className="h-4 bg-slate-200/80 rounded w-4/6" />
                  <div className="h-4 bg-slate-200/80 rounded w-3/4" />
                </div>
                <div className="h-16 bg-slate-200/70 rounded-lg" />
              </div>
            ) : advice ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                    {language === 'hi' ? '✨ AI व्यक्तिगत सुरक्षा योजना तैयार' : '✨ AI Personalized Plan Ready'}
                  </span>
                  <span className="font-mono-num text-xs text-slate-500">
                    {city.name[language]} · AQI {city.aqi}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>{copy.safestWindowTitle}</span>
                    </div>
                    <div className="font-mono-num text-base font-bold text-emerald-900 mt-1.5">
                      {advice.safestWindow}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                    <div className="text-xs font-medium text-slate-500">{copy.riskTitle}</div>
                    <div className="text-base font-bold text-slate-900 mt-1.5">{advice.riskRating}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{advice.maskGuidance}</div>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{advice.headline}</p>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2.5">{copy.precautionsTitle}</h3>
                  <ol className="space-y-2 divide-y divide-slate-200/70">
                    {advice.precautions.map((item, idx) => (
                      <li key={idx} className="pt-2 first:pt-0 text-sm text-slate-700 flex items-start gap-2.5">
                        <span className="font-mono-num text-xs font-bold text-emerald-800 mt-0.5 shrink-0">
                          0{idx + 1}.
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <div className="text-xs font-semibold text-emerald-800">{copy.indoorAltTitle}</div>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{advice.indoorAlternative}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{copy.emptyHint}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
