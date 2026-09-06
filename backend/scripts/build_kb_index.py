"""Prebuild the RAG TF-IDF index — backend/scripts/build_kb_index.py.

Writes data/kb/.index/kb_index.pkl (gitignored artifact). The service works
without it (builds the same index lazily in memory), so this is purely a
startup-speed optimisation.

Run: PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection \
       .venv/bin/python backend/scripts/build_kb_index.py
"""
import pathlib
import pickle
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.services import rag_service as rag  # noqa: E402


def main() -> None:
    docs = rag._load_docs()
    if not docs:
        print("no KB docs found under data/kb/*/*.md — nothing indexed")
        raise SystemExit(1)
    vectorizer, matrix = rag._build_index(docs)
    rag.INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "vectorizer": vectorizer,
        "matrix": matrix,
        "doc_count": len(docs),
        "doc_paths": [d["path"] for d in docs],
    }
    rag.INDEX_PATH.write_bytes(pickle.dumps(payload))
    by_disease: dict = {}
    for d in docs:
        by_disease[d["disease"]] = by_disease.get(d["disease"], 0) + 1
    print(f"indexed {len(docs)} docs -> {rag.INDEX_PATH}")
    for k in sorted(by_disease):
        print(f"  {k}: {by_disease[k]}")


if __name__ == "__main__":
    main()
