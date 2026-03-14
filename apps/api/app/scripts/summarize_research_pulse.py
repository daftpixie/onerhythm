from __future__ import annotations

import sys

from app.db.session import SessionLocal
from app.services.research_pulse import summarize_research_pulse_publications


def main() -> None:
    args = sys.argv[1:]
    locale = "en-US"
    limit = 20
    publication_ids: list[str] = []

    index = 0
    while index < len(args):
        arg = args[index]
        if arg == "--locale" and index + 1 < len(args):
            locale = args[index + 1]
            index += 2
            continue
        if arg == "--limit" and index + 1 < len(args):
            limit = int(args[index + 1])
            index += 2
            continue
        publication_ids.append(arg)
        index += 1

    db = SessionLocal()
    try:
        summarized = summarize_research_pulse_publications(
            db,
            locale=locale,
            publication_ids=publication_ids or None,
            limit=limit,
        )
    finally:
        db.close()

    print(f"Summarized {summarized} Research Pulse publications.")


if __name__ == "__main__":
    main()
