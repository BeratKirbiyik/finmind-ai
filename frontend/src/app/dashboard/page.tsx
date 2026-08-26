"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import CountUp from "@/components/ui/CountUp";
import ScoreRing from "@/components/ui/ScoreRing";
import ConfettiCanvas from "@/components/ui/ConfettiCanvas";
import { SkeletonDashboard } from "@/components/ui/SkeletonCard";
import AddTransactionModal from "@/components/ui/AddTransactionModal";
import MonthlyChart from "@/components/ui/MonthlyChart";
import ForecastCard from "@/components/ui/ForecastCard";
import CarbonCard from "@/components/ui/CarbonCard";
import LiteracyPage from "./literacy/page";
import { analyticsApi, goalsApi } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const PIE_COLORS = ["#f59e0b","#8b5cf6","#3b82f6","#10b981","#ef4444","#ec4899"];

function StatCard({ label, value, rawValue, sub, trend, delay = "" }: {
  label: string; value: string; rawValue?: number; sub?: string;
  trend?: "up"|"down"|"neutral"; delay?: string;
}) {
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#8888a0";
  return (
    <div className="bg-[#16161f] border border-[#ffffff0f] hover:border-[#f59e0b33] rounded-2xl p-5 transition-all duration-300 hover:bg-[#1c1c28] animate-fade-up"
      style={{ animationDelay: delay }}>
      <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold text-white font-mono">
        {rawValue !== undefined
          ? <><CountUp value={rawValue} />{" ₺"}</>
          : value}
      </p>
      {sub && <p className="text-xs mt-1.5" style={{ color: trendColor }}>{sub}</p>}
    </div>
  );
}

function GoalCard({ goal, onDeposit }: { goal: any; onDeposit?: (id: string, amount: number) => Promise<void> }) {
  const [hovered, setHovered] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositInput, setDepositInput] = useState("");
  const [depositing, setDepositing] = useState(false);

  const urgent = goal.days_remaining !== null && goal.days_remaining < 30;
  const pct = Math.min(goal.progress_pct, 100);
  const isComplete = pct >= 100;
  const dailySaving = goal.days_remaining > 0
    ? Math.ceil((goal.target_amount - goal.current_amount) / goal.days_remaining)
    : 0;

  const handleDeposit = async () => {
    const amount = Number(depositInput);
    if (!amount || amount <= 0 || !onDeposit) return;
    setDepositing(true);
    await onDeposit(goal.id, amount);
    setDepositInput(""); setShowDeposit(false); setDepositing(false);
  };

  return (
    <div
      className="bg-[#16161f] border border-[#ffffff0f] hover:border-[#f59e0b22] rounded-xl p-4 transition-all duration-300 relative overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ transform: hovered ? "translateY(-2px)" : "translateY(0)", transition: "all 0.22s ease-out" }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{goal.title}</p>
          {goal.days_remaining !== null && (
            <p className={`text-xs mt-0.5 ${urgent ? "text-[#f59e0b]" : "text-[#44445a]"}`}>
              {goal.days_remaining} gün kaldı
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold" style={{ color: isComplete ? "#10b981" : pct >= 80 ? "#10b981" : "#f59e0b" }}>
            %{pct}
          </span>
          {onDeposit && !isComplete && (
            <button
              onClick={() => setShowDeposit(v => !v)}
              className="w-6 h-6 rounded-full bg-[#f59e0b11] border border-[#f59e0b33] text-[#f59e0b] text-xs flex items-center justify-center hover:bg-[#f59e0b22] transition-colors"
              title="Para Ekle"
            >+</button>
          )}
        </div>
      </div>

      {showDeposit && (
        <div className="flex gap-2 mb-3" style={{ animation: "wordIn 200ms ease both" }}>
          <input
            type="number"
            value={depositInput}
            onChange={e => setDepositInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleDeposit()}
            placeholder="Miktar (₺)"
            className="flex-1 bg-[#0d0d14] border border-[#f59e0b33] focus:border-[#f59e0b] focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#44445a] font-mono"
          />
          <button onClick={handleDeposit} disabled={depositing || !depositInput}
            className="bg-[#f59e0b] disabled:opacity-40 text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
            {depositing ? "..." : "Ekle"}
          </button>
        </div>
      )}

      <div className="w-full bg-[#0d0d14] rounded-full h-1.5 mb-3 overflow-hidden relative">
        <div className="h-1.5 rounded-full transition-all duration-700 relative"
          style={{
            width: `${pct}%`,
            background: isComplete
              ? "linear-gradient(90deg, #34d399, #10b981)"
              : "linear-gradient(90deg, #f59e0b, #f59e0b88)",
            boxShadow: isComplete ? "0 0 8px #10b98144" : "0 0 8px #f59e0b44",
          }}
        />
        {hovered && (
          <span className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "goal-complete-shine 1.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs font-mono text-[#44445a]">
        <span>{goal.current_amount.toLocaleString("tr-TR")} ₺</span>
        <span>{goal.target_amount.toLocaleString("tr-TR")} ₺</span>
      </div>
      {hovered && dailySaving > 0 && !isComplete && (
        <p className="text-[10px] text-[#f59e0b] mt-2"
          style={{ animation: "wordIn 200ms ease both" }}>
          💡 Hedefe ulaşmak için günde{" "}
          <span className="font-mono font-bold">
            {dailySaving.toLocaleString("tr-TR")} ₺
          </span>{" "}
          biriktir
        </p>
      )}
      {isComplete && (
        <p className="text-[10px] text-[#10b981] mt-2"
          style={{ animation: "wordIn 200ms ease both" }}>
          ✓ Hedefe ulaştın — yeni hedef belirle
        </p>
      )}
    </div>
  );
}

function DNACard({ dna }: { dna: any }) {
  if (!dna) return null;
  return (
    <div className="dna-border animate-fade-up-2">
      <div className="dna-border-inner p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{ background: dna.color, filter: "blur(40px)", transform: "translate(30%,-30%)" }}/>
        <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-3">
          🧬 Finansal DNA Profiliniz
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${dna.color}18`, border: `1px solid ${dna.color}33` }}>
            {dna.emoji}
          </div>
          <div>
            <p className="font-semibold text-white text-base">{dna.type}</p>
            <p className="text-xs text-[#8888a0] mt-0.5 leading-relaxed">{dna.description}</p>
          </div>
        </div>
        <div className="mt-4 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${dna.color}44, ${dna.color}11)` }}/>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c28] border border-[#f59e0b44] rounded-xl px-4 py-3 text-xs"
      style={{ backdropFilter: "blur(8px)", boxShadow: "0 0 20px rgba(245,158,11,0.12)" }}>
      <p className="text-[#8888a0] mb-1">{label}</p>
      <p className="text-white font-mono font-bold">{Number(payload[0].value).toLocaleString("tr-TR")} ₺</p>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [userId, setUserId] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [data, setData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [tab, setTab] = useState<"chat"|"analytics"|"literacy">("chat");
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("finmind_user_id");
    const mode = localStorage.getItem("finmind_mode");
    if (!id) { router.push("/"); return; }
    setUserId(id);
    setIsDemo(mode === "demo");
    Promise.all([analyticsApi.getDashboard(id), goalsApi.getAll(id)])
      .then(([d, g]) => {
        setData(d.data);
        setGoals(g.data);
        setLoading(false);
        // Trigger confetti if badges earned — E.01
        if (d.data?.monthly_score?.badges?.length > 0) {
          setTimeout(() => setShowConfetti(true), 900);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const s = data?.summary || {};
  const score = data?.monthly_score || {};
  const dna = data?.behavioral?.financial_dna;
  const monthly = data?.monthly_chart || [];
  const cats = data?.category_chart || [];

  const navItems = [
    { key: "chat", icon: "💬", label: "Asistan", shortLabel: "Asistan" },
    { key: "analytics", icon: "📊", label: "Dashboard", shortLabel: "Dashboard" },
    { key: "literacy", icon: "📚", label: "Finansal Okuryazarlık Köşesi", shortLabel: "Finans" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* DESKTOP Sidebar — mobilde gizli */}
      <aside className="sidebar-desktop w-56 shrink-0 flex-col border-r border-[#ffffff0f]"
        style={{ background: "var(--bg-surface)" }}>
        {/* Logo */}
        <div className="p-5 border-b border-[#ffffff0f]">
          <h1 className="text-xl font-bold">
            <span className="text-white">Fin</span>
            <span className="text-[#f59e0b]">Mind</span>
          </h1>
          <p className="text-[10px] text-[#44445a] mt-0.5 tracking-widest uppercase">AI Finance</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key as any)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left ${
                tab === item.key
                  ? "bg-[#f59e0b] text-black font-semibold"
                  : "text-[#8888a0] hover:bg-[#ffffff06] hover:text-white"
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Score */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {!loading && score.score !== undefined && (
            <>
              <div className="relative">
                <ScoreRing score={score.score} />
                <ConfettiCanvas trigger={showConfetti} />
              </div>
              {score.badges?.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5 w-full">
                  {score.badges.map((b: string, i: number) => (
                    <div key={b}
                      className="text-[10px] bg-[#f59e0b11] border border-[#f59e0b22] text-[#f59e0b] px-2.5 py-1.5 rounded-lg text-center animate-badge-in"
                      style={{ animationDelay: `${i * 120 + 800}ms` }}>
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-[#ffffff0f] space-y-1">
          {isDemo && (
            <div className="text-[10px] text-[#f59e0b] bg-[#f59e0b11] border border-[#f59e0b22] rounded-lg px-2.5 py-1.5 text-center">
              Demo Modu
            </div>
          )}
          <button onClick={toggle}
            className="w-full flex items-center justify-center gap-2 text-xs text-[#44445a] hover:text-[#8888a0] py-2 transition-colors rounded-lg hover:bg-[#ffffff06]">
            {theme === "dark" ? "☀️ Açık Mod" : "🌙 Koyu Mod"}
          </button>
          <button onClick={() => { localStorage.clear(); router.push("/"); }}
            className="w-full text-xs text-[#44445a] hover:text-[#8888a0] py-2 transition-colors text-center rounded-lg hover:bg-[#ffffff06]">
            ← Çıkış
          </button>
        </div>
      </aside>

      {/* MAIN content */}
      <main className="main-content flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* MOBİL Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#ffffff0f] shrink-0"
          style={{ background: "var(--bg-surface)" }}>
          <h1 className="text-lg font-bold">
            <span className="text-white">Fin</span>
            <span className="text-[#f59e0b]">Mind</span>
          </h1>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="text-[10px] text-[#f59e0b] bg-[#f59e0b11] border border-[#f59e0b22] rounded-full px-2 py-0.5">
                Demo
              </span>
            )}
            <button onClick={toggle}
              className="text-[#44445a] hover:text-[#f59e0b] text-lg transition-colors">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button onClick={() => { localStorage.clear(); router.push("/"); }}
              className="text-[10px] text-[#44445a] hover:text-[#8888a0] transition-colors">
              Çıkış
            </button>
          </div>
        </header>

        {tab === "chat" && (
          <>
            <header className="hidden md:flex shrink-0 border-b border-[#ffffff0f] px-6 py-4 items-center gap-3"
              style={{ background: "var(--bg-surface)" }}>
              <div>
                <h2 className="font-semibold text-white">Finansal Asistanınız</h2>
                <p className="text-xs text-[#44445a] mt-0.5">
                  4 uzman ajan · Gemini 2.5 · RAG destekli
                </p>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              {userId && <ChatInterface userId={userId} />}
            </div>
          </>
        )}

        {tab === "analytics" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {loading ? (
              <SkeletonDashboard />
            ) : (
              <>
                <div className="flex items-center justify-between animate-fade-up">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                    <p className="text-xs text-[#44445a] mt-0.5">Son 30 günlük finansal özet</p>
                  </div>
                  <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.01]">
                    <span>+</span> Harcama Ekle
                  </button>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <StatCard label="Bu Ay Harcama"
                    rawValue={s.total_spent_this_month ?? 0}
                    value=""
                    sub={`${s.transaction_count ?? 0} işlem`} trend="down" delay="0.05s"/>
                  <StatCard label="Geçen Ay"
                    rawValue={s.total_spent_prev_month ?? 0}
                    value=""
                    sub={s.monthly_change_pct !== 0 ? `${s.monthly_change_pct > 0 ? "+" : ""}${s.monthly_change_pct}% değişim` : "İlk ay"}
                    trend={s.monthly_change_pct > 0 ? "down" : "up"} delay="0.1s"/>
                  <StatCard label="Aylık Gelir"
                    rawValue={s.monthly_income ?? 0}
                    value=""
                    delay="0.15s"/>
                  <StatCard label="Aylık Tasarruf"
                    rawValue={s.savings_this_month ?? 0}
                    value=""
                    sub={`%${s.savings_rate_pct ?? 0} oran`} trend="up" delay="0.2s"/>
                </div>

                {dna && <DNACard dna={dna} />}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 animate-fade-up-3">
                    <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-4">Aylık Harcama Trendi</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={monthly} barSize={28}>
                        <XAxis dataKey="month" tick={{ fill: "#44445a", fontSize: 11, fontFamily: "Outfit" }}
                          axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill: "#44445a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                          tickFormatter={v => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.04)" }}/>
                        <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]}
                          style={{ filter: "drop-shadow(0 0 6px #f59e0b44)" }}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 animate-fade-up-4">
                    <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-4">Kategori Dağılımı</p>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="50%" height={160}>
                        <PieChart>
                          <Pie data={cats} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                            dataKey="value" paddingAngle={3}>
                            {cats.map((_: any, i: number) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                                style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS[i % PIE_COLORS.length]}66)` }}/>
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "#1c1c28", border: "1px solid #f59e0b33", borderRadius: 12, backdropFilter: "blur(8px)" }}
                            formatter={(v: any) => [`${Number(v).toLocaleString("tr-TR")} ₺`]}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        {cats.slice(0, 5).map((c: any, i: number) => (
                          <div key={c.key} className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                            <span className="text-xs text-[#8888a0] flex-1 truncate">{c.name}</span>
                            <span className="text-xs font-mono text-[#f0f0f5] shrink-0">
                              {c.value.toLocaleString("tr-TR")} ₺
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <MonthlyChart userId={userId} />
                <ForecastCard userId={userId} isDemo={isDemo} />

                {goals.length > 0 && (
                  <div className="animate-fade-up">
                    <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-3">🎯 Finansal Hedefler</p>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                      {goals.map(g => (
                        <GoalCard key={g.id} goal={g} onDeposit={async (id, amount) => {
                          await goalsApi.deposit(id, amount);
                          goalsApi.getAll(userId).then(r => setGoals(r.data));
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <CarbonCard userId={userId} isDemo={isDemo} />
              </>
            )}
          </div>
        )}

        {tab === "literacy" && (
          <LiteracyPage />
        )}
      </main>

      {/* MOBİL Bottom Navigation */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-[#ffffff0f] px-2 py-2"
        style={{ background: "var(--bg-surface)" }}>
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                tab === item.key
                  ? "text-[#f59e0b]"
                  : "text-[#44445a] hover:text-[#8888a0]"
              }`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.shortLabel}</span>
              {tab === item.key && (
                <div className="w-1 h-1 rounded-full bg-[#f59e0b]"/>
              )}
            </button>
          ))}
        </div>
      </nav>

      {showAddModal && (
        <AddTransactionModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            analyticsApi.getDashboard(userId).then(d => setData(d.data));
            goalsApi.getAll(userId).then(g => setGoals(g.data));
          }}
        />
      )}
    </div>
  );
}
