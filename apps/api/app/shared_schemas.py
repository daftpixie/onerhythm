from __future__ import annotations

import json
from pathlib import Path

_THIS_FILE = Path(__file__).resolve()
APP_SCHEMA_ROOT = _THIS_FILE.parent / "schemas"
REPO_SCHEMA_ROOT = (
    _THIS_FILE.parents[3] / "packages" / "types" / "src" / "schemas"
    if len(_THIS_FILE.parents) > 3
    else None
)


def load_shared_schema(schema_name: str) -> dict:
    schema_filename = f"{schema_name}.json"
    for root in (APP_SCHEMA_ROOT, REPO_SCHEMA_ROOT):
        if root is None:
            continue
        schema_path = root / schema_filename
        if schema_path.exists():
            with schema_path.open("r", encoding="utf-8") as schema_file:
                return json.load(schema_file)
    raise FileNotFoundError(
        f"Shared schema {schema_filename} was not found in {APP_SCHEMA_ROOT} or {REPO_SCHEMA_ROOT}."
    )


EDUCATIONAL_CONTENT_RESPONSE_SCHEMA = load_shared_schema(
    "educational-content-response"
)
