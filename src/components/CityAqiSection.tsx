import { useState, FormEvent } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  OctagonAlert,
  Clock,
  Wind,
  Droplets,
  Thermometer,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { CityAirData, HourlyAqiPoint, Language, VerdictLevel } from '../types/airQuality';
import { QUICK_SELECT_CITY_IDS } from '../data/cities';
import { UI_COPY } from '../data/translations';
import { fetchCityAqi } from '../utils/geminiService';

interface CityAqiSectionProps {
  language: Language;
  cities: CityAirData[];
  selectedCity: CityAirData;
  onSelectCity: (city: CityAirData) => void;
  onAddCustomCity: (city: CityAirData) => void;
}

const VERDICT_STYLES: Record<
  VerdictLevel,
  {
    container: string;
    badge: string;
    iconColor: string;
    barColor: string;
  }
> = {
  GO: {
    container: 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
    badge: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-700',
    barColor: '#16A34A',
  },
  CAUTION: {
    container: 'bg-amber-50/90 border-amber-200 text-amber-950',
    badge: 'bg-amber-600 text-white',
    iconColor: 'text-amber-700',
    barColor: '#D97706',
  },
  LIMIT: {
    container: 'bg-orange-50/90 border-orange-200 text-orange-950',
    badge: 'bg-orange-600 text-white',
    iconColor: 'text-orange-700',
    barColor: '#EA580C',
  },
  AVOID: {
    container: 'bg-red-50/90 border-red-200 text-red-950',
    badge: 'bg-red-600 text-white',
    iconColor: 'text-red-700',
    barColor: '#DC2626',
  },
};

function VerdictIcon({ verdict, className }: { verdict: VerdictLevel; className?: string }) {
  switch (verdict) {
    case 'GO':
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case 'CAUTION':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'LIMIT':
      return <ShieldAlert className={className} aria-hidden="true" />;
    case 'AVOID':
      return <OctagonAlert className={className} aria-hidden="true" />;
  }
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HourlyAqiPoint }>;
  label?: string;
}

function AqiTrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <div className="font-mono-num font-bold text-slate-900 mb-1">{label}</div>
      <div className="flex items-center justify-between gap-4 text-slate-700">
        <span>AQI</span>
        <span className="font-mono-num font-bold text-slate-900">{point.aqi}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-slate-600 mt-0.5">
        <span>PM2.5</span>
        <span className="font-mono-num font-semibold">{point.pm25} µg/m³</span>
      </div>
    </div>
  );
}

export function CityAqiSection({
  language,
  cities,
  selectedCity,
  onSelectCity,
  onAddCustomCity,
}: CityAqiSectionProps) {
  const copy = UI_COPY[language].aqi;
  const verdictCopy = UI_COPY[language].verdicts[selectedCity.verdict];
  const style = VERDICT_STYLES[selectedCity.verdict];

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const quickCities = QUICK_SELECT_CITY_IDS.map((id) => cities.find((c) => c.id === id)).filter(
    (c): c is CityAirData => Boolean(c)
  );

  const matchingSuggestions =
    query.trim().length > 0
      ? cities.filter(
          (c) =>
            c.name.en.toLowerCase().includes(query.trim().toLowerCase()) ||
            c.name.hi.includes(query.trim())
        )
      : [];

  async function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchError(null);

    const existing = cities.find(
      (c) =>
        c.name.en.toLowerCase() === trimmed.toLowerCase() ||
        c.name.hi === trimmed ||
        c.id === trimmed.toLowerCase()
    );
    if (existing) {
      onSelectCity(existing);
      setQuery('');
      return;
    }

    setIsSearching(true);
    try {
      const data = await fetchCityAqi(trimmed);
      onAddCustomCity(data);
      onSelectCity(data);
      setQuery('');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to look up city.');
    } finally {
      setIsSearching(false);
    }
  }

  const trendPoints = selectedCity.hourlyTrend;
  const aqiValues = trendPoints.map((p) => p.aqi);
  const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : selectedCity.aqi;
  const lowAqi = aqiValues.length > 0 ? Math.min(...aqiValues) : selectedCity.aqi;
  const peakPoint = trendPoints.find((p) => p.aqi === peakAqi);
  const yMax = Math.max(150, Math.ceil((peakAqi + 40) / 50) * 50);

  return (
    <section id="live-aqi" aria-labelledby="aqi-section-heading" className="scroll-mt-20">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7">
        {/* Section Header + Search & Quick Select */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <h2 id="aqi-section-heading" className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              {copy.sectionTitle}
            </h2>
            <p className="text-xs font-medium text-slate-500">{copy.quickCitiesLabel}</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {quickCities.map((city) => {
                const isActive = selectedCity.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    data-demo={`city-${city.id}`}
                    onClick={() => {
                      onSelectCity(city);
                      setSearchError(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                    }`}
                  >
                    {city.name[language]}
                    <span className="ml-2 font-mono-num text-xs opacity-80">{city.aqi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchError(null);
                  }}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span className="hidden sm:inline">{copy.searchingCity}</span>
                  </>
                ) : (
                  copy.searchButton
                )}
              </button>
            </form>

            {matchingSuggestions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {matchingSuggestions.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(c);
                      setQuery('');
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer"
                  >
                    {c.name[language]} ({c.aqi})
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <p role="alert" className="mt-2 text-xs text-red-700 font-medium">
                {searchError}
              </p>
            )}
          </div>
        </div>

        {/* Main City Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch">
          {/* Left: City Summary + Verdict Block + Pollutant Metrics */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{selectedCity.region[language]}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.stationLabel}: {selectedCity.station[language]}
                  </span>
                  {selectedCity.isCustomAiLookup && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-semibold">{copy.customCityBadge}</span>
                    </>
                  )}
                </div>
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  {selectedCity.name[language]}
                </h3>
                <p className="text-sm text-slate-600 max-w-xl leading-relaxed">{selectedCity.summary[language]}</p>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="text-xs font-medium text-slate-500">{copy.aqiUnit}</div>
                <div className="font-mono-num text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-none mt-1">
                  {selectedCity.aqi}
                </div>
                <div className="text-sm font-semibold text-slate-700 mt-1.5">
                  {selectedCity.categoryLabel[language]}
                </div>
              </div>
            </div>

            {/* Bold Color-Coded Verdict & Mask Block */}
            <div className={`border rounded-xl p-4 sm:p-5 ${style.container}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <VerdictIcon verdict={selectedCity.verdict} className={`w-6 h-6 shrink-0 mt-0.5 ${style.iconColor}`} />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-semibold text-slate-600">{copy.verdictLabel}</span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide ${style.badge}`}>
                        {verdictCopy.title}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">{verdictCopy.action}</p>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-current/15 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                  <div className="text-xs font-medium opacity-75">{copy.maskLabel}</div>
                  <div className="text-sm font-bold mt-0.5">{selectedCity.maskRequired[language]}</div>
                </div>
              </div>
            </div>

            {/* Tabular Pollutant Breakdown & Weather Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/50">
              <div className="p-3.5">
                <div className="text-xs text-slate-500 font-medium">PM2.5</div>
                <div className="font-mono-num text-xl font-bold text-slate-900 mt-1">
                  {selectedCity.pm25} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{copy.pm25Desc}</div>
              </div>
              <div className="p-3.5">
                <div className="text-xs text-slate-500 font-medium">PM10</div>
                <div className="font-mono-num text-xl font-bold text-slate-900 mt-1">
                  {selectedCity.pm10} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{copy.pm10Desc}</div>
              </div>
              <div className="p-3.5">
                <div className="text-xs text-slate-500 font-medium">NO₂</div>
                <div className="font-mono-num text-xl font-bold text-slate-900 mt-1">
                  {selectedCity.no2} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{copy.no2Desc}</div>
              </div>
              <div className="p-3.5">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>{copy.safestTimeLabel}</span>
                </div>
                <div className="font-mono-num text-sm font-bold text-emerald-800 mt-1.5">{selectedCity.bestWindow}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono-num">
                  <span className="inline-flex items-center gap-0.5">
                    <Thermometer className="w-3 h-3" aria-hidden="true" />
                    {selectedCity.tempC}°C
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Droplets className="w-3 h-3" aria-hidden="true" />
                    {selectedCity.humidityPct}%
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Wind className="w-3 h-3" aria-hidden="true" />
                    {selectedCity.windKmh}km/h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 24-Hour AQI Trend Recharts Line Chart */}
          <div className="lg:col-span-5 border border-slate-200 rounded-xl p-5 bg-[#F9FBF9] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-display text-sm font-bold text-slate-900">{copy.trendTitle}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{copy.trendSubtitle}</p>
              </div>
              <div className="text-right shrink-0 font-mono-num text-xs">
                <div className="text-slate-600">
                  {copy.peakLabel}:{' '}
                  <span className="font-bold text-red-700">
                    {peakAqi}
                    {peakPoint ? ` (${peakPoint.hour})` : ''}
                  </span>
                </div>
                <div className="text-slate-600 mt-0.5">
                  {copy.lowLabel}: <span className="font-bold text-emerald-800">{lowAqi}</span>
                </div>
              </div>
            </div>

            <div className="my-4 w-full h-52 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 10, right: 12, left: -16, bottom: 2 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, yMax]}
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <Tooltip content={<AqiTrendTooltip />} />
                  {yMax >= 300 && (
                    <ReferenceLine
                      y={300}
                      stroke="#DC2626"
                      strokeDasharray="4 4"
                      strokeOpacity={0.45}
                    />
                  )}
                  {yMax >= 200 && yMax < 350 && (
                    <ReferenceLine
                      y={200}
                      stroke="#D97706"
                      strokeDasharray="4 4"
                      strokeOpacity={0.45}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke={style.barColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#FFFFFF', stroke: style.barColor, strokeWidth: 2 }}
                    activeDot={{ r: 5.5, fill: style.barColor, stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <span>{copy.safestTimeLabel}</span>
              <span className="font-mono-num font-bold text-emerald-800">{selectedCity.bestWindow}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
