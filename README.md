# 🧠 FinMind AI — Kişisel Finans Asistanı

> **BTK Akademi Hackathon '26** — Multi-Agent AI Personal Finance Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat&logo=google)](https://ai.google.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange?style=flat)](https://langchain-ai.github.io/langgraph)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

<br/>

## 🎯 Proje Özeti

FinMind AI, kullanıcıların finansal verilerini **doğal dilde** sorgulayabileceği, yapay zeka destekli kişisel finans asistanıdır.

Tek bir chatbot'tan farklı olarak, birbirleriyle koordineli çalışan **4 uzman ajan** içerir. Her soru; veri analizinden davranış profiline, finansal koçluktan raporlamaya kadar uzanan bir pipeline'dan geçer.

**Canlı Demo →** [finmind-ai-nine.vercel.app](https://finmind-ai-nine.vercel.app)

<br/>

## ✨ Özellikler

### Finansal DNA Profili
Harcama alışkanlıklarını zamansal ve davranışsal örüntülerle analiz eder. Stresli günlerde yapılan anlık alışverişleri, tekrar eden impulsif harcamaları tespit eder ve kullanıcıya "Anlık Karar Verici", "Dengeli Harcayıcı" gibi kişilik profilleri sunar.

### Oyunlaştırılmış Finansal Koçluk
Aylık 0-100 finansal skor sistemi. "💰 Bütçe Ustası", "🏆 Süper Tasarrufçu" gibi kazanılabilir rozetler. Rozet kazanıldığında konfeti animasyonu. Hedeflere giden yolda günlük birikim hesabı.

### 📸 Fotoğraftan Harcama Aktarımı
Fatura, fiş veya defter fotoğrafı çek — Gemini Vision API harcamaları otomatik tespit edip kategorize eder ve dashboard'a ekler.

### 📚 Finansal Okuryazarlık Köşesi
Bütçe yönetimi, enflasyon, kredi ve yatırım konularında interaktif içerik ve mini quizler.

### 📊 Aylık Karşılaştırmalı Analiz
Geçmiş aylara veri girişi yapılabilir. Aylık harcama karşılaştırma grafiği ile trend analizi.

<br/>

## 🏗️ Mimari

```
┌─────────────────────────────────────────┐
│         Kullanıcı (Next.js 14)          │
│   Chat · Dashboard · Vision · Literacy  │
└──────────────────┬──────────────────────┘
                   │ REST / SSE
┌──────────────────▼──────────────────────┐
│          FastAPI Backend                │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │    LangGraph StateGraph          │   │
│  │                                  │   │
│  │  ┌─────────────────────────┐    │   │
│  │  │   Orchestrator Agent    │    │   │
│  │  │  Niyet analizi &        │    │   │
│  │  │  görev yönlendirme      │    │   │
│  │  └────────────┬────────────┘    │   │
│  │               │                  │   │
│  │   ┌───────────┼───────────┐      │   │
│  │   ▼           ▼           ▼      │   │
│  │ ┌──────┐ ┌────────┐ ┌────────┐  │   │
│  │ │Data  │ │Behav.  │ │Report- │  │   │
│  │ │Anal. │ │Profiler│ │ing     │  │   │
│  │ └──┬───┘ └───┬────┘ └───┬────┘  │   │
│  │    └─────────┼──────────┘       │   │
│  │              ▼                   │   │
│  │  ┌───────────────────────────┐   │   │
│  │  │   Financial Coach Agent   │   │   │
│  │  │  Gemini 2.5 + ChromaDB   │   │   │
│  │  │        RAG Pipeline       │   │   │
│  │  └───────────────────────────┘   │   │
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │ChromaDB  │ │  Redis   │
│Supabase  │ │Vector DB │ │  Cache   │
└──────────┘ └──────────┘ └──────────┘
```

<br/>

## 🤖 Agent Sistemi

### Niyet Sınıflandırması (Data Analyst Agent)
Her kullanıcı mesajı önce sınıflandırılır:

| Intent | Tetikleyici Örnek | Yönlendirme |
|--------|------------------|-------------|
| `spending_analysis` | "Bu ay neden fazla harcadım?" | Behavioral Profiler → Coach |
| `overspending` | "Bütçemi neden aştım?" | Behavioral Profiler → Coach |
| `goal_planning` | "3 ayda tatil parası biriktirebilir miyim?" | Financial Coach |
| `savings_advice` | "Nasıl tasarruf ederim?" | Financial Coach |
| `reporting` | "Aylık raporumu göster" | Reporting Agent |

### RAG Pipeline
ChromaDB'de saklanan **8 Türkçe finansal bilgi dokümanı** (50/30/20 kuralı, acil fon, enflasyon koruması vb.) kullanıcı sorusuna göre semantik olarak aranır ve Gemini'ye context olarak enjekte edilir. Bu sayede halüsinasyon riski minimize edilir.

### Behavioral Profiler
- Aynı günde 3+ işlem → "stresli harcama günü" tespiti
- Yemeksepeti/Getir gibi food delivery sayacı
- Yüksek harcama günleri listesi
- Impulsive risk skoru: `low / medium / high`

### Reporting Agent
- Aylık bütçe skoru (0-100)
- Bütçe uyumu, çeşitlilik, tutarlılık alt skorları
- Rozet sistemi: Bütçe Ustası, Süper Tasarrufçu, Bilinçli Harcayıcı

<br/>

<br/>
## Mimari Kararlar

**Neden LangGraph?**
LangGraph'ın StateGraph yaklaşımı, finansal veri analizinde
deterministik akış sağlar. CrewAI'ın agent loop'ları veya
AutoGen'in sohbet tabanlı yaklaşımının aksine, her ajanın
ne zaman devreye gireceği önceden tanımlıdır. Finansal
uygulamalarda halüsinasyon riskini minimize etmek için
bu kontrol kritiktir.

**Neden RAG + ChromaDB?**
Gemini'nin 1M token context'i tüm harcama geçmişini
taşıyabilir, ancak finansal tavsiye için domain-specific
bilgi gereklidir. ChromaDB ile Türkiye'ye özgü finansal
bilgi tabanı (50/30/20 kuralı, TEFAS, enflasyon koruması)
semantik olarak aranır ve her yanıta enjekte edilir.

**Neden Gemini 2.5 Flash?**
Tool use, JSON mode ve 1M token context desteği.
Türkçe performansı rakiplerine göre üstün.
Embedding için text-embedding-001 ile tek API,
ek servis maliyeti yok.
<br/>
## 🛠️ Teknoloji Stack

| Katman | Teknoloji | Neden? |
|--------|-----------|--------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | SSR, tip güvenliği, hızlı geliştirme |
| **UI & Grafik** | Recharts, Custom SVG | Hafif, özelleştirilebilir |
| **Animasyon** | CSS Keyframes, rAF, Canvas2D | Sıfır bağımlılık, 60fps |
| **Backend** | FastAPI, Python 3.11 | Async, LangGraph uyumlu |
| **LLM** | Gemini 2.5 Flash / Pro | 1M token context, Türkçe, tool use |
| **Agent Framework** | LangGraph 0.2 | Deterministik state machine |
| **Embedding** | Gemini text-embedding-001 | Tek API, ek servis yok |
| **Vektör DB** | ChromaDB | Sıfır kurulum, persistent |
| **İlişkisel DB** | PostgreSQL 17 (Supabase) | Managed, ücretsiz tier |
| **Cache** | Redis | Agent çıktı önbelleği (5 dk TTL) |
| **Vision** | Gemini Vision API | Fotoğraftan harcama çıkarma |
| **Deploy** | Vercel + Railway | Tek komut, otomatik CI/CD |

<br/>

## 🚀 Kurulum

### Gereksinimler
- Python 3.11+
- Node.js 18+
- Gemini API Key ([ai.google.dev](https://ai.google.dev))
- Supabase hesabı ([supabase.com](https://supabase.com))

### Backend

```bash
cd finmind/backend

# Sanal ortam
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Bağımlılıklar
pip install -r requirements.txt

# Environment
cp .env.example .env
# .env dosyasını doldurun (Gemini API key, Supabase bilgileri)

# Başlat
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd finmind/frontend

# Bağımlılıklar
npm install

# Environment
cp .env.example .env
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Başlat
npm run dev
```

### Demo Verisi Yükle

```bash
# Kullanıcı oluştur
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@finmind.ai","full_name":"Demo Kullanıcı","monthly_income":30000}'

# Demo harcamaları yükle (dönen user_id ile)
curl -X POST http://localhost:8000/api/transactions/seed/{USER_ID}

# Demo hedefleri yükle
curl -X POST http://localhost:8000/api/goals/seed/{USER_ID}
```

<br/>

## 📡 API Referansı

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/health` | Sistem durumu |
| `POST` | `/api/auth/register` | Kullanıcı kaydı |
| `GET` | `/api/auth/user/:id` | Kullanıcı bilgisi |
| `POST` | `/api/chat/` | AI chat (multi-agent pipeline) |
| `GET` | `/api/analytics/dashboard/:id` | Dashboard verisi |
| `GET` | `/api/transactions/user/:id` | İşlem listesi |
| `POST` | `/api/transactions/bulk` | Toplu işlem ekleme |
| `GET` | `/api/transactions/monthly-summary/:id` | Aylık özet |
| `GET` | `/api/goals/user/:id` | Hedefler |
| `POST` | `/api/goals/` | Hedef oluştur |
| `PATCH` | `/api/goals/:id/deposit` | Hedefe para ekle |
| `POST` | `/api/vision/extract` | Fotoğraftan harcama çıkar |

<br/>

## 📁 Proje Yapısı

```
finmind/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── orchestrator.py      # LangGraph state machine
│   │   │   ├── data_analyst.py      # Veri çekme + intent
│   │   │   ├── behavioral_profiler.py # Duygusal analiz
│   │   │   ├── financial_coach.py   # Gemini + RAG
│   │   │   ├── reporting.py         # Skor + rozet
│   │   │   ├── state.py             # AgentState TypedDict
│   │   │   └── tools.py             # DB araçları
│   │   ├── rag/
│   │   │   ├── chroma_client.py     # ChromaDB + embedding
│   │   │   └── knowledge_base.py    # Türkçe finans dokümanları
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── transactions.py
│   │   │   ├── chat.py              # Agent pipeline entry
│   │   │   ├── goals.py
│   │   │   ├── analytics.py         # Dashboard endpoint
│   │   │   └── vision.py            # Gemini Vision
│   │   ├── models/schemas.py        # SQLAlchemy modelleri
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Landing (Demo + Onboarding)
        │   └── dashboard/
        │       ├── page.tsx          # Ana dashboard
        │       └── literacy/
        │           └── page.tsx      # Finansal okuryazarlık
        ├── components/
        │   ├── chat/
        │   │   ├── ChatInterface.tsx
        │   │   ├── StreamingMessage.tsx  # Markdown + fade-in akış
        │   │   └── AgentSteps.tsx        # Canlı ajan göstergesi
        │   ├── ui/
        │   │   ├── CountUp.tsx           # Sayaç animasyonu
        │   │   ├── ScoreRing.tsx         # SVG skor halkası
        │   │   ├── ConfettiCanvas.tsx    # Canvas konfeti
        │   │   ├── SkeletonCard.tsx      # Shimmer loader
        │   │   ├── MonthlyChart.tsx      # Aylık karşılaştırma
        │   │   ├── AddTransactionModal.tsx
        │   │   ├── LogoSVG.tsx           # Animasyonlu logo
        │   │   └── VisionUpload.tsx      # Fotoğraf yükleme
        │   └── vision/
        └── hooks/
            └── useAnimation.ts       # useTween, useCountUp, ease
```

<br/>

## 🎨 Tasarım Sistemi

**Luxury Dark Finance** teması — Bloomberg Terminal + modern fintech estetiği.

```css
--bg-base:    #0a0a0f   /* Ana arka plan */
--bg-surface: #111118   /* Yüzey */
--bg-card:    #16161f   /* Kart */
--amber:      #f59e0b   /* Ana aksan */
--text:       #f0f0f5   /* Birincil metin */
--muted:      #8888a0   /* İkincil metin */
```

**18 micro-interaction:** Kelime kelime streaming, ajan adım göstergesi, sayaç animasyonu, skor halkası dolumu, konfeti, shimmer skeleton, SVG logo çizimi, conic-gradient DNA border, input expand efekti, slide onboarding.

<br/>

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
GEMINI_API_KEY=AIza...
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

<br/>

## 📊 Hackathon Değerlendirme Kriterleri

| Kriter | Puan | Çözümümüz |
|--------|------|-----------|
| **Kullanıcı Değeri** | 20p | Demo modu + kişisel onboarding, fotoğraftan aktarım, okuryazarlık köşesi |
| **Teknik Puan** | 20p | LangGraph multi-agent, ChromaDB RAG, Gemini 2.5, async FastAPI, Redis cache |
| **Performans & Doğruluk** | 10p | RAG ile halüsinasyon önleme, Redis cache (5dk TTL), paralel agent çalışması |
| **Agentic Yapılar** | 10p | 4 ajan, tool use, state machine, intent routing, behavioral profiling |
| **Yenilikçilik** | 10p | Finansal DNA profili, gamification + konfeti, Vision API fatura okuma |
| **UI/UX** | 10p | Luxury Dark tema, 18 micro-interaction, skeleton loader, streaming chat |
| **Sunum & Dokümantasyon** | 20p | Bu README + tanıtım videosu + canlı demo |

<br/>

## 👥 Takım

**BTK Akademi Hackathon '26 Katılımcıları**

<br/>

## 📄 Lisans

[MIT](LICENSE)

---

<div align="center">
  <p>
    <strong>FinMind AI</strong> — Paranızı anlayan, büyütmenize yardım eden yapay zeka
  </p>
  <p>
    <a href="https://finmind-ai-nine.vercel.app">🌐 Canlı Demo</a> ·
    <a href="https://finmind-ai-production.up.railway.app/docs">📡 API Docs</a>
  </p>
</div>
