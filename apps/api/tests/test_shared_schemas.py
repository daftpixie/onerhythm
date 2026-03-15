from __future__ import annotations

import unittest
from unittest.mock import patch

from app.shared_schemas import load_shared_schema


class SharedSchemaTests(unittest.TestCase):
    def test_load_shared_schema_works_from_packaged_app_schema_directory(self) -> None:
        with patch("app.shared_schemas.REPO_SCHEMA_ROOT", None):
            schema = load_shared_schema("educational-content-response")

        self.assertEqual(schema["title"], "EducationalContentResponse")
        self.assertEqual(
            schema["properties"]["self_reported_profile_snapshot"]["properties"]["diagnosis_selection"]["$ref"],
            "./diagnosis-selection.json",
        )


if __name__ == "__main__":
    unittest.main()
