"use client";
import { useState } from "react";

const TOPICS = [
  {
    id: "budget",
    icon: "📊",
    title: "Bütçe Yönetimi",
    level: "Başlangıç",
    color: "#10b981",
    description: "Gelirinizi kategorilere bölerek kontrollü harcama yapmayı öğrenin.",
    content: [
      {
        heading: "50/30/20 Kuralı",
        text: "Gelirinizin %50'si zorunlu giderler (kira, fatura, market), %30'u istekler (eğlence, yemek dışarıda), %20'si tasarruf ve yatırım için ayrılmalıdır. Türkiye'de yaşam maliyeti göz önüne alındığında bu oranlar %60/20/20 şeklinde uyarlanabilir.",
      },
      {
        heading: "Bütçe Nasıl Kurulur?",
        text: "1) Aylık net gelirinizi belirleyin. 2) Sabit giderlerinizi listeleyin (kira, faturalar). 3) Değişken giderleriniz için üst limit koyun. 4) Kalan tutarı tasarrufa ayırın. 5) Her ay sonunda gözden geçirin.",
      },
    ],
    quiz: [
      { q: "50/30/20 kuralında %20 neye ayrılır?", options: ["Yemek", "Tasarruf & Yatırım", "Eğlence", "Faturalar"], answer: 1 },
      { q: "Bütçe kurmanın ilk adımı nedir?", options: ["Harcama kesmek", "Kredi almak", "Net geliri belirlemek", "Yatırım yapmak"], answer: 2 },
    ],
  },
  {
    id: "inflation",
    icon: "📈",
    title: "Enflasyon & Para Değeri",
    level: "Orta",
    color: "#f59e0b",
    description: "Enflasyonun paranıza etkisini ve korunma yollarını anlayın.",
    content: [
      {
        heading: "Enflasyon Nedir?",
        text: "Enflasyon, fiyatlar genel düzeyinin sürekli artmasıdır. Yüksek enflasyon dönemlerinde nakitte tutulan para değer kaybeder. Örneğin %60 enflasyonda bu yıl 1000 ₺ olan bir ürün gelecek yıl 1600 ₺ olur.",
      },
      {
        heading: "Enflasyona Karşı Korunma",
        text: "Nakit yerine altın, döviz veya BIST endeks fonları (TEFAS üzerinden) değer koruma sağlar. Aylık harcama fazlasını TL mevduatta tutmak reel kayba yol açar. Enflasyon + 2 puan üzerinde getiri sağlayan araçları tercih edin.",
      },
    ],
    quiz: [
      { q: "%60 enflasyonda 1000 ₺'nin 1 yıl sonraki değeri nedir?", options: ["1000 ₺", "1600 ₺", "600 ₺", "2000 ₺"], answer: 1 },
      { q: "Enflasyona karşı en iyi koruma hangisidir?", options: ["Yastık altı para", "TL mevduat", "Altın & döviz", "Nakit"], answer: 2 },
    ],
  },
  {
    id: "credit",
    icon: "💳",
    title: "Kredi & Faiz",
    level: "Orta",
    color: "#8b5cf6",
    description: '"Kredi kartı asgari ödeme yaparsam ne olur?" gibi soruları cevaplayın.',
    content: [
      {
        heading: "Asgari Ödeme Tuzağı",
        text: "Kredi kartı borcunuzun sadece asgari tutarını öderseniz, kalan borç aylık %5-6 faizle büyür. 10.000 ₺ borç için sadece asgari ödeme yaparsanız bu borcu kapatmak yıllar alabilir ve ödediğiniz toplam tutar 3-4 katına çıkabilir.",
      },
      {
        heading: "Kredi Kullanım Oranı",
        text: "Kredi kartı limitinizin %30'undan fazlasını kullanmamaya çalışın. Yüksek kullanım oranı kredi notunuzu olumsuz etkiler ve gelecekte kredi almanızı güçleştirir.",
      },
    ],
    quiz: [
      { q: "Kredi kartında asgari ödeme yapmanın riski nedir?", options: ["Risk yok", "Borç faizle büyür", "Limit artar", "Puan kazanılır"], answer: 1 },
      { q: "Kredi kartı limitinin kaçta kaçı kullanılmalı?", options: ["%100", "%50", "%30'dan az", "%70"], answer: 2 },
    ],
  },
  {
    id: "investment",
    icon: "🏦",
    title: "Yatırım Araçları",
    level: "İleri",
    color: "#3b82f6",
    description: "Altın, borsa, fon gibi araçları karşılaştırın, doğru seçim yapın.",
    content: [
      {
        heading: "Yatırım Araçları Karşılaştırması",
        text: "Altın: Enflasyona karşı uzun vadeli koruma. Döviz: Kısa-orta vade değer koruma. BIST Hisse: Yüksek getiri potansiyeli, yüksek risk. TEFAS Fon: Çeşitlendirilmiş, düşük işlem maliyeti. Mevduat: Garantili ama enflasyon altında getiri.",
      },
      {
        heading: "Acil Fon Önce Gelir",
        text: "Yatırım yapmadan önce 3-6 aylık giderinizi karşılayacak acil fon oluşturun. Bu fonu likit ve güvenli bir araçta tutun. Acil fon olmadan yatırım yapmak, kriz anında zararına satışa zorlar.",
      },
    ],
    quiz: [
      { q: "Yatırımdan önce öncelik ne olmalıdır?", options: ["Hisse senedi", "Acil fon", "Kripto para", "Döviz"], answer: 1 },
      { q: "TEFAS ne işe yarar?", options: ["Kredi verir", "Sigorta sağlar", "Fonlara erişim sağlar", "Döviz satar"], answer: 2 },
    ],
  },
];

function QuizSection({ quiz }: { quiz: typeof TOPICS[0]["quiz"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? quiz.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#44445a] uppercase tracking-widest">Mini Quiz</p>
        {submitted && (
          <span className={`text-xs font-mono font-bold ${score === quiz.length ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
            {score}/{quiz.length} doğru
          </span>
        )}
      </div>
      {quiz.map((q, qi) => (
        <div key={qi} className="bg-[#0d0d14] rounded-xl p-4 space-y-3">
          <p className="text-sm text-white font-medium">{q.q}</p>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const correct = submitted && oi === q.answer;
              const wrong = submitted && selected && oi !== q.answer;
              return (
                <button key={oi}
                  onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })}
                  className={`text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                    correct ? "bg-[#10b98111] border-[#10b98144] text-[#10b981]" :
                    wrong ? "bg-red-400/10 border-red-400/30 text-red-400" :
                    selected ? "bg-[#f59e0b11] border-[#f59e0b44] text-[#f59e0b]" :
                    "bg-[#16161f] border-[#ffffff0f] text-[#8888a0] hover:border-[#f59e0b33] hover:text-white"
                  }`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
          className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:opacity-40 text-black font-semibold py-2.5 rounded-xl text-sm transition-all">
          Cevapları Kontrol Et
        </button>
      ) : (
        <button onClick={() => { setAnswers({}); setSubmitted(false); }}
          className="w-full bg-[#16161f] border border-[#ffffff0f] text-[#8888a0] hover:text-white py-2.5 rounded-xl text-sm transition-colors">
          Tekrar Dene
        </button>
      )}
    </div>
  );
}

export default function LiteracyPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const topic = TOPICS.find(t => t.id === selected);

  const levelColor: Record<string, string> = {
    "Başlangıç": "#10b981",
    "Orta": "#f59e0b",
    "İleri": "#ef4444",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {!selected ? (
        <>
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white">📚 Finansal Okuryazarlık</h2>
            <p className="text-xs text-[#44445a] mt-1">
              Finansal kavramları öğren, mini quizlerle pekiştir
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {TOPICS.map((t, i) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className="text-left bg-[#16161f] border border-[#ffffff0f] hover:border-[#f59e0b33] rounded-2xl p-5 transition-all duration-300 hover:bg-[#1c1c28] hover:scale-[1.01] group animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${t.color}18`, border: `1px solid ${t.color}33` }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{t.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{ color: levelColor[t.level], borderColor: `${levelColor[t.level]}44`, background: `${levelColor[t.level]}11` }}>
                        {t.level}
                      </span>
                    </div>
                    <p className="text-xs text-[#8888a0] leading-relaxed">{t.description}</p>
                    <p className="text-[10px] text-[#44445a] mt-2">{t.quiz.length} soruluk quiz →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : topic ? (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[#44445a] hover:text-[#f59e0b] text-sm transition-colors">
            ← Geri
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: `${topic.color}18`, border: `1px solid ${topic.color}33` }}>
              {topic.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
              <p className="text-xs text-[#8888a0] mt-0.5">{topic.description}</p>
            </div>
          </div>

          {topic.content.map((c, i) => (
            <div key={i} className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-2">
              <h3 className="font-semibold text-white">{c.heading}</h3>
              <p className="text-sm text-[#8888a0] leading-relaxed">{c.text}</p>
            </div>
          ))}

          <div className="bg-[#16161f] border border-[#f59e0b22] rounded-2xl p-5">
            <QuizSection quiz={topic.quiz} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
