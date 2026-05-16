"use client";
import { useState } from "react";
import { transactionApi } from "@/lib/api";
import VisionUpload from "@/components/vision/VisionUpload";

const CATEGORIES = [
  { value: "food", label: "🍔 Yemek" },
  { value: "transport", label: "🚌 Ulaşım" },
  { value: "shopping", label: "🛍️ Alışveriş" },
  { value: "bills", label: "📄 Faturalar" },
  { value: "entertainment", label: "🎬 Eğlence" },
  { value: "health", label: "💊 Sağlık" },
  { value: "education", label: "📚 Eğitim" },
  { value: "other", label: "📦 Diğer" },
];

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const labels = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return {
    value: `${y}-${m}`,
    label: `${labels[d.getMonth() + 1]} ${y}`,
  };
});

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ userId, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"manuel" | "foto">("manuel");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  const [rows, setRows] = useState([
    { description: "", amount: "", category: "food", is_income: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inputClass = `bg-[#0d0d14] border border-[#ffffff0f] hover:border-[#f59e0b33]
    focus:border-[#f59e0b] focus:outline-none rounded-lg px-3 py-2 text-sm text-white
    placeholder-[#44445a] transition-all duration-200 w-full`;

  const addRow = () => setRows([...rows, { description: "", amount: "", category: "food", is_income: false }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: string, val: any) => {
    const u = [...rows]; (u[i] as any)[key] = val; setRows(u);
  };

  const handleSave = async () => {
    const valid = rows.filter(r => r.description && r.amount && Number(r.amount) > 0);
    if (valid.length === 0) { setError("En az bir geçerli harcama girin."); return; }
    setLoading(true); setError("");
    try {
      await transactionApi.addBulk(userId, valid, selectedMonth);
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch {
      setError("Kaydedilemedi. Tekrar deneyin.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-[#16161f] border border-[#ffffff0f] rounded-2xl overflow-hidden"
        style={{ animation: "slideInRight 280ms cubic-bezier(.2,.7,.2,1) both" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff0f]">
          <div>
            <h3 className="font-semibold text-white">Harcama Ekle</h3>
            <p className="text-xs text-[#44445a] mt-0.5">Manuel giriş veya fotoğraf ile</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#ffffff06] hover:bg-[#ffffff0f] text-[#8888a0] flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 mx-6 mt-4 bg-[#0d0d14] p-1 rounded-xl">
          <button
            onClick={() => setMode("manuel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "manuel"
                ? "bg-[#f59e0b] text-black"
                : "text-[#8888a0] hover:text-white"
            }`}>
            ✏️ Manuel Giriş
          </button>
          <button
            onClick={() => setMode("foto")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "foto"
                ? "bg-[#f59e0b] text-black"
                : "text-[#8888a0] hover:text-white"
            }`}>
            📸 Fotoğraf ile
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {mode === "manuel" ? (
            <>
              {/* Ay seçimi */}
              <div>
                <label className="text-xs text-[#8888a0] mb-2 block uppercase tracking-widest">Hangi ay?</label>
                <div className="flex gap-2 flex-wrap">
                  {MONTHS.map(m => (
                    <button key={m.value} onClick={() => setSelectedMonth(m.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedMonth === m.value
                          ? "bg-[#f59e0b] text-black"
                          : "bg-[#0d0d14] border border-[#ffffff0f] text-[#8888a0] hover:border-[#f59e0b33]"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Harcama satırları */}
              <div>
                <label className="text-xs text-[#8888a0] mb-2 block uppercase tracking-widest">Harcamalar</label>
                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center"
                      style={{ animation: `slideInRight ${200 + i * 40}ms cubic-bezier(.2,.7,.2,1) both` }}>
                      <input value={row.description}
                        onChange={e => updateRow(i, "description", e.target.value)}
                        placeholder="Açıklama" className={`${inputClass} flex-1`} />
                      <input type="number" value={row.amount}
                        onChange={e => updateRow(i, "amount", e.target.value)}
                        placeholder="₺" className="bg-[#0d0d14] border border-[#ffffff0f] hover:border-[#f59e0b33] focus:border-[#f59e0b] focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-[#44445a] transition-all w-24 font-mono" />
                      <select value={row.category}
                        onChange={e => updateRow(i, "category", e.target.value)}
                        className="bg-[#0d0d14] border border-[#ffffff0f] rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b] transition-colors">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <button onClick={() => updateRow(i, "is_income", !row.is_income)}
                        className={`px-2 py-2 rounded-lg text-xs transition-colors border ${
                          row.is_income
                            ? "bg-[#10b98111] border-[#10b98144] text-[#10b981]"
                            : "bg-[#ffffff05] border-[#ffffff0f] text-[#44445a]"
                        }`}>
                        {row.is_income ? "Gelir" : "Gider"}
                      </button>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(i)}
                          className="text-[#44445a] hover:text-red-400 transition-colors text-lg">×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addRow}
                  className="mt-2 text-[#f59e0b] hover:text-[#f59e0b]/80 text-sm transition-colors flex items-center gap-1">
                  + Satır ekle
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </>
          ) : (
            <VisionUpload
              userId={userId}
              onSuccess={(count) => {
                setTimeout(() => { onSuccess(); onClose(); }, 1400);
              }}
            />
          )}
        </div>

        {/* Footer — sadece manuel modda göster */}
        {mode === "manuel" && (
          <div className="px-6 py-4 border-t border-[#ffffff0f] flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-[#0d0d14] border border-[#ffffff0f] text-[#8888a0] py-3 rounded-xl text-sm hover:text-white transition-colors">
              İptal
            </button>
            <button onClick={handleSave} disabled={loading || done}
              className="flex-1 bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:opacity-50 text-black font-semibold py-3 rounded-xl text-sm transition-all">
              {done ? "✓ Kaydedildi" : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    style={{ animation: "spin 0.8s linear infinite" }} />
                  Kaydediliyor...
                </span>
              ) : "Kaydet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
