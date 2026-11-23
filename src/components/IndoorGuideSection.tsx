import { useState, FormEvent, useRef, useEffect } from 'react';
import { Leaf, Wind, Shield, Send, Loader2, MessageSquare } from 'lucide-react';
import type { ChatMessage, CityAirData, Language } from '../types/airQuality';
import { UI_COPY } from '../data/translations';
import { fetchIndoorChat } from '../utils/geminiService';
import { buildFallbackIndoorReply } from '../utils/aiFallbacks';

interface IndoorGuideSectionProps {
  language: Language;
  city: CityAirData;
}

export function IndoorGuideSection({ language, city }: IndoorGuideSectionProps) {
  const copy = UI_COPY[language].indoor;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: UI_COPY[language].indoor.welcomeMessage,
      timestamp: '07:00',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: UI_COPY[language].indoor.welcomeMessage }];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    try {
      const data = await fetchIndoorChat({
        message: trimmed,
        history: nextHistory.filter((m) => m.id !== 'welcome'),
        city: city.name.en,
        aqi: city.aqi,
        pm25: city.pm25,
        language,
      });

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: replyTime,
        },
      ]);
    } catch {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const fallbackText = buildFallbackIndoorReply(trimmed, city, language);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
          timestamp: replyTime,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendQuestion(input);
  }

  return (
    <section id="indoor-guide" aria-labelledby="indoor-heading" className="scroll-mt-20 flex flex-col h-full">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div>
          <div className="pb-4 border-b border-slate-100">
            <h2 id="indoor-heading" className="font-display text-xl font-bold text-slate-900">
              {copy.sectionTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{copy.sectionSubtitle}</p>
          </div>

          {/* Quick Reference Indoor Air Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="border border-slate-200 rounded-lg p-3.5 bg-[#F9FBF9]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Wind className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>{copy.guideVentTitle}</span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{copy.ventRule}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3.5 bg-[#F9FBF9]">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Shield className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span>{copy.guidePurifierTitle}</span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{copy.purifierRule}</p>
            </div>
          </div>

          <div className="mt-3 border border-slate-200 rounded-lg p-3.5 bg-[#F9FBF9]">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2">
              <Leaf className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{copy.guidePlantsTitle}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {copy.plantsList.map((plant) => (
                <div key={plant.name} className="text-xs leading-relaxed">
                  <span className="font-semibold text-slate-900">{plant.name}: </span>
                  <span className="text-slate-600">{plant.benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive AI Chat */}
        <div className="border border-slate-200 rounded-xl bg-slate-50/70 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{copy.chatTitle}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-semibold">
                ✨ PranaShield AI
              </span>
              <span className="text-[11px] font-mono-num text-slate-500 hidden sm:inline">
                {city.name[language]} · AQI {city.aqi}
              </span>
            </div>
          </div>

          <div ref={scrollRef} className="p-3.5 space-y-3 h-56 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="font-mono-num text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" aria-hidden="true" />
                <span>{copy.thinkingText}</span>
              </div>
            )}
          </div>

          {/* Starter Prompts */}
          <div className="px-3.5 py-2 border-t border-slate-200/70 bg-white/70">
            <div className="text-[11px] font-medium text-slate-500 mb-1.5">{copy.quickPromptsLabel}</div>
            <div className="flex flex-wrap gap-1.5">
              {copy.quickPrompts.map((prompt, idx) => (
                <button
                  key={prompt}
                  type="button"
                  data-demo={`chat-prompt-${idx}`}
                  disabled={isSending}
                  onClick={() => sendQuestion(prompt)}
                  className="text-xs px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200 rounded-md transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.chatPlaceholder}
              aria-label={copy.chatPlaceholder}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[42px]"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px] inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copy.sendBtn}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
