import type {
  ChatMessage,
  CityAirData,
  CoachTipResponse,
  Language,
  PlannerAdvice,
  SafeHavensResponse,
} from '../types/airQuality';
import { postJsonSafe } from './aiClient';
import { normalizeVerdict } from './airQualityMetrics';

const STORAGE_KEY = 'pranashield_gemini_api_key';
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function cleanApiKey(raw: string): string {
  return raw.replace(/\s+/g, '').trim();
}

export function getSavedBrowserApiKey(): string {
  try {
    return cleanApiKey(localStorage.getItem(STORAGE_KEY) || '');
  } catch {
    return '';
  }
}

export function saveBrowserApiKey(key: string): void {
  try {
    const cleaned = cleanApiKey(key);
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function getEffectiveClientApiKey(): string | null {
  const saved = getSavedBrowserApiKey();
  if (saved) return saved;

  const viteEnvKey = cleanApiKey((import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '');
  if (viteEnvKey && viteEnvKey !== 'MY_GEMINI_API_KEY') {
    return viteEnvKey;
  }

  return null;
}

function stripMarkdownJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Fallback extraction if extra prose surrounds the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    throw new Error(`Failed to parse Gemini JSON response: ${msg}`);
  }
}

async function callGeminiDirect(params: {
  apiKey: string;
  prompt: string;
  systemInstruction?: string;
  expectJson?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<string> {
  const cleanedKey = cleanApiKey(params.apiKey);
  if (!cleanedKey) {
    throw new Error('API key is empty after trimming whitespace.');
  }

  const timeoutMs = params.timeoutMs ?? 15000;
  const controller = new AbortController();

  const onExternalAbort = () => controller.abort();
  if (params.signal) {
    if (params.signal.aborted) {
      controller.abort();
    } else {
      params.signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(cleanedKey)}`;
    const bodyPayload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: params.prompt }],
        },
      ],
    };

    if (params.systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: params.systemInstruction }],
      };
    }

    if (params.expectJson) {
      bodyPayload.generationConfig = {
        responseMimeType: 'application/json',
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(bodyPayload),
    });

    const rawBody = await res.text();
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
    } catch {
      parsedBody = null;
    }

    if (!res.ok) {
      const apiErrObj = parsedBody?.error as { message?: string; status?: string; code?: number } | undefined;
      const errMsg =
        apiErrObj?.message ||
        (typeof parsedBody?.message === 'string' ? parsedBody.message : '') ||
        rawBody.slice(0, 220) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`Gemini API (${res.status}): ${errMsg}`);
    }

    const candidates = parsedBody?.candidates as
      | Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>
      | undefined;

    const firstCandidate = candidates?.[0];
    const parts = firstCandidate?.content?.parts;
    const combinedText = Array.isArray(parts)
      ? parts
          .map((p) => p.text || '')
          .join('')
          .trim()
      : '';

    if (!combinedText) {
      const reason = firstCandidate?.finishReason || 'Empty response from Gemini';
      throw new Error(`Gemini returned no text (${reason}).`);
    }

    return combinedText;
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      if (params.signal?.aborted) {
        throw err;
      }
      throw new Error('Gemini API request timed out after 15 seconds.');
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timer);
    if (params.signal) {
      params.signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function fetchCityAqi(cityQuery: string): Promise<CityAirData> {
  const clientKey = getEffectiveClientApiKey();
  if (!clientKey) {
    return postJsonSafe<CityAirData>('/api/city-aqi', { cityQuery }, { timeoutMs: 4500 });
  }

  const rawText = await callGeminiDirect({
    apiKey: clientKey,
    expectJson: true,
    prompt: `Provide realistic late-November winter air quality telemetry for the Indian city "${cityQuery}".
Base values on typical seasonal CPCB AQI patterns in India during November winter inversion.
Verdict must strictly follow: 0-100 GO, 101-200 CAUTION, 201-300 LIMIT, 301+ AVOID.
Return ONLY valid JSON with these exact keys:
{
  "nameEn": string,
  "nameHi": string,
  "regionEn": string,
  "regionHi": string,
  "stationEn": string,
  "stationHi": string,
  "aqi": number,
  "pm25": number,
  "pm10": number,
  "no2": number,
  "tempC": number,
  "humidityPct": number,
  "windKmh": number,
  "verdict": "GO" | "CAUTION" | "LIMIT" | "AVOID",
  "categoryEn": string,
  "categoryHi": string,
  "maskEn": string,
  "maskHi": string,
  "summaryEn": string,
  "summaryHi": string,
  "bestWindow": string,
  "hourlyTrend": [{ "hour": "6 AM", "pm25": number, "aqi": number }, ...6 items up to "9 PM"]
}`,
  });

  const parsed = stripMarkdownJson<{
    nameEn: string;
    nameHi: string;
    regionEn: string;
    regionHi: string;
    stationEn: string;
    stationHi: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    tempC: number;
    humidityPct: number;
    windKmh: number;
    verdict: string;
    categoryEn: string;
    categoryHi: string;
    maskEn: string;
    maskHi: string;
    summaryEn: string;
    summaryHi: string;
    bestWindow: string;
    hourlyTrend: Array<{ hour: string; pm25: number; aqi: number }>;
  }>(rawText);

  const normalizedVerdict = normalizeVerdict(parsed.verdict, Number(parsed.aqi));

  return {
    id: cityQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: { en: parsed.nameEn, hi: parsed.nameHi },
    region: { en: parsed.regionEn, hi: parsed.regionHi },
    station: { en: parsed.stationEn, hi: parsed.stationHi },
    aqi: Number(parsed.aqi),
    pm25: Number(parsed.pm25),
    pm10: Number(parsed.pm10),
    no2: Number(parsed.no2),
    tempC: Number(parsed.tempC),
    humidityPct: Number(parsed.humidityPct),
    windKmh: Number(parsed.windKmh),
    verdict: normalizedVerdict,
    categoryLabel: { en: parsed.categoryEn, hi: parsed.categoryHi },
    maskRequired: { en: parsed.maskEn, hi: parsed.maskHi },
    summary: { en: parsed.summaryEn, hi: parsed.summaryHi },
    bestWindow: parsed.bestWindow,
    hourlyTrend: Array.isArray(parsed.hourlyTrend) ? parsed.hourlyTrend.slice(0, 6) : [],
    isCustomAiLookup: true,
  };
}

export async function fetchHealthPlanner(
  params: {
    city: string;
    aqi: number;
    pm25: number;
    pm10: number;
    verdict: string;
    bestWindow: string;
    profile: string;
    activity: string;
    language: Language;
  },
  signal?: AbortSignal
): Promise<PlannerAdvice> {
  const clientKey = getEffectiveClientApiKey();
  if (!clientKey) {
    return postJsonSafe<PlannerAdvice>('/api/planner', params, { signal, timeoutMs: 3500 });
  }

  const langLabel =
    params.language === 'hi' ? 'Hindi (Devanagari script, natural everyday Indian Hindi)' : 'English';

  const rawText = await callGeminiDirect({
    apiKey: clientKey,
    expectJson: true,
    signal,
    systemInstruction:
      'You are PranaShield, an empathetic urban environmental health advisor for Indian families dealing with winter smog. Be concise, practical, and specific to Indian city conditions.',
    prompt: `City: ${params.city} (AQI: ${params.aqi}, PM2.5: ${params.pm25} µg/m³, PM10: ${params.pm10} µg/m³, Verdict: ${params.verdict}, Lowest smog window: ${params.bestWindow}).
User Profile: ${params.profile}.
Planned Activity: ${params.activity}.
Respond entirely in ${langLabel}. Return ONLY a JSON object with these exact keys:
{
  "safestWindow": "exact time window or stay-indoors advice",
  "riskRating": "short 1-3 word risk label",
  "headline": "clear 1-sentence verdict for this profile and activity",
  "maskGuidance": "specific mask type and fit guidance",
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "indoorAlternative": "practical indoor alternative"
}`,
  });

  const parsed = stripMarkdownJson<PlannerAdvice>(rawText);
  if (!parsed.safestWindow || !Array.isArray(parsed.precautions)) {
    throw new Error('Gemini returned an incomplete health plan JSON object.');
  }
  return parsed;
}

export async function fetchCoachTip(params: {
  city: string;
  aqi: number;
  completedCount: number;
  totalCount: number;
  language: Language;
}): Promise<CoachTipResponse> {
  const clientKey = getEffectiveClientApiKey();
  if (!clientKey) {
    return postJsonSafe<CoachTipResponse>('/api/coach-tip', params, { timeoutMs: 3500 });
  }

  const langLabel =
    params.language === 'hi' ? 'Hindi (Devanagari script, natural everyday Indian Hindi)' : 'English';

  const rawText = await callGeminiDirect({
    apiKey: clientKey,
    expectJson: true,
    systemInstruction:
      'You are PranaShield Routine Coach. Give concise, encouraging, actionable eco-tips for Indian families that reduce personal smog exposure and emissions.',
    prompt: `Generate 1 fresh, high-impact low-emission daily habit tip for a household in ${params.city} (current AQI: ${params.aqi}). They have already completed ${params.completedCount} of ${params.totalCount} daily eco-habits. Respond entirely in ${langLabel}.
Return ONLY a JSON object with these exact keys:
{
  "title": "short punchy habit title (max 8 words)",
  "actionStep": "one concrete step for today",
  "whyItHelps": "how it protects health or cuts smog",
  "estimatedImpact": "short measurable benefit"
}`,
  });

  const parsed = stripMarkdownJson<CoachTipResponse>(rawText);
  if (!parsed.title || !parsed.actionStep) {
    throw new Error('Gemini returned an incomplete routine tip JSON object.');
  }
  return parsed;
}

export async function fetchIndoorChat(params: {
  message: string;
  history: ChatMessage[];
  city: string;
  aqi: number;
  pm25: number;
  language: Language;
}): Promise<{ reply: string }> {
  const clientKey = getEffectiveClientApiKey();
  if (!clientKey) {
    return postJsonSafe<{ reply: string }>('/api/chat', params, { timeoutMs: 3500 });
  }

  const langLabel = params.language === 'hi' ? 'Hindi (Devanagari script)' : 'English';
  const priorTurns = params.history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'PranaShield'}: ${m.text}`)
    .join('\n');

  const reply = await callGeminiDirect({
    apiKey: clientKey,
    expectJson: false,
    systemInstruction:
      'You are PranaShield Indoor Air Specialist helping families in Indian cities purify indoor air during smog season. Cover HEPA H13 purifiers, CADR sizing for Indian bedrooms, budget Corsi-Rosenthal DIY fans, safe air-purifying plants (Areca Palm, Snake Plant, Money Plant, Peace Lily), wet mopping, kitchen ventilation, and winter window-opening timings (1 PM–4 PM). Never invent fake product claims.',
    prompt: `Active City Context: ${params.city} (AQI ${params.aqi}, PM2.5 ${params.pm25} µg/m³).
${priorTurns ? `Recent conversation:\n${priorTurns}\n` : ''}User question: ${params.message}
Respond in ${langLabel}. Keep your response clear, scannable (use short bullet points where helpful), and under 160 words.`,
  });

  return { reply };
}

export async function fetchSafeHavens(
  params: {
    city: string;
    aqi: number;
    pm25: number;
    bestWindow: string;
    language: Language;
  },
  signal?: AbortSignal
): Promise<SafeHavensResponse> {
  const clientKey = getEffectiveClientApiKey();
  if (!clientKey) {
    return postJsonSafe<SafeHavensResponse>('/api/safe-havens', params, { signal, timeoutMs: 3500 });
  }

  const langLabel =
    params.language === 'hi' ? 'Hindi (Devanagari script, natural everyday Indian Hindi)' : 'English';

  const rawText = await callGeminiDirect({
    apiKey: clientKey,
    expectJson: true,
    signal,
    systemInstruction:
      'You are PranaShield Micro-Climate Advisor for Indian cities. Suggest authentic local green spaces and HEPA-filtered indoor venues with practical micro-route walking tips away from arterial traffic.',
    prompt: `Recommend 3 real, well-known clean-air micro-zones in ${params.city}, India (current city AQI: ${params.aqi}, PM2.5: ${params.pm25} µg/m³, lowest smog window: ${params.bestWindow}).
Include:
1) A dense urban forest or biodiversity reserve,
2) A major botanical park / green canopy garden,
3) An indoor HEPA-filtered public sanctuary (library, cultural centre, museum, or modern mall atrium).
Respond entirely in ${langLabel}. Return ONLY valid JSON:
{
  "citySummary": "short 1-sentence micro-climate summary",
  "zones": [
    {
      "name": "real place name",
      "zoneType": "forest" | "park" | "indoor_hepa",
      "typeLabel": "short category label",
      "pm25ReductionPct": 35,
      "estimatedAqi": 240,
      "bestWindow": "time window",
      "microRouteTip": "1-2 sentence micro-route walking/transit tip avoiding road exhaust"
    }
  ]
}`,
  });

  const parsed = stripMarkdownJson<SafeHavensResponse>(rawText);
  if (!Array.isArray(parsed.zones) || parsed.zones.length === 0) {
    throw new Error('Gemini returned an incomplete clean-air zones response.');
  }

  return {
    citySummary: parsed.citySummary || '',
    zones: parsed.zones.slice(0, 3).map((z) => ({
      name: z.name,
      zoneType: z.zoneType === 'forest' || z.zoneType === 'park' || z.zoneType === 'indoor_hepa' ? z.zoneType : 'park',
      typeLabel: z.typeLabel,
      pm25ReductionPct: Math.min(80, Math.max(10, Math.round(Number(z.pm25ReductionPct) || 35))),
      estimatedAqi: Math.max(15, Math.round(Number(z.estimatedAqi) || Math.round(params.aqi * 0.65))),
      bestWindow: z.bestWindow || params.bestWindow,
      microRouteTip: z.microRouteTip,
    })),
  };
}

