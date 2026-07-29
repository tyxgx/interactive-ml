import re
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

KNOWLEDGE_BASE_DIR = Path(__file__).parent / "knowledge_base"

_vectorizer: TfidfVectorizer | None = None
_doc_vectors = None
_documents: list[dict] = []


def _extract_title(text: str, fallback: str) -> str:
    match = re.match(r"^#\s+(.+)$", text.strip(), re.MULTILINE)
    return match.group(1).strip() if match else fallback


def build_index() -> None:
    global _vectorizer, _doc_vectors, _documents

    documents = []
    for path in sorted(KNOWLEDGE_BASE_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        title = _extract_title(text, fallback=path.stem)
        documents.append({"title": title, "text": text, "filename": path.name})

    vectorizer = TfidfVectorizer(stop_words="english")
    doc_vectors = vectorizer.fit_transform([doc["text"] for doc in documents])

    _vectorizer = vectorizer
    _doc_vectors = doc_vectors
    _documents = documents


def retrieve(query: str, top_k: int = 3) -> list[dict]:
    if _vectorizer is None or _doc_vectors is None or not _documents:
        return []

    query_vector = _vectorizer.transform([query])
    similarities = cosine_similarity(query_vector, _doc_vectors)[0]

    ranked_indices = similarities.argsort()[::-1][:top_k]

    return [
        {
            "title": _documents[i]["title"],
            "text": _documents[i]["text"],
            "score": round(float(similarities[i]), 4),
        }
        for i in ranked_indices
    ]
