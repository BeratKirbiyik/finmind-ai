"use client";
import { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";
import CountUp from "./CountUp";

interface ForecastData {
  next_month: string;
  predicted_amount: number;
  confidence: string;
  trend: string;
  insight: string;
  warning: string | null;
  saving_tip: string;
  historical: { month: string; total: number }[];
}

export default function ForecastCard({ userId }: { userId: string }) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    analyticsApi.getForecast(userId)
      .then(r => { setData(r.data.forecast); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const confidenceLabel: Record<string, string> = {
    high: "Yüksek güven", medium: "Orta güven", low: "Düşük güven"
  };
  const confidenceColor: Record<string, string> = {
    high: "#10b981", medium: "#f59e0b", low: "#ef4444"
  };
  const trendIcon: Record<string, string> = {
    increasing: "↑", decreasing: "↓", stable: "→"
  };
  const trendColor: Record<string, string> = {
    increasing: "#ef4444", decreasing: "#10b981", stable: "#f59e0b"
  };

  const months_tr: Record<string, string> = {
    "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
    "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
    "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara"
  };

  if (loading) return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-3">
      <div className="h-3 w-40 rounded-full bg-[#ffffff08] shimmer"/>
      <div className="h-8 w-48 rounded-lg bg-[#ffffff08] shimmer"/>
      <div className="h-3 w-full rounded-full bg-[#ffffff05] shimmer"/>
    </div>
  );

  if (!data) return null;

  const maxBar = Math.max(...data.historical.map(h => h.total), data.predicted_amount);

  return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-5 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-1">
            🔮 Gelecek Ay Tahmini
          </p>
          <p className="text-sm text-[#8888a0]">{data.next_month}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full border"
            style={{
              color: confidenceColor[data.confidence],
              borderColor: `${confidenceColor[data.confidence]}44`,
              background: `${confidenceColor[data.confidence]}11`
            }}>
            {confidenceLabel[data.confidence]}
          </span>
          <span className="text-lg font-bold"
            style={{ color: trendColor[data.trend] }}>
            {trendIcon[data.trend]}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold font-mono text-white">
          <CountUp value={data.predicted_amount} suffix=" ₺" duration={1000}/>
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-[#44445a] uppercase tracking-widest">Trend</p>
        <div className="flex items-end gap-2 h-16">
          {data.historical.map((h, i) => {
            const pct = (h.total / maxBar) * 100;
            const monthKey = h.month.split("-")[1];
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-t-md transition-all duration-700"
                  style={{ height: `${pct}%`, background: "#f59e0b33", minHeight: "4px" }}/>
                <span className="text-[9px] text-[#44445a]">
                  {months_tr[monthKey] || monthKey}
                </span>
              </div>
            );
          })}
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full rounded-t-md transition-all duration-700 relative"
              style={{
                height: `${(data.predicted_amount / maxBar) * 100}%`,
                background: "linear-gradient(180deg, #f59e0b, #f59e0b88)",
                minHeight: "4px",
                boxShadow: "0 0 12px #f59e0b44"
              }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-[#f59e0b] whitespace-nowrap">
                tahmin
              </div>
            </div>
            <span className="text-[9px] text-[#f59e0b] font-medium">
              {data.next_month.split(" ")[0].slice(0, 3)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0d14] rounded-xl px-4 py-3 space-y-2">
        <p className="text-xs text-[#8888a0] leading-relaxed">{data.insight}</p>
        {data.saving_tip && (
          <p className="text-xs text-[#f59e0b] flex items-start gap-1.5">
            <span className="shrink-0">💡</span>
            {data.saving_tip}
          </p>
        )}
      </div>

      {data.warning && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <p className="text-xs text-red-400 flex items-start gap-1.5">
            <span>⚠️</span> {data.warning}
          </p>
        </div>
      )}
    </div>
  );
}
