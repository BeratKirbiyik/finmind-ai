"use client";
import { useState, useMemo } from "react";

const ALL_QUESTIONS = [
  // BÜTÇE YÖNETİMİ
  { topic: "budget", q: "50/30/20 kuralında %20 neye ayrılır?", options: ["Yemek", "Tasarruf & Yatırım", "Eğlence", "Faturalar"], answer: 1 },
  { topic: "budget", q: "Bütçe kurmanın ilk adımı nedir?", options: ["Harcama kesmek", "Kredi almak", "Net geliri belirlemek", "Yatırım yapmak"], answer: 2 },
  { topic: "budget", q: "Değişken gider hangisidir?", options: ["Kira", "Elektrik faturası", "Kredi taksiti", "Yemek harcaması"], answer: 3 },
  { topic: "budget", q: "Aylık bütçe açığı ne anlama gelir?", options: ["Gelir > Gider", "Gider > Gelir", "Gelir = Gider", "Tasarruf arttı"], answer: 1 },
  { topic: "budget", q: "Sıfır tabanlı bütçeleme nedir?", options: ["Hiç harcamamak", "Her kuruşu planlamak", "Sadece sabit giderleri ödemek", "Kredi kullanmak"], answer: 1 },
  { topic: "budget", q: "Hangi harcama zorunlu gider değildir?", options: ["Kira", "Market", "Sinema", "Elektrik"], answer: 2 },
  { topic: "budget", q: "Acil fon ne kadar olmalıdır?", options: ["1 aylık gider", "3-6 aylık gider", "1 yıllık gider", "Maaşın %10'u"], answer: 1 },
  { topic: "budget", q: "Otomatik tasarruf ne işe yarar?", options: ["Harcamayı artırır", "Tasarrufu zorlaştırır", "Maaş gelince otomatik biriktirir", "Kredi öder"], answer: 2 },
  { topic: "budget", q: "Hangi strateji bütçeye en çok zarar verir?", options: ["Otomatik ödeme", "Anlık alışveriş", "Liste ile alışveriş", "Nakit kullanmak"], answer: 1 },
  { topic: "budget", q: "'Kalan parayı biriktiririm' yaklaşımı neden başarısız olur?", options: ["Zor olduğu için", "Genellikle kalan para olmadığı için", "Banka izin vermez", "Yasal değil"], answer: 1 },
  { topic: "budget", q: "Abonelik denetimi neden önemlidir?", options: ["Daha fazla abonelik almak için", "Kullanılmayan abonelikleri kesmek için", "Kredi puanı için", "Vergi avantajı için"], answer: 1 },
  { topic: "budget", q: "Hangi ödeme yöntemi harcamayı en çok artırır?", options: ["Nakit", "Kredi kartı", "Banka kartı", "Havale"], answer: 1 },
  { topic: "budget", q: "Bütçe takibinde en önemli alışkanlık nedir?", options: ["Her gün kontrol etmek", "Sadece ay sonunda bakmak", "Hiç bakmamak", "Yılda bir kontrol"], answer: 0 },

  // ENFLASYON
  { topic: "inflation", q: "%60 enflasyonda 1000 ₺'nin 1 yıl sonraki değeri nedir?", options: ["1000 ₺", "1600 ₺", "600 ₺", "2000 ₺"], answer: 1 },
  { topic: "inflation", q: "Enflasyona karşı en iyi koruma hangisidir?", options: ["Yastık altı para", "TL mevduat", "Altın & döviz", "Nakit"], answer: 2 },
  { topic: "inflation", q: "Enflasyon nedir?", options: ["Para değerinin artması", "Fiyatlar genel düzeyinin artması", "Faiz oranının düşmesi", "İşsizliğin azalması"], answer: 1 },
  { topic: "inflation", q: "Enflasyon yüksekken nakit tutmak ne anlama gelir?", options: ["Değer kazanmak", "Reel kayıp yaşamak", "Faiz almak", "Risk almamak"], answer: 1 },
  { topic: "inflation", q: "TÜFE neyi ölçer?", options: ["İşsizlik oranını", "Tüketici fiyat endeksini", "Dolar kurunu", "Borsa endeksini"], answer: 1 },
  { topic: "inflation", q: "Stagflasyon ne demektir?", options: ["Düşük enflasyon + büyüme", "Yüksek enflasyon + durgunluk", "Sıfır enflasyon", "Deflasyon"], answer: 1 },
  { topic: "inflation", q: "Deflasyon nedir?", options: ["Fiyatların genel olarak düşmesi", "Fiyatların artması", "Para arzının artması", "İhracatın azalması"], answer: 0 },
  { topic: "inflation", q: "Enflasyon döneminde hangi varlık değer korur?", options: ["TL mevduat", "Tahvil", "Altın", "Nakit"], answer: 2 },
  { topic: "inflation", q: "Reel faiz nedir?", options: ["Nominal faiz", "Nominal faiz - Enflasyon", "Enflasyon + Faiz", "Merkez bankası faizi"], answer: 1 },
  { topic: "inflation", q: "Türkiye'de enflasyonla mücadelede hangi kurum faiz kararı alır?", options: ["Hazine", "BDDK", "TCMB", "SPK"], answer: 2 },

  // KREDİ & FAİZ
  { topic: "credit", q: "Kredi kartında asgari ödeme yapmanın riski nedir?", options: ["Risk yok", "Borç faizle büyür", "Limit artar", "Puan kazanılır"], answer: 1 },
  { topic: "credit", q: "Kredi kartı limitinin kaçta kaçı kullanılmalı?", options: ["%100", "%50", "%30'dan az", "%70"], answer: 2 },
  { topic: "credit", q: "Kredi notu neyi etkiler?", options: ["Sadece kredi faizini", "Kredi faizi, limit ve onay sürecini", "Sadece kredi limitini", "Hiçbir şeyi"], answer: 1 },
  { topic: "credit", q: "Bileşik faiz ne anlama gelir?", options: ["Sabit faiz", "Faizin faiz getirmesi", "Düşen faiz", "Tek seferlik faiz"], answer: 1 },
  { topic: "credit", q: "İhtiyaç kredisi ile konut kredisi farkı nedir?", options: ["Fark yok", "Konut kredisi daha uzun vadeli ve düşük faizli", "İhtiyaç kredisi daha ucuz", "Konut kredisi daha kısa vadeli"], answer: 1 },
  { topic: "credit", q: "Erken ödeme cezası nedir?", options: ["Geç ödeme ücreti", "Krediyi erken kapatma ücreti", "Limit aşım ücreti", "Yıllık kart ücreti"], answer: 1 },
  { topic: "credit", q: "Hangi durum kredi notunu düşürür?", options: ["Zamanında ödeme", "Limit altı kullanım", "Gecikmiş ödeme", "Otomatik ödeme talimatı"], answer: 2 },
  { topic: "credit", q: "APR nedir?", options: ["Aylık faiz oranı", "Yıllık yüzde oran (toplam maliyet)", "Asgari ödeme tutarı", "Kredi limiti"], answer: 1 },
  { topic: "credit", q: "Hangi kredi türü en yüksek faizi taşır?", options: ["Konut kredisi", "Taşıt kredisi", "İhtiyaç kredisi", "Kredi kartı nakit avansı"], answer: 3 },
  { topic: "credit", q: "Tüketici kredisi başvurusunda önce ne yapılmalı?", options: ["Hemen imzalamak", "Farklı bankaları karşılaştırmak", "En yüksek limiti istemek", "Kefilden yardım istemek"], answer: 1 },

  // YATIRIM
  { topic: "investment", q: "Yatırımdan önce öncelik ne olmalıdır?", options: ["Hisse senedi", "Acil fon", "Kripto para", "Döviz"], answer: 1 },
  { topic: "investment", q: "TEFAS ne işe yarar?", options: ["Kredi verir", "Sigorta sağlar", "Yatırım fonlarına erişim sağlar", "Döviz satar"], answer: 2 },
  { topic: "investment", q: "Portföy çeşitlendirmesi neden önemlidir?", options: ["Daha fazla kazanmak için", "Riski dağıtmak için", "Daha az vergi ödemek için", "Kredi almak için"], answer: 1 },
  { topic: "investment", q: "Hangi yatırım en likit kabul edilir?", options: ["Gayrimenkul", "Altın", "Mevduat hesabı", "Hisse senedi fonu"], answer: 2 },
  { topic: "investment", q: "Uzun vadeli yatırımda bileşik faizin etkisi nedir?", options: ["Azalır", "Değişmez", "Üstel büyür", "Düşer"], answer: 2 },
  { topic: "investment", q: "Risk-getiri ilişkisi nasıldır?", options: ["Düşük risk = yüksek getiri", "Yüksek risk = yüksek getiri potansiyeli", "Risk getiriyi etkilemez", "Orta risk en iyisidir"], answer: 1 },
  { topic: "investment", q: "Hisse senedi ne anlama gelir?", options: ["Borç belgesi", "Şirkete ortak olma", "Devlet güvencesi", "Sabit getiri"], answer: 1 },
  { topic: "investment", q: "Tahvil nedir?", options: ["Hisse senedi türü", "Şirkete borç verme belgesi", "Gayrimenkul senedi", "Döviz"], answer: 1 },
  { topic: "investment", q: "Altının avantajı nedir?", options: ["Yüksek getiri garantisi", "Enflasyona karşı değer koruma", "Faiz geliri", "Düşük risk yok"], answer: 1 },
  { topic: "investment", q: "Dollar cost averaging (DCA) nedir?", options: ["Tek seferde büyük yatırım", "Düzenli aralıklarla sabit miktarda yatırım", "Sadece düşüşte alım", "Sadece yüksekte satış"], answer: 1 },
  { topic: "investment", q: "P/E oranı ne anlama gelir?", options: ["Şirketin borç oranı", "Fiyat/kazanç oranı", "Temettü verimi", "Piyasa değeri"], answer: 1 },
  { topic: "investment", q: "Hangi yatırım aracı Türkiye'de devlet güvencesi taşır?", options: ["Hisse senedi", "Kripto para", "Devlet tahvili", "Yatırım fonu"], answer: 2 },
  { topic: "investment", q: "Emeklilik için en uygun yatırım stratejisi hangisidir?", options: ["Kısa vadeli spekülatif", "Uzun vadeli çeşitlendirilmiş", "Sadece kripto", "Sadece nakit"], answer: 1 },
];

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
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizSection({ topicId }: { topicId: string }) {
  const [retryKey, setRetryKey] = useState(0);
  const quiz = useMemo(() => {
    const topicQs = ALL_QUESTIONS.filter(q => q.topic === topicId);
    return shuffleArray(topicQs).slice(0, 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, retryKey]);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? quiz.filter((q, i) => answers[i] === q.answer).length
    : 0;

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setRetryKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#44445a] uppercase tracking-widest">
          Mini Quiz — {quiz.length} Soru
        </p>
        {submitted && (
          <span className={`text-xs font-mono font-bold ${
            score === quiz.length ? "text-[#10b981]" : "text-[#f59e0b]"
          }`}>
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
                    correct
                      ? "bg-[#10b98111] border-[#10b98144] text-[#10b981]"
                      : wrong
                      ? "bg-red-400/10 border-red-400/30 text-red-400"
                      : selected
                      ? "bg-[#f59e0b11] border-[#f59e0b44] text-[#f59e0b]"
                      : "bg-[#16161f] border-[#ffffff0f] text-[#8888a0] hover:border-[#f59e0b33] hover:text-white"
                  }`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
          className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:opacity-40 text-black font-semibold py-2.5 rounded-xl text-sm transition-all">
          Cevapları Kontrol Et
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={handleRetry}
            className="flex-1 bg-[#16161f] border border-[#ffffff0f] text-[#8888a0] hover:text-white py-2.5 rounded-xl text-sm transition-colors">
            Farklı Sorular Dene
          </button>
          {score === quiz.length && (
            <div className="flex-1 bg-[#10b98111] border border-[#10b98133] text-[#10b981] py-2.5 rounded-xl text-sm text-center">
              🎉 Mükemmel!
            </div>
          )}
        </div>
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

  const questionCount: Record<string, number> = {
    budget: ALL_QUESTIONS.filter(q => q.topic === "budget").length,
    inflation: ALL_QUESTIONS.filter(q => q.topic === "inflation").length,
    credit: ALL_QUESTIONS.filter(q => q.topic === "credit").length,
    investment: ALL_QUESTIONS.filter(q => q.topic === "investment").length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {!selected ? (
        <>
          <div className="animate-fade-up">
            <h2 className="text-2xl font-bold text-white">📚 Finansal Okuryazarlık</h2>
            <p className="text-xs text-[#44445a] mt-1">
              Her açılışta farklı sorular — {ALL_QUESTIONS.length} soruluk bankadan rastgele 2 soru
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {TOPICS.map((t, i) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className="text-left bg-[#16161f] border border-[#ffffff0f] hover:border-[#f59e0b33] rounded-2xl p-5 transition-all duration-300 hover:bg-[#1c1c28] hover:scale-[1.01] animate-fade-up"
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
                        style={{
                          color: levelColor[t.level],
                          borderColor: `${levelColor[t.level]}44`,
                          background: `${levelColor[t.level]}11`
                        }}>
                        {t.level}
                      </span>
                    </div>
                    <p className="text-xs text-[#8888a0] leading-relaxed">{t.description}</p>
                    <p className="text-[10px] text-[#44445a] mt-2">
                      {questionCount[t.id]} sorudan rastgele 2 tanesi →
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-[#16161f] border border-[#f59e0b22] rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-sm font-semibold text-white">
                {ALL_QUESTIONS.length} soruluk soru bankası
              </p>
              <p className="text-xs text-[#44445a] mt-0.5">
                Her açılışta farklı sorularla bilgini test et
              </p>
            </div>
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
            <QuizSection topicId={topic.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
