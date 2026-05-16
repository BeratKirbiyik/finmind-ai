"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { transactionApi } from "@/lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c28] border border-[#f59e0b44] rounded-xl px-4 py-3 text-xs"
      style={{ backdropFilter: "blur(8px)", boxShadow: "0 0 20px rgba(245,158,11,0.12)" }}>
      <p className="text-[#8888a0] mb-1">{label}</p>
      <p className="text-white font-mono font-bold">
        {Number(payload[0].value).toLocaleString("tr-TR")} ₺
      </p>
      {payload[0].payload.count && (
        <p className="text-[#44445a] mt-0.5">{payload[0].payload.count} işlem</p>
      )}
    </div>
  );
};

export default function MonthlyChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    transactionApi.getMonthlySummary(userId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5">
      <div className="h-3 w-40 rounded-full bg-[#ffffff08] shimmer mb-4" />
      <div className="h-40 w-full rounded-xl bg-[#ffffff05] shimmer" />
    </div>
  );

  if (data.length === 0) return null;

  const max = Math.max(...data.map(d => d.total));

  return (
    <div className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5">
      <p className="text-[10px] text-[#44445a] uppercase tracking-widest mb-4">
        Aylık Harcama Karşılaştırması
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="label"
            tick={{ fill: "#44445a", fontSize: 10, fontFamily: "Outfit" }}
            axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#44445a", fontSize: 10, fontFamily: "JetBrains Mono" }}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            axisLine={false} tickLine={false} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(245,158,11,0.04)" }}
            wrapperStyle={{ outline: "none" }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i}
                fill={entry.total === max ? "#f59e0b" : "#f59e0b33"}
                style={{ filter: entry.total === max ? "drop-shadow(0 0 8px #f59e0b44)" : "none" }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-[#44445a] mt-2 text-center">
        En yüksek harcama ayı amber ile gösterilir
      </p>
    </div>
  );
}
