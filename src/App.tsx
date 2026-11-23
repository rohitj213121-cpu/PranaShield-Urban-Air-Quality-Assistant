import { useState } from 'react';
import type { CityAirData, Language } from './types/airQuality';
import { INDIAN_CITIES_DATA } from './data/cities';
import { UI_COPY } from './data/translations';
import { Header } from './components/Header';
import { CityAqiSection } from './components/CityAqiSection';
import { HealthPlannerSection } from './components/HealthPlannerSection';
import { RoutineCoachSection } from './components/RoutineCoachSection';
import { IndoorGuideSection } from './components/IndoorGuideSection';
import { DemoOverlay } from './components/DemoOverlay';
import { useGuidedDemo } from './hooks/useGuidedDemo';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [cities, setCities] = useState<CityAirData[]>(INDIAN_CITIES_DATA);
  const [selectedCity, setSelectedCity] = useState<CityAirData>(INDIAN_CITIES_DATA[0]);
  const [apiKeyVersion, setApiKeyVersion] = useState(0);

  const demo = useGuidedDemo(setLanguage);
  const copy = UI_COPY[language];

  function handleAddCustomCity(customCity: CityAirData) {
    setCities((prev) => {
      const exists = prev.some((c) => c.id === customCity.id);
      if (exists) {
        return prev.map((c) => (c.id === customCity.id ? customCity : c));
      }
      return [...prev, customCity];
    });
  }

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F9F7] text-slate-900">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onApiKeyUpdated={() => setApiKeyVersion((v) => v + 1)}
        isDemoRunning={demo.isRunning}
        onStartDemo={demo.startDemo}
        onStopDemo={demo.stopDemo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Concise Editorial Intro */}
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-semibold text-emerald-800 tracking-normal">{copy.hero.kicker}</p>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight">
            {copy.hero.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{copy.hero.subtitle}</p>
        </div>

        {/* Feature 1: Live City AQI & Safety Verdict */}
        <CityAqiSection
          language={language}
          cities={cities}
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          onAddCustomCity={handleAddCustomCity}
        />

        {/* Feature 2: AI Health & Outdoor Planner */}
        <HealthPlannerSection language={language} city={selectedCity} apiKeyVersion={apiKeyVersion} />

        {/* Features 3 & 4: Low-Emission Daily Routine Coach + Indoor Air Quality Guide & AI Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <RoutineCoachSection language={language} city={selectedCity} />
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <IndoorGuideSection language={language} city={selectedCity} />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p className="max-w-2xl leading-relaxed">{copy.footer.note}</p>
          <p className="font-mono-num text-slate-600 shrink-0">{copy.footer.scaleTitle}</p>
        </div>
      </footer>

      <DemoOverlay
        isRunning={demo.isRunning}
        elapsedSeconds={demo.elapsedSeconds}
        activeStep={demo.activeStep}
        onStop={demo.stopDemo}
      />
    </div>
  );
}
