"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi, goalsApi, visionApi, transactionCreateApi, transactionApi } from "@/lib/api";
import LogoSVG from "@/components/ui/LogoSVG";

const CATEGORIES = [
  { value: "food",          label: "🍔 Yemek" },
  { value: "transport",     label: "🚌 Ulaşım" },
  { value: "shopping",      label: "🛍️ Alışveriş" },
  { value: "bills",         label: "📄 Faturalar" },
  { value: "entertainment", label: "🎬 Eğlence" },
  { value: "health",        label: "💊 Sağlık" },
  { value: "education",     label: "📚 Eğitim" },
  { value: "other",         label: "📦 Diğer" },
];

const STEPS = ["Profil", "Harcamalar", "Hedef"];

export default function Landing() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "onboard">("home");
  const [step, setStep] = useState(1);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ full_name: "", email: "", monthly_income: "" });
  const [transactions, setTransactions] = useState([
    { description: "", amount: "", category: "food" },
    { description: "", amount: "", category: "bills" },
    { description: "", amount: "", category: "shopping" },
  ]);
  const [goal, setGoal] = useState({ title: "", target_amount: "" });

  // Vision / photo upload state
  const [txTab, setTxTab] = useState<"manual" | "photo">("manual");
  const [visionState, setVisionState] = useState<"idle" | "preview" | "loading" | "done">("idle");
  const [visionPreview, setVisionPreview] = useState("");
  const [visionFile, setVisionFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const inputClass = `w-full bg-[#0d0d14] border border-[#ffffff0f] hover:border-[#f59e0b33]
    focus:border-[#f59e0b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white
    placeholder-[#44445a] transition-all duration-200 font-sans`;

  // ── Step navigation with slide animation ───────────────────────────
  const goTo = (next: number) => {
    if (animating) return;
    setAnimDir(next > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  // ── Slide style ─────────────────────────────────────────────────────
  const slideStyle: React.CSSProperties = {
    animation: animating
      ? `${animDir === "forward" ? "slideOutLeft" : "slideOutRight"} 220ms cubic-bezier(.4,0,.2,1) both`
      : `${animDir === "forward" ? "slideInRight" : "slideInLeft"} 300ms cubic-bezier(.2,.7,.2,1) both`,
  };

  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleDemo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authApi.register({
        email: "demo@finmind.ai",
        full_name: "Demo Kullanıcı",
        monthly_income: 30000,
      });
      const userId = res.data.id;
      await transactionApi.seed(userId);
      await goalsApi.seed(userId);
      localStorage.setItem("finmind_user_id", userId);
      localStorage.setItem("finmind_mode", "demo");
      router.push("/dashboard");
    } catch {
      setError("Demo verisi yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep1 = () => {
    if (!form.full_name || !form.email || !form.monthly_income) {
      setError("Lütfen tüm alanları doldurun."); return;
    }
    setError(""); goTo(2);
  };

  const handleStep2 = () => {
    if (!transactions.some(t => t.description && t.amount)) {
      setError("En az bir harcama girin."); return;
    }
    setError(""); goTo(3);
  };

  const handleVisionFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setVisionFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      setVisionPreview(e.target?.result as string);
      setVisionState("preview");
    };
    reader.readAsDataURL(f);
  };

  const handleVisionExtract = async () => {
    if (!visionFile) return;
    setVisionState("loading"); setError("");
    try {
      const res = await visionApi.preview(visionFile);
      if (res.data.success && res.data.transactions.length > 0) {
        setTransactions(res.data.transactions.map((tx: any) => ({
          description: tx.description,
          amount: String(tx.amount),
          category: tx.category || "other",
        })));
        setVisionState("done"); setTxTab("manual");
      } else {
        setError(res.data.error || "Harcama tespit edilemedi. Farklı bir fotoğraf deneyin.");
        setVisionState("idle");
      }
    } catch {
      setError("Sunucu hatası. Tekrar deneyin."); setVisionState("idle");
    }
  };

  const handleFinish = async () => {
    setLoading(true); setError("");
    try {
      const userRes = await authApi.register({
        email: form.email,
        full_name: form.full_name,
        monthly_income: Number(form.monthly_income),
      });
      const userId = userRes.data.id;
      const now = new Date();
      for (const tx of transactions) {
        if (!tx.description || !tx.amount) continue;
        await transactionCreateApi.create({
          user_id: userId, amount: Number(tx.amount),
          category: tx.category, description: tx.description,
          transaction_date: now.toISOString(), is_income: false,
        });
      }
      if (goal.title && goal.target_amount) {
        await goalsApi.create({
          user_id: userId, title: goal.title,
          target_amount: Number(goal.target_amount),
        });
      }
      localStorage.setItem("finmind_user_id", userId);
      localStorage.setItem("finmind_mode", "personal");
      router.push("/dashboard");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const status = e?.response?.status;
      setError(detail || `Hata (${status || e?.message || "bilinmiyor"}). Lütfen tekrar deneyin.`);
      console.error("handleFinish error:", e?.response || e);
    } finally { setLoading(false); }
  };

  // ── Home ─────────────────────────────────────────────────────────────
  if (mode === "home") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#f59e0b 1px,transparent 1px),linear-gradient(90deg,#f59e0b 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 w-full max-w-md space-y-10 text-center animate-fade-up">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#f59e0b11] border border-[#f59e0b33] rounded-full px-4 py-1.5 text-xs text-[#f59e0b] font-medium tracking-widest uppercase mb-4">
              BTK Akademi Hackathon &apos;26
            </div>
            {/* C.03 — stroke-draw logo animasyonu */}
            <LogoSVG />
            <p className="text-[#8888a0] text-lg font-light leading-relaxed">
              Paranızı anlayan, büyütmenize yardım eden<br />yapay zeka finansal koçunuz
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: "⚡", text: "4 Uzman Ajan" },
              { icon: "🧬", text: "Finansal DNA" },
              { icon: "🏆", text: "Aylık Skor" },
              { icon: "🔮", text: "RAG Analiz" },
            ].map(f => (
              <span key={f.text}
                className="flex items-center gap-1.5 bg-[#16161f] border border-[#ffffff0f] rounded-full px-3 py-1.5 text-xs text-[#8888a0]">
                {f.icon} {f.text}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
            <button onClick={handleDemo} disabled={loading}
              className="group w-full relative overflow-hidden bg-[#f59e0b] disabled:opacity-70 text-black font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
              style={{ boxShadow: "0 0 40px #f59e0b33" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    style={{ animation: "spin 0.8s linear infinite" }} />
                  Demo yükleniyor...
                </span>
              ) : (
                <span className="flex flex-col">
                  <span className="text-base">🚀 Demo ile İncele</span>
                  <span className="text-xs font-normal opacity-70 mt-0.5">Hazır verilerle hemen başla — kayıt gerekmez</span>
                </span>
              )}
            </button>
            <button onClick={() => setMode("onboard")}
              className="w-full bg-[#16161f] hover:bg-[#1c1c28] border border-[#ffffff0f] hover:border-[#f59e0b33] text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <span className="flex flex-col">
                <span className="text-base">✨ Kendi Verilerimle Dene</span>
                <span className="text-xs font-normal text-[#8888a0] mt-0.5">Gerçek harcamalarınla kişisel analiz al</span>
              </span>
            </button>
          </div>

          <p className="text-[#44445a] text-xs">Powered by Gemini 2.5 · LangGraph · ChromaDB</p>
        </div>
      </main>
    );
  }

  // ── Onboarding ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#f59e0b 1px,transparent 1px),linear-gradient(90deg,#f59e0b 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-400 ${
                      step > i + 1 ? "bg-[#f59e0b] text-black" :
                      step === i + 1 ? "bg-[#f59e0b] text-black" :
                      "bg-[#16161f] border border-[#ffffff0f] text-[#44445a]"
                    }`}
                    style={{ boxShadow: step === i + 1 ? "0 0 16px #f59e0b44" : "none" }}
                  >
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block transition-colors duration-300 ${step === i + 1 ? "text-[#f59e0b]" : "text-[#44445a]"}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="flex-1 h-px relative overflow-hidden bg-[#ffffff0f]">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#f59e0b] transition-all duration-500"
                      style={{ width: step > i + 1 ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress percentage */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#44445a] uppercase tracking-widest">İlerleme</span>
            <span className="text-[10px] font-mono text-[#f59e0b]">%{pct}</span>
          </div>
          <div className="w-full h-0.5 bg-[#ffffff0f] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, boxShadow: "0 0 8px #f59e0b66" }}
            />
          </div>
        </div>

        {/* Form card with slide animation */}
        <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-7 overflow-hidden">
          <div style={slideStyle}>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Seni tanıyalım</h2>
                  <p className="text-sm text-[#8888a0] mt-1">Finansal DNA profilin için birkaç bilgi</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Adın Soyadın",      key: "full_name",       placeholder: "Ahmet Yılmaz",       type: "text" },
                    { label: "E-posta",            key: "email",           placeholder: "ahmet@example.com",  type: "email" },
                    { label: "Aylık Net Gelir (₺)", key: "monthly_income", placeholder: "25000",              type: "number" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-[#8888a0] mb-1.5 block tracking-wide">{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder} className={inputClass} />
                    </div>
                  ))}
                </div>
                {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleStep1}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01]">
                  Devam Et →
                </button>
                <button onClick={() => setMode("home")}
                  className="w-full text-[#44445a] text-sm hover:text-[#8888a0] transition-colors">
                  ← Geri dön
                </button>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Bu ayki harcamaların</h2>
                  <p className="text-sm text-[#8888a0] mt-1">Elle gir veya fatura fotoğrafından otomatik çıkar</p>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-1 bg-[#0d0d14] border border-[#ffffff0f] rounded-xl p-1">
                  <button onClick={() => setTxTab("manual")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      txTab === "manual" ? "bg-[#f59e0b] text-black" : "text-[#8888a0] hover:text-white"
                    }`}>
                    ✏️ Elle Gir
                  </button>
                  <button onClick={() => { setTxTab("photo"); setVisionState("idle"); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      txTab === "photo" ? "bg-[#f59e0b] text-black" : "text-[#8888a0] hover:text-white"
                    }`}>
                    📸 Fotoğraftan Çıkar
                  </button>
                </div>

                {/* Manuel giriş */}
                {txTab === "manual" && (
                  <div className="space-y-3">
                    {visionState === "done" && (
                      <div className="flex items-center gap-2 bg-[#10b98111] border border-[#10b98133] rounded-xl px-3 py-2">
                        <span className="text-green-400 text-xs">✓ Fotoğraftan {transactions.length} harcama aktarıldı — düzenleyebilirsin</span>
                      </div>
                    )}
                    {transactions.map((tx, i) => (
                      <div key={i} className="flex gap-2"
                        style={{ animation: `slideInRight ${180 + i * 60}ms cubic-bezier(.2,.7,.2,1) both` }}>
                        <input value={tx.description}
                          onChange={e => { const u = [...transactions]; u[i] = { ...u[i], description: e.target.value }; setTransactions(u); }}
                          placeholder="Migros market" className={`${inputClass} flex-1`} />
                        <input type="number" value={tx.amount}
                          onChange={e => { const u = [...transactions]; u[i] = { ...u[i], amount: e.target.value }; setTransactions(u); }}
                          placeholder="₺" className="w-20 bg-[#0d0d14] border border-[#ffffff0f] hover:border-[#f59e0b33] focus:border-[#f59e0b] focus:outline-none rounded-xl px-3 py-3 text-sm text-white placeholder-[#44445a] transition-colors font-mono" />
                        <select value={tx.category}
                          onChange={e => { const u = [...transactions]; u[i] = { ...u[i], category: e.target.value }; setTransactions(u); }}
                          className="bg-[#0d0d14] border border-[#ffffff0f] rounded-xl px-2 text-sm text-white focus:outline-none focus:border-[#f59e0b] transition-colors">
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    ))}
                    <button onClick={() => setTransactions([...transactions, { description: "", amount: "", category: "food" }])}
                      className="text-[#f59e0b] hover:text-[#f59e0b]/80 text-sm transition-colors flex items-center gap-1">
                      + Harcama ekle
                    </button>
                  </div>
                )}

                {/* Fotoğraftan çıkar */}
                {txTab === "photo" && (
                  <div className="space-y-4">
                    {visionState === "idle" && (
                      <div
                        onClick={() => photoInputRef.current?.click()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVisionFile(f); }}
                        onDragOver={e => e.preventDefault()}
                        className="border-2 border-dashed border-[#ffffff0f] hover:border-[#f59e0b44] rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 hover:bg-[#f59e0b04] group">
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                        <p className="text-white font-medium mb-1">Fatura veya fiş fotoğrafı yükle</p>
                        <p className="text-xs text-[#44445a]">Sürükle bırak veya tıkla · JPG, PNG, WEBP</p>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleVisionFile(e.target.files[0])} />
                      </div>
                    )}
                    {visionState === "preview" && (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-[#ffffff0f] max-h-48">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={visionPreview} alt="Önizleme" className="w-full object-contain max-h-48" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleVisionExtract}
                            className="flex-1 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold py-2.5 rounded-xl text-sm transition-all">
                            ✨ Harcamaları Çıkar
                          </button>
                          <button onClick={() => { setVisionState("idle"); setVisionPreview(""); setVisionFile(null); }}
                            className="bg-[#0d0d14] border border-[#ffffff0f] text-[#8888a0] px-4 py-2.5 rounded-xl text-sm hover:text-white transition-colors">
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                    {visionState === "loading" && (
                      <div className="text-center py-10 space-y-4">
                        <div className="relative w-12 h-12 mx-auto">
                          <div className="w-12 h-12 border-2 border-[#f59e0b22] rounded-full" />
                          <div className="absolute inset-0 border-2 border-[#f59e0b] border-t-transparent rounded-full"
                            style={{ animation: "spin 0.8s linear infinite" }} />
                        </div>
                        <p className="text-white text-sm font-medium">Gemini Vision analiz ediyor...</p>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {["Görüntü okunuyor", "Metin çıkarılıyor", "Kategorize ediliyor"].map((s, i) => (
                            <span key={s}
                              className="text-[10px] bg-[#f59e0b11] border border-[#f59e0b22] text-[#f59e0b] px-2.5 py-1 rounded-full"
                              style={{ animation: `fadeUp 0.4s ${i * 0.15}s ease both` }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleStep2}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01]">
                  Devam Et →
                </button>
                <button onClick={() => goTo(1)}
                  className="w-full text-[#44445a] text-sm hover:text-[#8888a0] transition-colors">
                  ← Geri
                </button>
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Bir hedef belirle</h2>
                  <p className="text-sm text-[#8888a0] mt-1">İsteğe bağlı — boş bırakabilirsin</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#8888a0] mb-1.5 block">Hedefiniz ne?</label>
                    <input value={goal.title} onChange={e => setGoal({ ...goal, title: e.target.value })}
                      placeholder="Yaz tatili, laptop, acil fon..." className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8888a0] mb-1.5 block">Hedef Tutar (₺)</label>
                    <input type="number" value={goal.target_amount}
                      onChange={e => setGoal({ ...goal, target_amount: e.target.value })}
                      placeholder="15000" className={`${inputClass} font-mono`} />
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={handleFinish} disabled={loading}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01]">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                        style={{ animation: "spin 0.8s linear infinite" }} />
                      Analiz hazırlanıyor...
                    </span>
                  ) : "🚀 Analizimi Göster"}
                </button>
                <button onClick={() => goTo(2)}
                  className="w-full text-[#44445a] text-sm hover:text-[#8888a0] transition-colors">
                  ← Geri
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
