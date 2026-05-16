import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from app.config import settings
import os

genai.configure(api_key=settings.gemini_api_key)

_client = None
_collection = None

def get_chroma_client():
    global _client, _collection
    if _client is None:
        _client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False)
        )
        _collection = _client.get_or_create_collection(
            name="finmind_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
    return _client, _collection

def embed_text(text: str) -> list:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
    )
    return result["embedding"]

def add_documents(docs: list):
    _, collection = get_chroma_client()
    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]
    embeddings = [embed_text(t) for t in texts]
    metadatas = [d.get("metadata", {}) for d in docs]
    collection.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)

def search_knowledge(query: str, n_results: int = 3) -> str:
    _, collection = get_chroma_client()
    try:
        count = collection.count()
        if count == 0:
            return ""
        query_embedding = embed_text(query)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, count)
        )
        docs = results.get("documents", [[]])[0]
        return "\n\n".join(docs)
    except Exception:
        return ""
