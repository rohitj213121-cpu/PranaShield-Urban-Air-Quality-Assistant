import { useState, useRef, useCallback, useEffect } from 'react';
import type { Language } from '../types/airQuality';

export const STEP_DURATION_MS = 8000;
export const TOTAL_DEMO_STEPS = 5;
export const TOTAL_DEMO_SECONDS = (STEP_DURATION_MS * TOTAL_DEMO_STEPS) / 1000; // 40 seconds

export interface DemoStepInfo {
  stepNumber: number;
  totalSteps: number;
  title: string;
  narration: string;
}

interface GuidedDemoStep {
  stepNumber: number;
  title: string;
  narration: string;
  runVisualActions: (scheduleAction: (delayMs: number, fn: () => void) => void) => void;
}

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-emerald-500', 'ring-offset-2'];

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  return (
    voices.find((v) => v.lang === 'en-IN' && /natural|google|rishi|neerja/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en-') && /natural|google|samantha|daniel/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en-')) ||
    voices[0]
  );
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

function playSoftChime(ctx: AudioContext | null, stepNumber: number) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    // Gentle ascending two-note chime varied subtly per step
    const baseFreqs = [523.25, 587.33, 659.25, 698.46, 783.99];
    const rootFreq = baseFreqs[(stepNumber - 1) % baseFreqs.length];
    const overtoneFreq = rootFreq * 1.25;

    [
      { freq: rootFreq, offset: 0, duration: 0.28, peakGain: 0.06 },
      { freq: overtoneFreq, offset: 0.11, duration: 0.34, peakGain: 0.05 },
    ].forEach(({ freq, offset, duration, peakGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    });
  } catch {
    // Ignore audio errors if hardware/OS audio is disabled
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(id: string, block: ScrollLogicalPosition = 'start') {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block });
  }
}

function highlightDemoTarget(selector: string, durationMs = 1600): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  el.classList.add(...HIGHLIGHT_CLASSES);
  window.setTimeout(() => {
    el.classList.remove(...HIGHLIGHT_CLASSES);
  }, durationMs);
  return el;
}

function clickDemoTarget(selector: string, highlightMs = 1400) {
  const el = highlightDemoTarget(selector, highlightMs);
  if (el) {
    el.click();
  }
}

const DEMO_STEPS: GuidedDemoStep[] = [
  {
    stepNumber: 1,
    title: 'Live City AQI',
    narration:
      'Welcome to PranaShield, your AI Urban Air Quality Assistant. Check real-time city AQI, mask mandates, and safe outdoor hours.',
    runVisualActions: (scheduleAction) => {
      scrollToTop();
      scheduleAction(250, () => clickDemoTarget('[data-demo="city-delhi"]'));
    },
  },
  {
    stepNumber: 2,
    title: 'AI Safety Plan',
    narration:
      'Our AI Health Planner creates a personalized safety plan and exposure precautions for your family.',
    runVisualActions: (scheduleAction) => {
      scrollToSection('health-planner', 'center');
      scheduleAction(500, () => clickDemoTarget('[data-demo="profile-child_elderly"]'));
      scheduleAction(1100, () => clickDemoTarget('[data-demo="generate-plan-btn"]'));
    },
  },
  {
    stepNumber: 3,
    title: 'Routine Coach',
    narration:
      'The Daily Routine Coach tracks eco-friendly habits and generates fresh, city-specific AI action tips.',
    runVisualActions: (scheduleAction) => {
      scrollToSection('routine-coach', 'center');
      scheduleAction(500, () => clickDemoTarget('[data-demo="habit-metro_carpool"]'));
      scheduleAction(1100, () => clickDemoTarget('[data-demo="generate-tip-btn"]'));
    },
  },
  {
    stepNumber: 4,
    title: 'Indoor AI Chat',
    narration:
      'Get instant answers on air-purifying plants and home ventilation from our Indoor AI Chatbot.',
    runVisualActions: (scheduleAction) => {
      scrollToSection('indoor-guide', 'center');
      scheduleAction(550, () => clickDemoTarget('[data-demo="chat-prompt-0"]'));
    },
  },
  {
    stepNumber: 5,
    title: 'Language & Wrap-up',
    narration: 'With full English and Hindi support, PranaShield keeps every household safe. Thank you!',
    runVisualActions: (scheduleAction) => {
      scrollToTop();
      scheduleAction(500, () => highlightDemoTarget('[data-demo="lang-hi"]', 6500));
    },
  },
];

export function useGuidedDemo(onEnsureEnglish: (lang: Language) => void) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStep, setActiveStep] = useState<DemoStepInfo>({
    stepNumber: 1,
    totalSteps: TOTAL_DEMO_STEPS,
    title: DEMO_STEPS[0].title,
    narration: DEMO_STEPS[0].narration,
  });

  const runIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const elapsedIntervalRef = useRef<number | null>(null);
  const resumeIntervalRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const clearTimersAndHighlights = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (elapsedIntervalRef.current !== null) {
      window.clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }

    if (resumeIntervalRef.current !== null) {
      window.clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }

    document.querySelectorAll<HTMLElement>('[data-demo]').forEach((el) => {
      el.classList.remove(...HIGHLIGHT_CLASSES);
    });
  }, []);

  const stopDemo = useCallback(() => {
    runIdRef.current += 1;
    clearTimersAndHighlights();
    utteranceRef.current = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cleanup errors
      }
    }

    setIsRunning(false);
    setElapsedSeconds(0);
  }, [clearTimersAndHighlights]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // Ignore
      }
    }

    return () => {
      runIdRef.current += 1;
      clearTimersAndHighlights();
      utteranceRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore unmount cleanup errors
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, [clearTimersAndHighlights]);

  const scheduleTimer = useCallback((delayMs: number, runId: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      if (runIdRef.current === runId) {
        fn();
      }
    }, delayMs);
    timersRef.current.push(id);
  }, []);

  const triggerStepAudio = useCallback(
    (step: GuidedDemoStep, runId: number) => {
      let chimePlayed = false;
      const playFallbackChimeOnce = () => {
        if (chimePlayed || runIdRef.current !== runId) return;
        chimePlayed = true;
        playSoftChime(audioCtxRef.current, step.stepNumber);
      };

      const hasSpeechApi = typeof window !== 'undefined' && 'speechSynthesis' in window;
      if (!hasSpeechApi) {
        playFallbackChimeOnce();
        return;
      }

      let speechStarted = false;
      try {
        const utterance = new SpeechSynthesisUtterance(step.narration);
        utteranceRef.current = utterance;
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voice = pickEnglishVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

        utterance.onstart = () => {
          speechStarted = true;
        };

        utterance.onerror = (event) => {
          if (runIdRef.current !== runId) return;
          if (event.error === 'canceled' || event.error === 'interrupted') return;
          playFallbackChimeOnce();
        };

        window.speechSynthesis.speak(utterance);

        // If mobile Chrome / iframe silently blocks Web Speech API without throwing, play the soft chime
        scheduleTimer(300, runId, () => {
          if (!speechStarted && !window.speechSynthesis.speaking) {
            playFallbackChimeOnce();
          }
        });
      } catch {
        playFallbackChimeOnce();
      }
    },
    [scheduleTimer]
  );

  const activateStep = useCallback(
    (stepIndex: number, runId: number) => {
      if (runIdRef.current !== runId) return;
      const step = DEMO_STEPS[stepIndex];
      if (!step) return;

      setActiveStep({
        stepNumber: step.stepNumber,
        totalSteps: TOTAL_DEMO_STEPS,
        title: step.title,
        narration: step.narration,
      });

      step.runVisualActions((delayMs, fn) => scheduleTimer(delayMs, runId, fn));
      triggerStepAudio(step, runId);
    },
    [scheduleTimer, triggerStepAudio]
  );

  const startDemo = useCallback(() => {
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    clearTimersAndHighlights();
    utteranceRef.current = null;

    // Unlock Web Audio API synchronously inside the user gesture for reliable mobile audio chimes
    const AudioCtx = getAudioContextClass();
    if (AudioCtx) {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          void audioCtxRef.current.resume();
        }
      } catch {
        // Ignore AudioContext init failure
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel errors
      }
    }

    onEnsureEnglish('en');
    setIsRunning(true);
    setElapsedSeconds(0);

    const startTime = Date.now();
    elapsedIntervalRef.current = window.setInterval(() => {
      if (runIdRef.current !== currentRunId) return;
      const secs = Math.min(TOTAL_DEMO_SECONDS, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(secs);
    }, 250);

    // Keep-alive resume() for Chrome browsers where speech synthesis may pause
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      resumeIntervalRef.current = window.setInterval(() => {
        if (runIdRef.current !== currentRunId) return;
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // Ignore resume errors
        }
      }, 2500);
    }

    // Step 1 starts immediately in the user click gesture; Steps 2-5 advance reliably every 8 seconds (40s total)
    activateStep(0, currentRunId);
    for (let i = 1; i < DEMO_STEPS.length; i += 1) {
      scheduleTimer(i * STEP_DURATION_MS, currentRunId, () => {
        activateStep(i, currentRunId);
      });
    }

    // Finish cleanly at 40 seconds
    scheduleTimer(TOTAL_DEMO_STEPS * STEP_DURATION_MS, currentRunId, () => {
      stopDemo();
    });
  }, [activateStep, clearTimersAndHighlights, onEnsureEnglish, scheduleTimer, stopDemo]);

  return {
    isRunning,
    elapsedSeconds,
    activeStep,
    startDemo,
    stopDemo,
  };
}
