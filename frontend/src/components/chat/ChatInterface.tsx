"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import StreamingMessage from "./StreamingMessage";
import AgentSteps from "./AgentSteps";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  steps?: string[];
}

const SUGGESTIONS = [
  "Bu ay neden fazla harcadım?",
  "3 ayda tatil için nasıl para biriktiririm?",
  "Hangi kategoride en çok harcıyorum?",
  "Aylık raporumu göster",
];

const STEP_LABELS: Record<string, string> = {
  data_analyst: "Veri Analizi",
  behavioral_profiler: "Davranış Analizi",
  financial_coach: "Finansal Koçluk",
  reporting: "Raporlama",
};

export default function ChatInterface({ userId }: { userId: string }) {
  const [inputFocused, setInputFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [messages, setMessages] = useState<Message[]>([{
    id: "0", role: "assistant",
    content: "Merhaba! Ben FinMind AI, finansal koçunuzum. Harcamalarınız, bütçeniz veya hedefleriniz hakkında doğal dilde sorabilirsiniz. Size veriye dayalı, kişiselleştirilmiş analizler sunacağım.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSteps, setActiveSteps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !userId) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(p => [...p, userMsg]);
    setInput(""); setLoading(true); setActiveSteps([]);

    // Simulate step progression
    const stepSeq = ["data_analyst", "behavioral_profiler", "financial_coach"];
    for (let i = 0; i < stepSeq.length; i++) {
      await new Promise(r => setTimeout(r, 600 * i));
      setActiveSteps(stepSeq.slice(0, i + 1));
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/`,
        { user_id: userId, message: text }
      );
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.response,
        intent: res.data.intent,
        steps: res.data.steps_taken,
      };
      setMessages(p => [...p, botMsg]);
    } catch {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: "Bağlantı hatası. Backend çalışıyor mu?",
      }]);
    } finally { setLoading(false); setActiveSteps([]); }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor. Chrome kullanın.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => send(transcript), 300);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-[#f59e0b] flex items-center justify-center text-xs font-bold text-black mr-3 mt-1 shrink-0">
                F
              </div>
            )}
            <div className={`max-w-2xl space-y-2 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.steps && msg.steps.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {msg.steps.map(s => (
                    <span key={s} className="text-[10px] bg-[#f59e0b11] border border-[#f59e0b22] text-[#f59e0b] px-2 py-0.5 rounded-full">
                      ✓ {STEP_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#f59e0b] text-black font-medium rounded-tr-sm"
                  : "bg-[#16161f] border border-[#ffffff0f] text-[#f0f0f5] rounded-tl-sm"
              }`}
                style={{ whiteSpace: "pre-wrap" }}>
                {msg.role === "assistant"
                  ? <StreamingMessage content={msg.content} />
                  : msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading state with agent steps */}
        {loading && (
          <div className="flex justify-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#f59e0b] flex items-center justify-center text-xs font-bold text-black shrink-0"
              style={{ animation: "agent-pulse 1.6s ease-in-out infinite" }}>
              F
            </div>
            <div className="space-y-2">
              <AgentSteps activeSteps={activeSteps} isLoading={loading} />
              <div className="bg-[#16161f] border border-[#ffffff0f] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"
                    style={{ animation: `bounce-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      <div className="px-6 pb-3 flex gap-2 flex-wrap">
        {SUGGESTIONS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-xs bg-[#16161f] hover:bg-[#1c1c28] border border-[#ffffff0f] hover:border-[#f59e0b33] text-[#8888a0] hover:text-[#f59e0b] px-3 py-1.5 rounded-full transition-all duration-200">
            {q}
          </button>
        ))}
      </div>

      {/* Input — B.03 expand + amber glow on focus */}
      <div className="px-6 pb-5">
        <div className={`flex gap-3 bg-[#16161f] border rounded-2xl p-2 transition-all duration-300 ${
          inputFocused
            ? "border-[#f59e0b44] shadow-[0_0_20px_#f59e0b11]"
            : "border-[#ffffff0f] hover:border-[#f59e0b22]"
        }`}>
          <button
            onClick={startListening}
            disabled={loading}
            className={`px-3 py-2.5 rounded-xl transition-all duration-200 shrink-0 ${
              listening
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-[#44445a] hover:text-[#f59e0b] hover:bg-[#f59e0b11]"
            }`}
            title="Sesli soru sor">
            {listening ? (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 bg-red-400 rounded-full"
                  style={{ animation: "dot-pulse 800ms ease-in-out infinite" }}/>
                Dinliyor
              </span>
            ) : "🎤"}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Finansal sorunuzu yazın..."
            className="flex-1 bg-transparent px-3 text-sm text-white placeholder-[#44445a] focus:outline-none transition-all duration-300"
            style={{
              paddingTop:    inputFocused ? "10px" : "8px",
              paddingBottom: inputFocused ? "10px" : "8px",
            }}
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className={`disabled:opacity-30 text-black px-5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              input.trim() ? "bg-[#f59e0b] hover:bg-[#f59e0b]/90" : "bg-[#f59e0b]/50"
            }`}>
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
