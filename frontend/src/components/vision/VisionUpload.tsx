"use client";
import { useState, useRef } from "react";
import { visionApi, transactionApi } from "@/lib/api";

interface ExtractedTx {
  description: string;
  amount: number;
  category: string;
  merchant: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "🍔 Yemek", transport: "🚌 Ulaşım", shopping: "🛍️ Alışveriş",
  bills: "📄 Faturalar", entertainment: "🎬 Eğlence",
  health: "💊 Sağlık", education: "📚 Eğitim", other: "📦 Diğer",
};

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

export default function VisionUpload({ userId, onSuccess }: {
  userId: string;
  onSuccess?: (count: number) => void;
}) {
  const [state, setState] = useState<"idle" | "preview" | "loading" | "review" | "saving" | "done" | "error">("idle");
  const [imgPreview, setImgPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ transactions: ExtractedTx[]; confidence: string; note: string } | null>(null);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen bir görüntü dosyası seçin.");
      setState("error");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      setImgPreview(e.target?.result as string);
      setState("preview");
    };
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    setState("loading");
    try {
      const res = await visionApi.extract(file, userId, selectedMonth);
      if (res.data.success) {
        setResult(res.data);
        setState("review");
      } else {
        setError(res.data.error || "Analiz başarısız.");
        setState("error");
      }
    } catch {
      setError("Sunucu hatası. Tekrar deneyin.");
      setState("error");
    }
  };

  const handleConfirm = async () => {
    if (!result || result.transactions.length === 0) return;
    setState("saving");
    try {
      await transactionApi.addBulk(userId, result.transactions, selectedMonth);
      setState("done");
      setTimeout(() => onSuccess?.(result.transactions.length), 900);
    } catch {
      setError("Kayıt sırasında hata oluştu.");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle"); setImgPreview(""); setFile(null);
    setResult(null); setError("");
  };

  const MonthPicker = () => (
    <div className="mb-4">
      <label className="text-xs text-[#8888a0] mb-2 block uppercase tracking-widest">
        Hangi aya ait?
      </label>
      <div className="flex gap-2 flex-wrap">
        {MONTHS.map(m => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
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
  );

  const confidenceColor = result?.confidence === "high"
    ? "#10b981" : result?.confidence === "medium"
    ? "#f59e0b" : "#ef4444";

  const confidenceLabel = result?.confidence === "high" ? "Yüksek"
    : result?.confidence === "medium" ? "Orta" : "Düşük";

  return (
    <div className="space-y-4">

      {state === "idle" && (
        <>
          <MonthPicker />
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-[#ffffff0f] hover:border-[#f59e0b44] rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 hover:bg-[#f59e0b04] group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</div>
            <p className="text-white font-medium mb-1">Fatura veya defter fotoğrafı yükle</p>
            <p className="text-xs text-[#44445a]">Sürükle bırak veya tıkla · JPG, PNG, WEBP</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </>
      )}

      {state === "preview" && (
        <div className="space-y-4">
          <MonthPicker />
          <div className="relative rounded-2xl overflow-hidden border border-[#ffffff0f] max-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgPreview} alt="Önizleme" className="w-full object-contain max-h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f88] to-transparent" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleExtract}
              className="flex-1 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold py-3 rounded-xl transition-all hover:scale-[1.01] text-sm">
              ✨ Harcamaları Analiz Et
            </button>
            <button onClick={reset}
              className="bg-[#16161f] border border-[#ffffff0f] text-[#8888a0] px-4 py-3 rounded-xl text-sm hover:text-white transition-colors">
              İptal
            </button>
          </div>
        </div>
      )}

      {state === "loading" && (
        <div className="text-center py-12 space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-2 border-[#f59e0b22] rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-[#f59e0b] border-t-transparent rounded-full"
              style={{ animation: "spin 0.8s linear infinite" }} />
          </div>
          <div>
            <p className="text-white font-medium">Gemini Vision analiz ediyor...</p>
            <p className="text-xs text-[#44445a] mt-1">Harcamalar tespit ediliyor</p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {["Görüntü okunuyor", "Metin çıkarılıyor", "Kategorize ediliyor"].map((s, i) => (
              <span key={s} className="text-[10px] bg-[#f59e0b11] border border-[#f59e0b22] text-[#f59e0b] px-2.5 py-1 rounded-full"
                style={{ animation: `fadeUp 0.4s ${i * 0.15}s ease both` }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {state === "review" && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">
                {result.transactions.length} harcama tespit edildi
              </p>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: confidenceColor }}>
                ● {confidenceLabel} güven
              </span>
            </div>
            <span className="text-[10px] bg-[#f59e0b11] border border-[#f59e0b33] text-[#f59e0b] px-2.5 py-1 rounded-full">
              İnceleme gerekiyor
            </span>
          </div>

          {result.transactions.length === 0 ? (
            <div className="bg-[#16161f] border border-[#ffffff0f] rounded-xl p-4 text-center">
              <p className="text-[#8888a0] text-sm">Harcama tespit edilemedi.</p>
              <p className="text-xs text-[#44445a] mt-1">Daha net bir fotoğraf deneyin.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {result.transactions.map((tx, i) => (
                <div key={i} className="bg-[#0d0d14] border border-[#ffffff0f] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">{CATEGORY_LABELS[tx.category]?.split(" ")[0] || "📦"}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{tx.description}</p>
                      {tx.merchant && <p className="text-xs text-[#44445a] truncate">{tx.merchant}</p>}
                      <p className="text-[10px] text-[#44445a]">{CATEGORY_LABELS[tx.category] || tx.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#f59e0b] shrink-0">
                    {tx.amount.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              ))}
            </div>
          )}

          {result.note && (
            <p className="text-xs text-[#44445a] bg-[#16161f] rounded-xl px-4 py-3 border border-[#ffffff0f]">
              💡 {result.note}
            </p>
          )}

          {result.transactions.length > 0 && (
            <div className="flex gap-3 pt-1">
              <button onClick={reset}
                className="flex-1 bg-[#0d0d14] border border-[#ffffff0f] hover:border-[#ffffff1a] text-[#8888a0] hover:text-white font-medium py-3 rounded-xl text-sm transition-colors">
                Yeni Fotoğraf
              </button>
              <button onClick={handleConfirm}
                className="flex-1 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-semibold py-3 rounded-xl text-sm transition-all hover:scale-[1.01]">
                ✓ Onayla ve Kaydet
              </button>
            </div>
          )}
          {result.transactions.length === 0 && (
            <button onClick={reset}
              className="w-full bg-[#0d0d14] border border-[#ffffff0f] text-white py-2.5 rounded-xl text-sm hover:border-[#f59e0b33] transition-colors">
              Yeni Fotoğraf Dene
            </button>
          )}
        </div>
      )}

      {state === "saving" && (
        <div className="text-center py-10 space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <div className="w-12 h-12 border-2 border-[#f59e0b22] rounded-full" />
            <div className="absolute inset-0 border-2 border-[#f59e0b] border-t-transparent rounded-full"
              style={{ animation: "spin 0.8s linear infinite" }} />
          </div>
          <p className="text-white text-sm font-medium">Harcamalar kaydediliyor...</p>
        </div>
      )}

      {state === "done" && (
        <div className="text-center py-10 space-y-3">
          <div className="text-4xl">✅</div>
          <p className="text-white font-semibold">Harcamalar kaydedildi!</p>
          <p className="text-xs text-[#44445a]">Dashboard güncelleniyor...</p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
          <button onClick={reset}
            className="w-full bg-[#16161f] border border-[#ffffff0f] text-white py-2.5 rounded-xl text-sm hover:border-[#f59e0b33] transition-colors">
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}
