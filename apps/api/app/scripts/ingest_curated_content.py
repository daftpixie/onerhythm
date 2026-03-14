from __future__ import annotations

from app.db.session import SessionLocal
from app.services.content_ingestion import ingest_curated_content


def main() -> None:
    db = SessionLocal()
    try:
        ingested_count = ingest_curated_content(db)
    finally:
        db.close()

    print(f"Ingested {ingested_count} curated content entries.")


if __name__ == "__main__":
    main()
