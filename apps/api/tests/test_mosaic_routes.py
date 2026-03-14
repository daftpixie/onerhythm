from __future__ import annotations

import unittest
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.requests import Request

from app.api.routes.mosaic import list_mosaic_tiles
from app.db.base import Base
from app.db.models import MosaicTile, UploadSession, User
from app.services.artistic_transform import MOSAIC_TILE_VERSION, RENDER_VERSION


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MosaicRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def _seed_tiles(self) -> None:
        db = self.SessionLocal()
        now = utcnow()
        user = User(
            user_id=str(uuid4()),
            email="mosaic@example.com",
            password_hash="hash",
            preferred_language="en",
        )
        visible_session = UploadSession(
            upload_session_id=str(uuid4()),
            user_id=user.user_id,
            profile_id=None,
            upload_format="png",
            processing_status="completed",
            consent_record_ids=[],
            phi_redaction_applied=True,
            raw_upload_retained=False,
            processing_pipeline_version="pipeline-v2",
            started_at=now,
            completed_at=now,
        )
        hidden_session = UploadSession(
            upload_session_id=str(uuid4()),
            user_id=user.user_id,
            profile_id=None,
            upload_format="png",
            processing_status="completed",
            consent_record_ids=[],
            phi_redaction_applied=True,
            raw_upload_retained=False,
            processing_pipeline_version="pipeline-v2",
            started_at=now,
            completed_at=now,
        )
        db.add(user)
        db.add(visible_session)
        db.add(hidden_session)
        db.flush()
        db.add(
            MosaicTile(
                tile_id=str(uuid4()),
                source_upload_session_id=visible_session.upload_session_id,
                condition_category="afib",
                display_date=now.date().isoformat(),
                is_public=True,
                visibility_status="visible",
                tile_version=MOSAIC_TILE_VERSION,
                render_version=RENDER_VERSION,
                visual_style={
                    "color_family": "signal",
                    "opacity": 0.74,
                    "texture_kind": "grain",
                    "glow_level": "bright",
                },
                contributed_at=now,
            )
        )
        db.add(
            MosaicTile(
                tile_id=str(uuid4()),
                source_upload_session_id=hidden_session.upload_session_id,
                condition_category="svt",
                display_date=now.date().isoformat(),
                is_public=False,
                visibility_status="hidden",
                tile_version=MOSAIC_TILE_VERSION,
                render_version=RENDER_VERSION,
                visual_style={
                    "color_family": "pulse",
                    "opacity": 0.6,
                    "texture_kind": "smooth",
                    "glow_level": "subtle",
                },
                contributed_at=now,
            )
        )
        db.commit()
        db.close()

    def test_list_tiles_returns_versioned_anonymous_metadata_only(self) -> None:
        self._seed_tiles()
        db = self.SessionLocal()
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/v1/mosaic/tiles",
                "headers": [(b"x-forwarded-for", f"test-{uuid4()}".encode("utf-8"))],
                "query_string": b"",
                "client": ("127.0.0.1", 12345),
            }
        )

        try:
            response = list_mosaic_tiles(request=request, limit=45, db=db)
        finally:
            db.close()

        self.assertEqual(len(response), 1)
        tile = response[0].model_dump(mode="json")
        self.assertEqual(tile["tile_version"], MOSAIC_TILE_VERSION)
        self.assertEqual(tile["render_version"], RENDER_VERSION)
        self.assertEqual(tile["condition_category"], "afib")
        self.assertEqual(tile["visual_style"]["texture_kind"], "grain")
        self.assertNotIn("profile_id", tile)
        self.assertNotIn("upload_session_id", tile)
        self.assertNotIn("source_upload_session_id", tile)
        self.assertNotIn("visibility_status", tile)


if __name__ == "__main__":
    unittest.main()
