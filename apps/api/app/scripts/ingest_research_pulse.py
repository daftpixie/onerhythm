from __future__ import annotations

from app.db.session import SessionLocal
from app.services.research_pulse import ingest_research_pulse_seed


def main() -> None:
    db = SessionLocal()
    try:
        ingested_count = ingest_research_pulse_seed(db)
    finally:
        db.close()

    print(f"Ingested {ingested_count} Research Pulse entries.")


if __name__ == "__main__":
    main()
