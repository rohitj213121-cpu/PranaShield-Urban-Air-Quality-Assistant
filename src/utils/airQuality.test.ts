import { describe, expect, it } from 'vitest';
import { INDIAN_CITIES_DATA } from '../data/cities';
import {
  computeAqiVerdict,
  computeLungImpactMetrics,
  normalizeVerdict,
} from './airQualityMetrics';
import {
  buildFallbackCoachTip,
  buildFallbackIndoorReply,
  buildFallbackPlannerAdvice,
  buildFallbackSafeHavens,
} from './aiFallbacks';

describe('AQI Verdict Calculations', () => {
  it('maps AQI ranges to CPCB safety verdicts accurately', () => {
    expect(computeAqiVerdict(0)).toBe('GO');
    expect(computeAqiVerdict(74)).toBe('GO');
    expect(computeAqiVerdict(100)).toBe('GO');

    expect(computeAqiVerdict(101)).toBe('CAUTION');
    expect(computeAqiVerdict(138)).toBe('CAUTION');
    expect(computeAqiVerdict(200)).toBe('CAUTION');

    expect(computeAqiVerdict(201)).toBe('LIMIT');
    expect(computeAqiVerdict(288)).toBe('LIMIT');
    expect(computeAqiVerdict(300)).toBe('LIMIT');

    expect(computeAqiVerdict(301)).toBe('AVOID');
    expect(computeAqiVerdict(386)).toBe('AVOID');
    expect(computeAqiVerdict(500)).toBe('AVOID');
  });

  it('clamps negative or non-finite AQI values safely to GO', () => {
    expect(computeAqiVerdict(-20)).toBe('GO');
    expect(computeAqiVerdict(Number.NaN)).toBe('GO');
  });

  it('normalizes AI-provided verdicts and falls back to AQI thresholds for invalid labels', () => {
    expect(normalizeVerdict('LIMIT', 120)).toBe('LIMIT');
    expect(normalizeVerdict('UNKNOWN', 350)).toBe('AVOID');
    expect(normalizeVerdict(undefined, 150)).toBe('CAUTION');
  });

  it('ensures every preset city verdict matches its numeric AQI tier', () => {
    for (const city of INDIAN_CITIES_DATA) {
      expect(city.verdict).toBe(computeAqiVerdict(city.aqi));
      expect(city.name.en.length).toBeGreaterThan(0);
      expect(city.name.hi.length).toBeGreaterThan(0);
      expect(city.hourlyTrend).toHaveLength(6);
    }
  });
});

describe('Smog-to-Cigarette Equivalent Formulas', () => {
  it('calculates Berkeley Earth 24h cigarette equivalence (~1 per 22 µg/m³ PM2.5)', () => {
    const sample245 = computeLungImpactMetrics(245);
    expect(sample245.cigarettesPerDay).toBe(11.1);
    expect(sample245.wholeCigs).toBe(11);
    expect(sample245.severityLevel).toBe('severe');

    // Delhi preset: PM2.5 234 -> 10.6 cigarettes/day
    const delhi = INDIAN_CITIES_DATA.find((c) => c.id === 'delhi')!;
    const delhiMetrics = computeLungImpactMetrics(delhi.pm25);
    expect(delhiMetrics.cigarettesPerDay).toBe(10.6);
    expect(delhiMetrics.wholeCigs).toBe(10);
    expect(delhiMetrics.hasPartial).toBe(true);
    expect(delhiMetrics.recoveryHours).toBe(23);
    expect(delhiMetrics.weeklyCigs).toBe(74);
    expect(delhiMetrics.whoMultiple).toBe('15.6');
    expect(delhiMetrics.severityLevel).toBe('severe');
  });

  it('classifies moderate, high, and low PM2.5 burdens accurately', () => {
    // Gurugram PM2.5 148 -> 6.7 cigs/day (high)
    const gurugram = computeLungImpactMetrics(148);
    expect(gurugram.cigarettesPerDay).toBe(6.7);
    expect(gurugram.severityLevel).toBe('high');

    // Mumbai PM2.5 56 -> 2.5 cigs/day (moderate)
    const mumbai = computeLungImpactMetrics(56);
    expect(mumbai.cigarettesPerDay).toBe(2.5);
    expect(mumbai.recoveryHours).toBe(6);
    expect(mumbai.severityLevel).toBe('moderate');

    // Bengaluru PM2.5 23 -> 1.0 cigs/day (low)
    const bengaluru = computeLungImpactMetrics(23);
    expect(bengaluru.cigarettesPerDay).toBe(1.0);
    expect(bengaluru.recoveryHours).toBe(2);
    expect(bengaluru.severityLevel).toBe('low');
  });

  it('handles zero and negative PM2.5 inputs gracefully', () => {
    const zero = computeLungImpactMetrics(0);
    expect(zero.cigarettesPerDay).toBe(0);
    expect(zero.recoveryHours).toBe(2);
    expect(zero.severityLevel).toBe('low');

    const negative = computeLungImpactMetrics(-10);
    expect(negative.cigarettesPerDay).toBe(0);
    expect(negative.whoMultiple).toBe('0.0');
  });
});

describe('Bilingual AI Guidance & Clean-Air Safe Havens Fallbacks', () => {
  const delhi = INDIAN_CITIES_DATA.find((c) => c.id === 'delhi')!;

  it('returns 3 Delhi clean-air micro-zones with lower estimated AQI in English and Hindi', () => {
    const enHavens = buildFallbackSafeHavens(delhi, 'en');
    expect(enHavens.zones).toHaveLength(3);
    expect(enHavens.zones.map((z) => z.name)).toContain('Sanjay Van Urban Forest');
    expect(enHavens.zones.map((z) => z.name)).toContain('Lodhi Garden Botanical Canopy');
    for (const zone of enHavens.zones) {
      expect(zone.pm25ReductionPct).toBeGreaterThan(0);
      expect(zone.estimatedAqi).toBeLessThan(delhi.aqi);
    }

    const hiHavens = buildFallbackSafeHavens(delhi, 'hi');
    expect(hiHavens.zones).toHaveLength(3);
    expect(hiHavens.zones[0].name).toContain('संजय वन');
    expect(hiHavens.citySummary).toContain('दिल्ली');
  });

  it('generates context-aware bilingual planner, coach, and indoor chat outputs', () => {
    const enPlan = buildFallbackPlannerAdvice(delhi, 'respiratory', 'morning_walk', 'en');
    const hiPlan = buildFallbackPlannerAdvice(delhi, 'respiratory', 'morning_walk', 'hi');
    expect(enPlan.riskRating).toBe('Severe Respiratory Risk');
    expect(hiPlan.riskRating).toBe('गंभीर श्वसन जोखिम');

    const hiTip = buildFallbackCoachTip(delhi, 'hi', 0);
    expect(hiTip.title.length).toBeGreaterThan(0);

    const enPlantReply = buildFallbackIndoorReply('Best plants for bedroom?', delhi, 'en');
    expect(enPlantReply).toContain('Snake Plant');
  });
});
