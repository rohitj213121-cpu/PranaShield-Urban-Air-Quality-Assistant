import { useState, useEffect, useCallback, useRef } from 'react';
import { Trees, Leaf, Building2, MapPin, Navigation, Clock, Loader2, Compass } from 'lucide-react';
import type { CityAirData, Language, SafeHavensResponse, SafeHavenType } from '../types/airQuality';
import { UI_COPY } from '../data/translations';
import { fetchSafeHavens } from '../utils/geminiService';
import { buildFallbackSafeHavens } from '../utils/aiFallbacks';

interface SafeHavenAdvisorProps {
  language: Language;
  city: CityAirData;
  apiKeyVersion: number;
}

function ZoneIcon({ type }: { type: SafeHavenType }) {
  switch (type) {
    case 'forest':
      return <Trees className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />;
    case 'indoor_hepa':
      return <Building2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />;
    default:
      return <Leaf className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />;
  }
}

export function SafeHavenAdvisor({ language, city, apiKeyVersion }: SafeHavenAdvisorProps) {
  const copy = UI_COPY[language].safeHavens;
  const [hasRequested, setHasRequested] = useState(false);
  const [data, setData] = useState<SafeHavensResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadZones = useCallback(
    async (targetCity: CityAirData, targetLang: Language) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setHasRequested(true);
      setIsLoading(true);

      try {
        const res = await fetchSafeHavens(
          {
            city: targetCity.name.en,
            aqi: targetCity.aqi,
            pm25: targetCity.pm25,
            bestWindow: targetCity.bestWindow,
            language: targetLang,
          },
          controller.signal
        );
        setData(res);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setData(buildFallbackSafeHavens(targetCity, targetLang));
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // If user already triggered Safe Havens once and switches city or language, keep recommendations synced
  useEffect(() => {
    if (hasRequested) {
      loadZones(city, language);
    }
    return () => abortRef.current?.abort();
  }, [hasRequested, city.id, language, apiKeyVersion, loadZones, city]);

  return (
    <section id="safe-haven-advisor" aria-labelledby="safe-haven-heading" className="flex flex-col h-full">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 id="safe-haven-heading" className="font-display text-lg sm:text-xl font-bold text-slate-900">
                {copy.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{copy.sectionSubtitle}</p>
            </div>
            <button
              type="button"
              data-demo="find-safe-havens-btn"
              onClick={() => loadZones(city, language)}
              disabled={isLoading}
              className="self-start px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 min-h-[38px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>{copy.searchingBtn}</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{hasRequested ? copy.refreshBtn : copy.findBtn}</span>
                </>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse" aria-busy="true" aria-label={copy.searchingBtn}>
              <div className="h-5 bg-slate-200/70 rounded w-3/4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="h-44 bg-slate-100 rounded-xl border border-slate-200" />
                <div className="h-44 bg-slate-100 rounded-xl border border-slate-200" />
                <div className="h-44 bg-slate-100 rounded-xl border border-slate-200" />
              </div>
            </div>
          ) : data ? (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold">
                  {copy.aiBadge}
                </span>
                <span className="text-xs text-slate-600">{data.citySummary}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.zones.map((zone) => (
                  <article
                    key={zone.name}
                    className="border border-slate-200 rounded-xl p-4 bg-[#F9FBF9] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <ZoneIcon type={zone.zoneType} />
                          <span>{zone.typeLabel}</span>
                        </span>
                        <span className="font-mono-num text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 whitespace-nowrap shrink-0">
                          -{zone.pm25ReductionPct}% PM2.5
                        </span>
                      </div>

                      <h3 className="font-display text-sm font-bold text-slate-900 leading-snug">{zone.name}</h3>

                      <div className="flex items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2">
                        <span className="text-slate-500">{copy.estAqiLabel}</span>
                        <span className="font-mono-num font-bold text-emerald-800">~{zone.estimatedAqi}</span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                        <span className="font-mono-num font-medium text-slate-800">{zone.bestWindow}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{zone.microRouteTip}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-emerald-300/90 bg-[#F7FAF8] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>
                    {copy.promptTitle} ({city.name[language]})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{copy.promptDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => loadZones(city, language)}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {copy.findBtn}
              </button>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
          <span>{city.name[language]} · AQI {city.aqi}</span>
          <span className="font-mono-num">{city.bestWindow}</span>
        </div>
      </div>
    </section>
  );
}
