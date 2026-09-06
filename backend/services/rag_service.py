"""Extractive RAG service — backend/services/rag_service.py

Post-prediction evidence retrieval over a small curated knowledge base
(data/kb/<disease>/*.md). Runs AFTER the ML/QML models produce their
screening output and can NEVER change, override, or generate a prediction:
it receives only (disease, risk, contributor keys) and returns text plus
cited evidence entries.

Design constraints (SIH26139, Sept 2026 decision):
  * Extractive only — no generative LLM is wired. Summaries are sentences
    quoted from the curated docs, never paraphrased claims.
  * Zero new dependencies — retrieval is sklearn TF-IDF + cosine similarity
    (both already in requirements.txt). Works fully offline on CPU.
  * The ML training datasets are NEVER the knowledge base. The KB is
    guideline-style prose (AHA/ADA/WHO/CDC/ACG) with source + URL per doc.
  * Any failure (missing index, empty KB, disabled flag) returns None and
    the caller falls back to the static curated evidence in
    backend/services/explainability.py. This module never raises for
    operational states — only for genuinely unexpected errors, which the
    caller also catches.
"""
import os
import pathlib
import pickle
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
KB_DIR = ROOT / "data" / "kb"
INDEX_PATH = KB_DIR / ".index" / "kb_index.pkl"

# Display-name / legacy aliases -> KB disease bucket. Only the three served
# Musa modules have KB coverage; anything else yields no retrieval hit.
DISEASE_ALIASES = {
    "musa_heart": "musa_heart",
    "heart": "musa_heart",
    "musa_hcv": "musa_hcv",
    "hcv": "musa_hcv",
    "liver": "musa_hcv",
    "musa_diabetes": "musa_diabetes",
    "diabetes": "musa_diabetes",
}

_TOPIC_BOOST = 0.2
_TOPIC_BOOST_CAP = 0.6
_EVIDENCE_CHARS = 500

_docs_cache = None
_index_cache = None


def is_enabled() -> bool:
    """RAG_ENABLED=0 restores byte-identical legacy behaviour. Default on."""
    return os.getenv("RAG_ENABLED", "1") != "0"


def _top_k() -> int:
    try:
        return max(1, min(5, int(os.getenv("RAG_TOP_K", "3"))))
    except ValueError:
        return 3


def _parse_doc(path: pathlib.Path) -> dict | None:
    """Minimal front-matter parser (no yaml dependency)."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    if not text.startswith("---"):
        return None
    try:
        _, front, body = text.split("---", 2)
    except ValueError:
        return None
    meta: dict = {}
    for line in front.strip().splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip().lower()] = v.strip()
    disease = meta.get("disease", "")
    if disease not in ("musa_heart", "musa_hcv", "musa_diabetes"):
        return None
    topics = {t.strip().lower() for t in meta.get("topics", "").split(",") if t.strip()}
    body = body.strip()
    if not body or not meta.get("title"):
        return None
    return {
        "title": meta["title"],
        "source": meta.get("source", "Curated screening knowledge base"),
        "url": meta.get("url", ""),
        "disease": disease,
        "topics": topics,
        "body": body,
        "path": str(path),
    }


def _load_docs() -> list:
    global _docs_cache
    if _docs_cache is not None:
        return _docs_cache
    docs = []
    if KB_DIR.is_dir():
        for path in sorted(KB_DIR.glob("*/*.md")):
            doc = _parse_doc(path)
            if doc:
                docs.append(doc)
    _docs_cache = docs
    return docs


def _build_index(docs: list):
    """Fit TF-IDF over doc bodies. Imported lazily so module import is cheap."""
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([d["body"] for d in docs])
    return vectorizer, matrix


def _get_index(docs: list):
    """Load the prebuilt pickle when fresh, else build in memory (and cache)."""
    global _index_cache
    if _index_cache is not None:
        return _index_cache
    if INDEX_PATH.exists():
        try:
            payload = pickle.loads(INDEX_PATH.read_bytes())
            if (
                isinstance(payload, dict)
                and payload.get("doc_count") == len(docs)
                and payload.get("doc_paths") == [d["path"] for d in docs]
            ):
                _index_cache = (payload["vectorizer"], payload["matrix"])
                return _index_cache
        except Exception:
            pass  # stale or corrupt cache -> rebuild in memory
    _index_cache = _build_index(docs)
    return _index_cache


_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WORD = re.compile(r"[a-z0-9]+")


def _sentences(text: str) -> list:
    return [s.strip() for s in _SENT_SPLIT.split(text) if s.strip()]


def _sentence_score(sent: str, query_tokens: set, contributor_keys: set) -> float:
    words = set(_WORD.findall(sent.lower()))
    if not words:
        return 0.0
    overlap = len(words & query_tokens)
    # Contributor mentions weigh double — the sentences must speak to the
    # features that actually drove this patient's screening flag.
    contrib_hits = sum(1 for c in contributor_keys if c in sent.lower())
    return overlap + 2.0 * contrib_hits


def retrieve(disease: str, contributors: list, risk: str = "") -> dict | None:
    """Retrieve cited evidence for one screening result.

    Returns None when RAG cannot contribute (disabled, unknown disease,
    empty KB) so the caller falls back to static evidence. Never raises
    for these operational states.
    """
    if not is_enabled():
        return None
    bucket = DISEASE_ALIASES.get((disease or "").lower())
    if bucket is None:
        return None
    docs = [d for d in _load_docs() if d["disease"] == bucket]
    if not docs:
        return None

    contributors = [str(c) for c in (contributors or [])]
    contrib_keys = {c.lower() for c in contributors}
    query = " ".join([bucket.replace("musa_", "").replace("_", " "), risk or "", *contributors])

    from sklearn.metrics.pairwise import cosine_similarity

    vectorizer, matrix = _get_index(docs)
    sims = cosine_similarity(vectorizer.transform([query]), matrix)[0]

    ranked = []
    for i, doc in enumerate(docs):
        boost = min(_TOPIC_BOOST_CAP, _TOPIC_BOOST * len(doc["topics"] & contrib_keys))
        ranked.append((float(sims[i]) + boost, doc))
    ranked.sort(key=lambda t: t[0], reverse=True)
    # Keep docs with genuine textual or topical relevance only.
    ranked = [(s, d) for s, d in ranked if s > 0][: _top_k()]
    if not ranked:
        return None

    query_tokens = set(_WORD.findall(query.lower()))
    evidence = []
    lead_sentences: list = []
    for score, doc in ranked:
        scored = sorted(
            ((_sentence_score(s, query_tokens, contrib_keys), s) for s in _sentences(doc["body"])),
            key=lambda t: t[0],
            reverse=True,
        )
        picks = [s for sc, s in scored[:2] if sc > 0] or _sentences(doc["body"])[:1]
        summary = " ".join(picks)
        if len(summary) > _EVIDENCE_CHARS:
            summary = summary[: _EVIDENCE_CHARS - 1].rsplit(" ", 1)[0] + "…"
        evidence.append(
            {"title": doc["title"], "summary": summary, "source": doc["source"], "url": doc["url"]}
        )
        lead_sentences.extend(picks[:1])

    return {
        "summary_sentences": lead_sentences[:2],
        "evidence": evidence,
        "rag": {
            "used": True,
            "mode": "extractive",
            "disease": bucket,
            "sources": [e["source"] for e in evidence],
        },
    }
