export type Language = 'en' | 'hi';

export type VerdictLevel = 'GO' | 'CAUTION' | 'LIMIT' | 'AVOID';

export type UserProfileId = 'healthy_adult' | 'child_elderly' | 'respiratory';

export type OutdoorActivityId = 'morning_walk' | 'commute' | 'outdoor_sports';

export interface HourlyAqiPoint {
  hour: string;
  pm25: number;
  aqi: number;
}

export interface CityAirData {
  id: string;
  name: {
    en: string;
    hi: string;
  };
  region: {
    en: string;
    hi: string;
  };
  station: {
    en: string;
    hi: string;
  };
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  tempC: number;
  humidityPct: number;
  windKmh: number;
  verdict: VerdictLevel;
  categoryLabel: {
    en: string;
    hi: string;
  };
  maskRequired: {
    en: string;
    hi: string;
  };
  summary: {
    en: string;
    hi: string;
  };
  bestWindow: string;
  hourlyTrend: HourlyAqiPoint[];
  isCustomAiLookup?: boolean;
}

export interface PlannerAdvice {
  safestWindow: string;
  riskRating: string;
  headline: string;
  maskGuidance: string;
  precautions: string[];
  indoorAlternative: string;
}

export interface RoutineHabit {
  id: string;
  category: 'mobility' | 'home' | 'community';
  title: {
    en: string;
    hi: string;
  };
  impact: {
    en: string;
    hi: string;
  };
}

export interface CoachTipResponse {
  title: string;
  actionStep: string;
  whyItHelps: string;
  estimatedImpact: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export type SafeHavenType = 'forest' | 'park' | 'indoor_hepa';

export interface SafeHavenZone {
  name: string;
  zoneType: SafeHavenType;
  typeLabel: string;
  pm25ReductionPct: number;
  estimatedAqi: number;
  bestWindow: string;
  microRouteTip: string;
}

export interface SafeHavensResponse {
  citySummary: string;
  zones: SafeHavenZone[];
}

