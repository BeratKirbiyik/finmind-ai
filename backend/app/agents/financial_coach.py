import google.generativeai as genai
from app.agents.state import AgentState
from app.rag.chroma_client import search_knowledge
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

COACH_SYSTEM = """Sen FinMind AI'ın Finansal Koç ajanısın. Türkçe konuşursun.
Görevin: Kullanıcının finansal verilerini analiz ederek somut, uygulanabilir ve empatik tavsiyeler vermek.

KURALLAR:
- Her zaman gerçek veriye dayan. Sayıları kullan.
- Asla "belki" veya "muhtemelen" kullanma. Kesin öneriler ver.
- Yanıtı 3 bölümde ver: 📊 Durum Analizi | 💡 Somut Öneriler | 🎯 Bu Ay Yapabileceklerin
- Markdown kullanma. ** işareti kullanma. Düz metin yaz.
- Türk kullanıcı için yerel örnekler kullan (Migros, Yemeksepeti, İETT vs.)
- Maksimum 300 kelime."""

async def financial_coach_node(state: AgentState, db) -> AgentState:
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=COACH_SYSTEM
    )

    analysis = state.get("analysis", {})
    behavioral = state.get("behavioral_profile", {})
    rag_context = search_knowledge(state["user_message"])

    category_stats = analysis.get("category_stats", {})
    user_info = analysis.get("user_info", {})
    total_spent = analysis.get("total_spent", 0)
    monthly_income = user_info.get("monthly_income", 0)

    top_categories = "\n".join([
        f"- {cat}: {data['total']:,.0f} TL ({data['count']} işlem)"
        for cat, data in list(category_stats.items())[:5]
    ])

    dna = behavioral.get("financial_dna", {}) if behavioral else {}
    patterns = behavioral.get("emotional_patterns", {}) if behavioral else {}

    context = f"""
KULLANICI VERİLERİ (Son 60 gün):
- Ad: {user_info.get('full_name', 'Kullanıcı')}
- Aylık gelir: {monthly_income:,.0f} TL
- Toplam harcama (60 gün): {total_spent:,.0f} TL
- Aylık ortalama harcama: {total_spent/2:,.0f} TL

KATEGORİ BAZLI HARCAMALAR:
{top_categories}

FİNANSAL DNA:
- Profil: {dna.get('type', 'Belirsiz')}
- Risk: {patterns.get('impulsive_risk', 'low')}
- Yüksek harcama günleri: {len(patterns.get('high_spend_days', []))}

FİNANSAL BİLGİ TABANI:
{rag_context}

KULLANICI SORUSU: {state['user_message']}
"""

    response = model.generate_content(context)

    steps = state.get("steps_taken", [])
    steps.append("financial_coach")

    return {
        **state,
        "rag_context": rag_context,
        "coach_response": response.text,
        "final_response": response.text,
        "steps_taken": steps,
    }
