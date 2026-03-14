from __future__ import annotations

import json
from pathlib import Path


SCHEMA_ROOT = (
    Path(__file__).resolve().parents[3] / "packages" / "types" / "src" / "schemas"
)


def load_shared_schema(schema_name: str) -> dict:
    schema_path = SCHEMA_ROOT / f"{schema_name}.json"
    with schema_path.open("r", encoding="utf-8") as schema_file:
        return json.load(schema_file)


EDUCATIONAL_CONTENT_RESPONSE_SCHEMA = load_shared_schema(
    "educational-content-response"
)
