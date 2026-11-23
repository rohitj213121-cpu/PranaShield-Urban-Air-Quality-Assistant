import { Cigarette, HeartPulse, Wind, ShieldCheck } from 'lucide-react';
import type { CityAirData, Language } from '../types/airQuality';
import { UI_COPY } from '../data/translations';

interface SmogCigaretteMeterProps {
  language: Language;
  city: CityAirData;
}

const MAX_ICONS = 12;

export function SmogCigaretteMeter({ language, city }: SmogCigaretteMeterProps) {
  const copy = UI_COPY[language].lungMeter;

  // Berkeley Earth equivalence: ~1 cigarette per 22 µg/m³ of PM2.5 breathed over 24 hours
  const cigarettesPerDay = Number((city.pm25 / 22).toFixed(1));
  const wholeCigs = Math.floor(cigarettesPerDay);
  const hasPartial = cigarettesPerDay - wholeCigs >= 0.25;
  const activeSlotCount = Math.min(MAX_ICONS, wholeCigs + (hasPartial ? 1 : 0));
  const overflowCount = Math.max(0, Math.round(cigarettesPerDay) - MAX_ICONS);

  const recoveryHours = Math.min(72, Math.max(2, Math.round(cigarettesPerDay * 2.2)));
  const weeklyCigs = Math.round(cigarettesPerDay * 7);
  const whoMultiple = (city.pm25 / 15).toFixed(1);

  const severity =
    cigarettesPerDay >= 8
      ? {
          label: copy.severitySevere,
          accentText: 'text-red-700',
          accentBg: 'bg-red-50 border-red-200 text-red-900',
          barBg: 'bg-red-600',
          iconActive: 'bg-red-50 border-red-200 text-red-600',
          iconPartial: 'bg-red-50/60 border-red-200/80 text-red-400',
        }
      : cigarettesPerDay >= 4.5
      ? {
          label: copy.severityHigh,
          accentText: 'text-orange-700',
          accentBg: 'bg-orange-50 border-orange-200 text-orange-900',
          barBg: 'bg-orange-500',
          iconActive: 'bg-orange-50 border-orange-200 text-orange-600',
          iconPartial: 'bg-orange-50/60 border-orange-200/80 text-orange-400',
        }
      : cigarettesPerDay >= 2
      ? {
          label: copy.severityModerate,
          accentText: 'text-amber-700',
          accentBg: 'bg-amber-50 border-amber-200 text-amber-900',
          barBg: 'bg-amber-500',
          iconActive: 'bg-amber-50 border-amber-200 text-amber-600',
          iconPartial: 'bg-amber-50/60 border-amber-200/80 text-amber-400',
        }
      : {
          label: copy.severityLow,
          accentText: 'text-emerald-700',
          accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          barBg: 'bg-emerald-600',
          iconActive: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          iconPartial: 'bg-emerald-50/60 border-emerald-200/80 text-emerald-500',
        };

  const meterPct = Math.min(100, Math.round((cigarettesPerDay / 14) * 100));

  return (
    <section id="lung-impact-meter" aria-labelledby="lung-meter-heading" className="flex flex-col h-full">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 id="lung-meter-heading" className="font-display text-lg sm:text-xl font-bold text-slate-900">
                {copy.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{copy.sectionSubtitle}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap shrink-0 ${severity.accentBg}`}>
              {severity.label}
            </span>
          </div>

          {/* Primary Cigarette Equivalence Readout */}
          <div className="bg-[#F9FBF9] border border-slate-200 rounded-xl p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className={`font-mono-num text-4xl sm:text-5xl font-extrabold tracking-tight leading-none ${severity.accentText}`}>
                  {cigarettesPerDay}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {copy.cigarettesUnit} <span className="text-slate-500 font-medium">{copy.perDaySuffix}</span>
                </span>
              </div>
              <div className="font-mono-num text-xs text-slate-500">
                {city.name[language]} · PM2.5 {city.pm25} µg/m³
              </div>
            </div>

            {/* Lung Impact Progress Meter */}
            <div className="mt-3.5 w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${severity.barBg}`}
                style={{ width: `${meterPct}%` }}
              />
            </div>

            {/* Visual Cigarette Icon Strip */}
            <div className="mt-4">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">{copy.visualLabel}</div>
              <div className="flex flex-wrap items-center gap-1.5" aria-label={`${cigarettesPerDay} ${copy.cigarettesUnit}`}>
                {Array.from({ length: MAX_ICONS }).map((_, idx) => {
                  const isFull = idx < wholeCigs;
                  const isHalf = !isFull && idx < activeSlotCount;
                  return (
                    <span
                      key={idx}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
                        isFull
                          ? severity.iconActive
                          : isHalf
                          ? severity.iconPartial
                          : 'bg-slate-50 border-slate-200/80 text-slate-300'
                      }`}
                    >
                      <Cigarette className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  );
                })}
                {overflowCount > 0 && (
                  <span className="font-mono-num text-xs font-bold text-red-700 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                    +{overflowCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lung Recovery & Cumulative Burden Metrics */}
          <div className="grid grid-cols-3 border border-slate-200 rounded-xl divide-x divide-slate-200 bg-slate-50/60">
            <div className="p-3">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span className="truncate">{copy.recoveryLabel}</span>
              </div>
              <div className="font-mono-num text-base sm:text-lg font-bold text-slate-900 mt-1">
                ~{recoveryHours} <span className="text-[11px] font-medium text-slate-500">{copy.recoveryUnit}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Cigarette className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="truncate">{copy.weeklyLabel}</span>
              </div>
              <div className="font-mono-num text-base sm:text-lg font-bold text-slate-900 mt-1">
                {weeklyCigs} <span className="text-[11px] font-medium text-slate-500">{copy.cigarettesUnit}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="truncate">{copy.whoMultipleLabel}</span>
              </div>
              <div className={`font-mono-num text-base sm:text-lg font-bold mt-1 ${severity.accentText}`}>
                {whoMultiple}x
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5 pt-1 border-t border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{copy.formulaNote}</span>
        </p>
      </div>
    </section>
  );
}
