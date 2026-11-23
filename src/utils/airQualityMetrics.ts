import type { VerdictLevel } from '../types/airQuality';

export const ALLOWED_VERDICTS: readonly VerdictLevel[] = ['GO', 'CAUTION', 'LIMIT', 'AVOID'];

/**
 * Maps an AQI score to the 4-tier CPCB safety verdict scale:
 * 0–100: GO | 101–200: CAUTION | 201–300: LIMIT | 301+: AVOID
 */
export function computeAqiVerdict(aqi: number): VerdictLevel {
  const safeAqi = Number.isFinite(aqi) ? Math.max(0, aqi) : 0;
  if (safeAqi > 300) return 'AVOID';
  if (safeAqi > 200) return 'LIMIT';
  if (safeAqi > 100) return 'CAUTION';
  return 'GO';
}

export function normalizeVerdict(verdict: string | undefined, aqi: number): VerdictLevel {
  if (verdict && ALLOWED_VERDICTS.includes(verdict as VerdictLevel)) {
    return verdict as VerdictLevel;
  }
  return computeAqiVerdict(aqi);
}

export type LungSeverityLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface LungImpactMetrics {
  cigarettesPerDay: number;
  wholeCigs: number;
  hasPartial: boolean;
  recoveryHours: number;
  weeklyCigs: number;
  whoMultiple: string;
  severityLevel: LungSeverityLevel;
  meterPct: number;
}

/**
 * Berkeley Earth equivalence: ~1 cigarette equals 22 µg/m³ of PM2.5 breathed for 24 hours.
 * WHO 24-hour PM2.5 guideline limit: 15 µg/m³.
 */
export function computeLungImpactMetrics(pm25: number): LungImpactMetrics {
  const safePm25 = Number.isFinite(pm25) ? Math.max(0, pm25) : 0;
  const cigarettesPerDay = Number((safePm25 / 22).toFixed(1));
  const wholeCigs = Math.floor(cigarettesPerDay);
  const hasPartial = cigarettesPerDay - wholeCigs >= 0.25;
  const recoveryHours = Math.min(72, Math.max(2, Math.round(cigarettesPerDay * 2.2)));
  const weeklyCigs = Math.round(cigarettesPerDay * 7);
  const whoMultiple = (safePm25 / 15).toFixed(1);

  const severityLevel: LungSeverityLevel =
    cigarettesPerDay >= 8
      ? 'severe'
      : cigarettesPerDay >= 4.5
      ? 'high'
      : cigarettesPerDay >= 2
      ? 'moderate'
      : 'low';

  const meterPct = Math.min(100, Math.round((cigarettesPerDay / 14) * 100));

  return {
    cigarettesPerDay,
    wholeCigs,
    hasPartial,
    recoveryHours,
    weeklyCigs,
    whoMultiple,
    severityLevel,
    meterPct,
  };
}
