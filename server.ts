import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-2.5-flash';
const SECONDARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const AI_CALL_TIMEOUT_MS = 10000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientOrModelError(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string };
  const status = e?.status ?? e?.code;
  if (status === 404 || status === 429 || (typeof status === 'number' && status >= 500)) {
    return true;
  }
  const msg = e?.message || '';
  return /404|NOT_FOUND|429|500|502|503|504|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|timed out/i.test(msg);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI request timed out.')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function generateWithFailover(
  runForModel: (model: string, thinkingLevel?: ThinkingLevel) => Promise<string>
): Promise<string> {
  const chain: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
    { model: PRIMARY_MODEL },
    { model: SECONDARY_MODEL, thinkingLevel: ThinkingLevel.LOW },
    { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL },
  ];

  let lastErr: unknown;
  for (const target of chain) {
    try {
      return await withTimeout(runForModel(target.model, target.thinkingLevel), AI_CALL_TIMEOUT_MS);
    } catch (err) {
      lastErr = err;
      if (!isTransientOrModelError(err)) {
        throw err;
      }
    }
  }
  throw lastErr;
}

function mapAiError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; code?: number; message?: string };
  const rawMsg = e?.message || 'Unable to reach AI service.';
  const status = e?.status ?? e?.code;

  if (rawMsg.includes('GEMINI_API_KEY')) {
    return { status: 500, message: 'Server Gemini API key is not configured.' };
  }
  if (status === 403 || status === 400 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(rawMsg)) {
    return {
      status: status || 400,
      message: 'Gemini API key permission or request validation error. Please verify your key in Settings > Secrets.',
    };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|429/i.test(rawMsg)) {
    return { status: 429, message: 'AI quota limit temporarily reached. Please retry in a moment.' };
  }
  if (/503|UNAVAILABLE|high demand/i.test(rawMsg)) {
    return { status: 503, message: 'Gemini AI is currently experiencing high demand. Please retry shortly.' };
  }
  if (/timed out/i.test(rawMsg)) {
    return { status: 504, message: 'Gemini AI took too long to respond. Please retry.' };
  }
  return { status: 502, message: 'Unable to reach Gemini AI right now.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'PranaShield' });
  });

  // 1. Custom Indian city AQI lookup via Gemini when city isn't in local preset list
  app.post('/api/city-aqi', async (req, res) => {
    try {
      const cityQuery = String(req.body?.cityQuery || '').trim();
      if (!cityQuery || cityQuery.length > 80) {
        return res.status(400).json({ error: 'Please provide a valid city name.' });
      }

      const ai = getAiClient();
      const text = await generateWithFailover(async (model, thinkingLevel) => {
        const response = await ai.models.generateContent({
          model,
          contents: `Provide realistic late-November winter air quality telemetry for the Indian city "${cityQuery}". Base values on typical seasonal CPCB AQI patterns in India during November winter inversion. Verdict must strictly follow: 0-100 GO, 101-200 CAUTION, 201-300 LIMIT, 301+ AVOID.`,
          config: {
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nameEn: { type: Type.STRING },
                nameHi: { type: Type.STRING },
                regionEn: { type: Type.STRING },
                regionHi: { type: Type.STRING },
                stationEn: { type: Type.STRING },
                stationHi: { type: Type.STRING },
                aqi: { type: Type.INTEGER },
                pm25: { type: Type.INTEGER },
                pm10: { type: Type.INTEGER },
                no2: { type: Type.INTEGER },
                tempC: { type: Type.INTEGER },
                humidityPct: { type: Type.INTEGER },
                windKmh: { type: Type.INTEGER },
                verdict: { type: Type.STRING, description: 'One of GO, CAUTION, LIMIT, AVOID' },
                categoryEn: { type: Type.STRING },
                categoryHi: { type: Type.STRING },
                maskEn: { type: Type.STRING },
                maskHi: { type: Type.STRING },
                summaryEn: { type: Type.STRING },
                summaryHi: { type: Type.STRING },
                bestWindow: { type: Type.STRING, description: 'e.g. 1:00 PM - 4:00 PM' },
                hourlyTrend: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hour: { type: Type.STRING },
                      pm25: { type: Type.INTEGER },
                      aqi: { type: Type.INTEGER },
                    },
                    required: ['hour', 'pm25', 'aqi'],
                  },
                },
              },
              required: [
                'nameEn',
                'nameHi',
                'regionEn',
                'regionHi',
                'stationEn',
                'stationHi',
                'aqi',
                'pm25',
                'pm10',
                'no2',
                'tempC',
                'humidityPct',
                'windKmh',
                'verdict',
                'categoryEn',
                'categoryHi',
                'maskEn',
                'maskHi',
                'summaryEn',
                'summaryHi',
                'bestWindow',
                'hourlyTrend',
              ],
            },
          },
        });
        return (response.text ?? '{}').trim();
      });

      const parsed = JSON.parse(text);
      const allowedVerdicts = ['GO', 'CAUTION', 'LIMIT', 'AVOID'];
      const normalizedVerdict = allowedVerdicts.includes(parsed.verdict)
        ? parsed.verdict
        : parsed.aqi > 300
        ? 'AVOID'
        : parsed.aqi > 200
        ? 'LIMIT'
        : parsed.aqi > 100
        ? 'CAUTION'
        : 'GO';

      return res.json({
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
      });
    } catch (err) {
      const mapped = mapAiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 2. AI Health & Outdoor Planner
  app.post('/api/planner', async (req, res) => {
    try {
      const { city, aqi, pm25, pm10, verdict, bestWindow, profile, activity, language } = req.body ?? {};
      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, natural everyday Indian Hindi)' : 'English';

      const ai = getAiClient();
      const text = await generateWithFailover(async (model, thinkingLevel) => {
        const response = await ai.models.generateContent({
          model,
          contents: `City: ${city} (AQI: ${aqi}, PM2.5: ${pm25} µg/m³, PM10: ${pm10} µg/m³, Verdict: ${verdict}, Lowest smog window: ${bestWindow}).
User Profile: ${profile}.
Planned Activity: ${activity}.
Respond entirely in ${langLabel}. Provide practical, medically sound urban Indian air pollution advice.`,
          config: {
            systemInstruction:
              'You are PranaShield, an empathetic urban environmental health advisor for Indian families dealing with winter smog. Be concise, practical, and specific to Indian city conditions.',
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                safestWindow: {
                  type: Type.STRING,
                  description:
                    'Exact recommended time window or explicit recommendation to stay indoors if AQI > 350 for sensitive groups.',
                },
                riskRating: {
                  type: Type.STRING,
                  description: 'Short 1-3 word risk label like High Risk, Moderate Risk, Low Risk or their Hindi equivalents.',
                },
                headline: {
                  type: Type.STRING,
                  description: 'Clear 1-sentence verdict for this specific profile and activity.',
                },
                maskGuidance: {
                  type: Type.STRING,
                  description: 'Specific mask type and fit guidance (e.g., N95 valve-free, N99, or no mask needed).',
                },
                precautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 4 crisp, actionable precautions tailored to this profile & activity.',
                },
                indoorAlternative: {
                  type: Type.STRING,
                  description: 'Practical indoor alternative if outdoor air is unsafe.',
                },
              },
              required: ['safestWindow', 'riskRating', 'headline', 'maskGuidance', 'precautions', 'indoorAlternative'],
            },
          },
        });
        return (response.text ?? '{}').trim();
      });

      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err) {
      const mapped = mapAiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 3. Low-Emission Daily Routine Coach AI Tip Generator
  app.post('/api/coach-tip', async (req, res) => {
    try {
      const { city, aqi, completedCount, totalCount, language } = req.body ?? {};
      const langLabel = language === 'hi' ? 'Hindi (Devanagari script, natural everyday Indian Hindi)' : 'English';

      const ai = getAiClient();
      const text = await generateWithFailover(async (model, thinkingLevel) => {
        const response = await ai.models.generateContent({
          model,
          contents: `Generate 1 fresh, high-impact low-emission daily habit tip for a household in ${city} (current AQI: ${aqi}). They have already completed ${completedCount} of ${totalCount} daily eco-habits. Respond entirely in ${langLabel}. Focus on practical Indian urban life (e.g. PNG/induction cooking, carpooling, solar/LED, avoiding diesel generators, wet-cleaning, public transit, tyre pressure, stopping waste burning).`,
          config: {
            systemInstruction:
              'You are PranaShield Routine Coach. Give concise, encouraging, actionable eco-tips for Indian families that reduce personal smog exposure and emissions.',
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Short punchy habit title (max 8 words).' },
                actionStep: { type: Type.STRING, description: 'One concrete step the family can do today.' },
                whyItHelps: { type: Type.STRING, description: 'How it protects health or cuts local smog.' },
                estimatedImpact: { type: Type.STRING, description: 'Short measurable benefit string.' },
              },
              required: ['title', 'actionStep', 'whyItHelps', 'estimatedImpact'],
            },
          },
        });
        return (response.text ?? '{}').trim();
      });

      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err) {
      const mapped = mapAiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 4. Indoor Air Quality Guide & AI Chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, city, aqi, pm25, language } = req.body ?? {};
      const userMessage = String(message || '').trim();
      if (!userMessage) {
        return res.status(400).json({ error: 'Please enter a question.' });
      }

      const langLabel = language === 'hi' ? 'Hindi (Devanagari script)' : 'English';
      const priorTurns = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'User' : 'PranaShield'}: ${m.text || ''}`)
            .join('\n')
        : '';

      const ai = getAiClient();
      const reply = await generateWithFailover(async (model, thinkingLevel) => {
        const response = await ai.models.generateContent({
          model,
          contents: `Active City Context: ${city} (AQI ${aqi}, PM2.5 ${pm25} µg/m³).
${priorTurns ? `Recent conversation:\n${priorTurns}\n` : ''}User question: ${userMessage}
Respond in ${langLabel}. Keep your response clear, scannable (use short bullet points where helpful), and under 160 words.`,
          config: {
            systemInstruction:
              'You are PranaShield Indoor Air Specialist helping families in Indian cities purify indoor air during smog season. Cover HEPA H13 purifiers, CADR sizing for Indian bedrooms, budget Corsi-Rosenthal DIY fans, safe air-purifying plants (Areca Palm, Snake Plant, Money Plant, Peace Lily), wet mopping, kitchen ventilation, and winter window-opening timings (1 PM–4 PM). Never invent fake product claims.',
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
          },
        });
        return (response.text ?? '').trim();
      });

      return res.json({ reply });
    } catch (err) {
      const mapped = mapAiError(err);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // Ensure unmatched /api/* routes always return JSON, never HTML
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PranaShield server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
