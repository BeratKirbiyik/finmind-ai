from app.rag.chroma_client import add_documents, get_chroma_client

FINANCIAL_KNOWLEDGE = [
    {
        "id": "rule_50_30_20",
        "text": "50/30/20 bütçe kuralı: Gelirinizin %50'si zorunlu giderler (kira, fatura, market), %30'u istekler (eğlence, yemek dışarıda), %20'si tasarruf ve hedefler için ayrılmalıdır. Türkiye'de yaşam maliyeti göz önüne alındığında bu oranlar %60/20/20 şeklinde uyarlanabilir.",
        "metadata": {"category": "budgeting", "lang": "tr"}
    },
    {
        "id": "emergency_fund",
        "text": "Acil fon: 3-6 aylık gideri karşılayacak birikime sahip olmak finansal güvenliğin temelidir. Türkiye enflasyon ortamında bu fonu TL yerine dolar veya altın cinsinden tutmak değer kaybını önler.",
        "metadata": {"category": "savings", "lang": "tr"}
    },
    {
        "id": "food_delivery_trap",
        "text": "Yemek siparişi tuzağı: Yemeksepeti ve Getir gibi platformlarda yapılan siparişler ortalamada marketten %40-60 daha pahalıya gelir. Haftada 3 sipariş yerine 1'e düşürmek aylık 500-800 TL tasarruf sağlayabilir.",
        "metadata": {"category": "food", "lang": "tr"}
    },
    {
        "id": "subscription_audit",
        "text": "Abonelik denetimi: Netflix, Spotify, Amazon Prime gibi dijital abonelikleri yılda bir gözden geçirin. Kullanılmayan abonelikler aylık ortalama 300-500 TL gereksiz harcamaya yol açar.",
        "metadata": {"category": "bills", "lang": "tr"}
    },
    {
        "id": "impulse_buying",
        "text": "Anlık alışveriş önlemi: Trendyol ve Hepsiburada gibi platformlarda alışveriş yapmadan önce 24 saat bekleyin. Bu 'soğuma süresi' anlık satın alma kararlarının %60'ını engeller. Sepeti kaydedin, yarın bakın.",
        "metadata": {"category": "shopping", "lang": "tr"}
    },
    {
        "id": "goal_saving_strategy",
        "text": "Hedef bazlı tasarruf: Belirli bir hedefe (tatil, elektronik, acil fon) tasarruf ederken otomatik transfer kullanın. Maaş günü, hedef miktarını otomatik olarak ayrı bir hesaba aktarın. 'Kalan parayı biriktiririm' yaklaşımı çoğunlukla başarısız olur.",
        "metadata": {"category": "savings", "lang": "tr"}
    },
    {
        "id": "transport_savings",
        "text": "Ulaşım tasarrufu: İstanbul'da Uber yerine İETT+Metro kombinasyonu ortalama %75 daha ucuzdur. Aylık ulaşım bütçesini sabitlemek için toplu taşıma aboneliği düşünülmelidir.",
        "metadata": {"category": "transport", "lang": "tr"}
    },
    {
        "id": "inflation_protection",
        "text": "Enflasyona karşı koruma: Türkiye'de yüksek enflasyon döneminde nakit tutmak yerine altın, döviz veya BIST endeks fonları (TEFAS) değer koruma sağlar. Aylık harcama fazlasını TL mevduatta tutmak reel kayba yol açar.",
        "metadata": {"category": "investment", "lang": "tr"}
    },
]

async def initialize_knowledge_base():
    _, collection = get_chroma_client()
    if collection.count() == 0:
        print("Bilgi tabanı yükleniyor...")
        add_documents(FINANCIAL_KNOWLEDGE)
        print(f"{len(FINANCIAL_KNOWLEDGE)} finansal bilgi yüklendi.")
    else:
        print(f"Bilgi tabanı hazır: {collection.count()} kayıt.")
