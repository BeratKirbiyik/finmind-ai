"use client";
import { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";

interface CarbonData {
  total_co2_kg: number;
  transport_co2_kg: number;
  food_co2_kg: number;
  turkey_avg_kg: number;
  comparison_pct: number;
  trees_needed: number;
  level: string;
  level_color: string;
  tips: string[];
  period: string;
}

export default function CarbonCard({ userId }: { userId: string }) {
  const [data, setData] = useState<CarbonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    analyticsApi.getCarbon(userId)
      .then(r => { setData(r.data.carbon); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-3">
      <div className="h-3 w-32 rounded-full bg-[#ffffff08] shimmer"/>
      <div className="h-6 w-24 rounded-lg bg-[#ffffff08] shimmer"/>
      <div className="h-3 w-full rounded-full bg-[#ffffff05] shimmer"/>
    </div>
  );

  if (!data) return null;

  const bars = [
    { label: "Ulaşım", value: data.transport_co2_kg, color: "#8b5cf6", icon: "🚗" },
    { label: "Yemek", value: data.food_co2_kg, color: "#f59e0b", icon: "🍔" },
  ];
  const maxBar = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-5 animate-fade-up-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-1">
            🌱 Karbon Ayak İzi
          </p>
          <p className="text-[10px] text-[#44445a]">{data.period}</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full border"
          style={{
            color: data.level_color,
            borderColor: `${data.level_color}44`,
            background: `${data.level_color}11`
          }}>
          {data.level} seviye
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <span className="text-3xl font-bold font-mono text-white">
            {data.total_co2_kg}
          </span>
          <span className="text-sm text-[#8888a0] ml-1">kg CO₂</span>
        </div>
        <div className="text-xs text-[#44445a] mb-1">
          Türkiye ort. {data.turkey_avg_kg} kg
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[#44445a]">
          <span>Türkiye ortalamasına oranınız</span>
          <span style={{ color: data.level_color }}>%{data.comparison_pct}</span>
        </div>
        <div className="w-full h-2 bg-[#0d0d14] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(data.comparison_pct, 100)}%`,
              background: data.level_color,
              boxShadow: `0 0 8px ${data.level_color}66`
            }}/>
        </div>
      </div>

      <div className="space-y-2">
        {bars.map(bar => (
          <div key={bar.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#8888a0]">{bar.icon} {bar.label}</span>
              <span className="font-mono text-white">{bar.value} kg</span>
            </div>
            <div className="w-full h-1.5 bg-[#0d0d14] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(bar.value / maxBar) * 100}%`,
                  background: bar.color
                }}/>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#10b98111] border border-[#10b98122] rounded-xl px-4 py-3">
        <p className="text-xs text-[#10b981] flex items-center gap-2">
          <span>🌳</span>
          <span>Bu karbon miktarını dengelemek için yılda
            <span className="font-mono font-bold mx-1">{data.trees_needed}</span>
            ağaç gerekir
          </span>
        </p>
      </div>

      <div className="space-y-2">
        {data.tips.map((tip, i) => (
          <p key={i} className="text-xs text-[#8888a0] flex items-start gap-1.5">
            <span className="text-[#10b981] shrink-0">→</span>
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}
