from __future__ import annotations

import sys

from app.db.session import SessionLocal
from app.services.research_pulse import discover_and_ingest_source_queries


def main() -> None:
    query_key = sys.argv[1] if len(sys.argv) > 1 else None
    db = SessionLocal()
    try:
        ingested_count = discover_and_ingest_source_queries(db, query_key=query_key)
    finally:
        db.close()

    print(f"Ingested {ingested_count} connector-sourced Research Pulse publications.")


if __name__ == "__main__":
    main()
