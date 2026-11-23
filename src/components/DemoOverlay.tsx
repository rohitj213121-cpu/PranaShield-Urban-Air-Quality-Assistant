import { Volume2, Square, Sparkles } from 'lucide-react';
import { TOTAL_DEMO_SECONDS, type DemoStepInfo } from '../hooks/useGuidedDemo';

interface DemoOverlayProps {
  isRunning: boolean;
  elapsedSeconds: number;
  activeStep: DemoStepInfo;
  onStop: () => void;
}

function formatSec(sec: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_DEMO_SECONDS, sec));
  return `00:${String(clamped).padStart(2, '0')}`;
}

export function DemoOverlay({ isRunning, elapsedSeconds, activeStep, onStop }: DemoOverlayProps) {
  if (!isRunning) return null;

  const progressPct = Math.min(100, Math.round((elapsedSeconds / TOTAL_DEMO_SECONDS) * 100));

  return (
    <aside
      aria-label="AI Demo Guide"
      aria-live="polite"
      className="fixed bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/90 rounded-2xl shadow-xl px-4 py-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-emerald-600/25 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold tracking-tight text-emerald-300 whitespace-nowrap">
              PranaShield AI Demo Guide
            </span>
            <span className="text-slate-500 text-xs" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-num text-xs font-semibold text-white whitespace-nowrap">
              Step {activeStep.stepNumber}/{activeStep.totalSteps}
            </span>
            <span className="text-xs font-medium text-slate-300 truncate hidden sm:inline">
              — {activeStep.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono-num text-[11px] text-slate-300 hidden sm:inline">
            {formatSec(elapsedSeconds)} / 00:{TOTAL_DEMO_SECONDS}
          </span>
          <button
            type="button"
            onClick={onStop}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
            <span>Stop Demo</span>
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">{activeStep.narration}</p>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="font-mono-num text-[11px] text-slate-300 shrink-0 sm:hidden">
          {formatSec(elapsedSeconds)} / 00:{TOTAL_DEMO_SECONDS}
        </span>
      </div>
    </aside>
  );
}
