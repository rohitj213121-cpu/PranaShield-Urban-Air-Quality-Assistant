import { useState, useRef, useEffect, FormEvent } from 'react';
import { Wind, KeyRound, Eye, EyeOff, Check, X, Play, Square } from 'lucide-react';
import type { Language } from '../types/airQuality';
import { UI_COPY } from '../data/translations';
import { getSavedBrowserApiKey, saveBrowserApiKey } from '../utils/geminiService';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onApiKeyUpdated: () => void;
  isDemoRunning: boolean;
  onStartDemo: () => void;
  onStopDemo: () => void;
}

export function Header({
  language,
  onLanguageChange,
  onApiKeyUpdated,
  isDemoRunning,
  onStartDemo,
  onStopDemo,
}: HeaderProps) {
  const copy = UI_COPY[language].nav;
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(() => getSavedBrowserApiKey());
  const [hasSavedKey, setHasSavedKey] = useState(() => Boolean(getSavedBrowserApiKey()));
  const [showKey, setShowKey] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = keyInput.replace(/\s+/g, '').trim();
    saveBrowserApiKey(trimmed);
    setKeyInput(trimmed);
    setHasSavedKey(Boolean(trimmed));
    setSavedFeedback(true);
    onApiKeyUpdated();
    setTimeout(() => {
      setSavedFeedback(false);
      setIsOpen(false);
    }, 700);
  }

  function handleClear() {
    saveBrowserApiKey('');
    setKeyInput('');
    setHasSavedKey(false);
    onApiKeyUpdated();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="flex items-center gap-2 text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base sm:text-lg font-bold tracking-tight">PranaShield</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary sections" className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#live-aqi"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {copy.overview}
          </a>
          <a
            href="#health-planner"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {copy.planner}
          </a>
          <a
            href="#routine-coach"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {copy.routine}
          </a>
          <a
            href="#indoor-guide"
            className="hover:text-emerald-800 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            {copy.indoor}
          </a>
        </nav>

        {/* Zone 3: Watch AI Demo + API Key + English / Hindi toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={isDemoRunning ? onStopDemo : onStartDemo}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 min-h-[34px] inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              isDemoRunning
                ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
                : 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            {isDemoRunning ? (
              <>
                <Square className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />
                <span>Stop Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Watch AI Demo</span>
                <span className="sm:hidden">AI Demo</span>
              </>
            )}
          </button>

          <div ref={popoverRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-label={language === 'hi' ? 'API कुंजी' : 'API Key'}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 min-h-[34px] inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                hasSavedKey
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{language === 'hi' ? 'API कुंजी' : 'API Key'}</span>
            </button>

            {isOpen && (
              <div
                role="dialog"
                aria-label="Gemini API Key Settings"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    {language === 'hi' ? 'Google AI Studio API कुंजी' : 'Google AI Studio API Key'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="mt-3 space-y-3">
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    {hasSavedKey
                      ? language === 'hi'
                        ? 'ब्राउज़र कुंजी सक्रिय है (सीधा gemini-2.5-flash उपयोग)।'
                        : 'Browser key active (direct gemini-2.5-flash calls).'
                      : language === 'hi'
                      ? 'सीधे लाइव AI के लिए अपनी मुफ्त AI Studio कुंजी पेस्ट करें।'
                      : 'Paste your Google AI Studio key for direct browser Live AI calls.'}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="AIza..."
                      autoComplete="off"
                      aria-label="Gemini API Key"
                      className="w-full pl-3 pr-9 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((prev) => !prev)}
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showKey ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savedFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{language === 'hi' ? 'सहेजा गया' : 'Saved'}</span>
                        </>
                      ) : (
                        <span>{language === 'hi' ? 'कुंजी सहेजें' : 'Save Key'}</span>
                      )}
                    </button>
                    {hasSavedKey && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        {language === 'hi' ? 'हटाएं' : 'Clear'}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {language === 'hi'
                      ? 'यह कुंजी केवल आपके ब्राउज़र के localStorage में रहती है।'
                      : 'Stored only in browser localStorage. Avoid pasting personal keys on shared public devices.'}
                  </p>
                </form>
              </div>
            )}
          </div>

          <div
            role="group"
            aria-label="Language switch"
            className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              aria-pressed={language === 'en'}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[30px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              data-demo="lang-hi"
              onClick={() => onLanguageChange('hi')}
              aria-pressed={language === 'hi'}
              className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[30px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                language === 'hi'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
