from __future__ import annotations

import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import MosaicTile, RhythmDistanceAggregate
from app.services.rhythm_counter import (
    EARTH_CIRCUMFERENCE_KM,
    ISS_ORBIT_KM,
    SINGLETON_AGGREGATE_ID,
    determine_contribution_distance,
    get_rhythm_distance_stats,
    record_rhythm_distance,
)


def _make_test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _seed_tile(db, tile_id: str) -> None:
    db.add(
        MosaicTile(
            tile_id=tile_id,
            source_upload_session_id=f"session-{tile_id}",
            condition_category="other",
            display_date="2026-03-14",
            is_public=True,
            visibility_status="visible",
            tile_version=1,
            render_version="artistic-abstract-v1",
            visual_style={
                "color_family": "pulse",
                "opacity": 0.7,
                "texture_kind": "smooth",
                "glow_level": "none",
            },
            contributed_at=datetime.now(timezone.utc),
        )
    )
    db.flush()


class DetermineContributionDistanceTests(unittest.TestCase):
    def test_standard_10_second_long_strip_counts_as_25_cm(self) -> None:
        result = determine_contribution_distance(
            redaction_summary={
                "ocr_redaction": {
                    "document_layout": {
                        "layout_kind": "standard_12_lead_with_long_strip",
                        "layout_confidence": "high",
                        "paper_speed_mm_per_sec": 25,
                        "detected_lead_label_count": 12,
                        "standard_twelve_lead_detected": True,
                        "long_rhythm_strip_detected": True,
                    }
                }
            }
        )

        self.assertEqual(result.distance_cm, 25.0)
        self.assertEqual(result.policy_id, "standard_12_lead_long_strip")
        self.assertFalse(result.fallback_used)

    def test_standard_single_segment_counts_as_6_25_cm(self) -> None:
        result = determine_contribution_distance(
            redaction_summary={
                "ocr_redaction": {
                    "document_layout": {
                        "layout_kind": "single_lead_segment",
                        "layout_confidence": "medium",
                        "paper_speed_mm_per_sec": 25,
                        "detected_lead_label_count": 1,
                        "standard_twelve_lead_detected": False,
                        "long_rhythm_strip_detected": False,
                    }
                }
            }
        )

        self.assertEqual(result.distance_cm, 6.25)
        self.assertEqual(result.policy_id, "standard_single_segment")
        self.assertFalse(result.fallback_used)

    def test_uncertain_layout_uses_explicit_fallback(self) -> None:
        result = determine_contribution_distance(
            redaction_summary={
                "ocr_redaction": {
                    "document_layout": {
                        "layout_kind": "unknown",
                        "layout_confidence": "low",
                        "paper_speed_mm_per_sec": None,
                        "detected_lead_label_count": 0,
                        "standard_twelve_lead_detected": False,
                        "long_rhythm_strip_detected": False,
                    }
                }
            }
        )

        self.assertEqual(result.distance_cm, 6.25)
        self.assertEqual(result.policy_id, "fallback_one_rhythm_unit")
        self.assertTrue(result.fallback_used)
        self.assertIn("1 Rhythm Unit fallback", result.label)


class RecordRhythmDistanceTests(unittest.TestCase):
    def test_creates_aggregate_on_first_call(self) -> None:
        db = _make_test_db()
        _seed_tile(db, "tile-1")
        record_rhythm_distance(db, tile_id="tile-1", distance_cm=25.0)

        tile = db.query(MosaicTile).filter(MosaicTile.tile_id == "tile-1").one()
        self.assertEqual(tile.rhythm_distance_cm, 25.0)

        aggregate = db.query(RhythmDistanceAggregate).one()
        self.assertEqual(aggregate.total_distance_cm, 25.0)
        self.assertEqual(aggregate.total_contributions, 1)
        db.close()

    def test_accumulates_across_multiple_calls(self) -> None:
        db = _make_test_db()
        _seed_tile(db, "tile-a")
        _seed_tile(db, "tile-b")
        record_rhythm_distance(db, tile_id="tile-a", distance_cm=25.0)
        record_rhythm_distance(db, tile_id="tile-b", distance_cm=6.25)

        aggregate = db.query(RhythmDistanceAggregate).one()
        self.assertAlmostEqual(aggregate.total_distance_cm, 31.25)
        self.assertEqual(aggregate.total_contributions, 2)
        db.close()


class GetRhythmDistanceStatsTests(unittest.TestCase):
    def test_zero_contributions(self) -> None:
        db = _make_test_db()
        stats = get_rhythm_distance_stats(db)
        self.assertEqual(stats.total_distance_km, 0.0)
        self.assertEqual(stats.total_contributions, 0)
        self.assertIsNone(stats.current_milestone)
        self.assertIsNotNone(stats.next_milestone)
        self.assertEqual(stats.next_milestone.key, "iss_orbit")
        self.assertEqual(stats.progress_toward_next, 0.0)
        db.close()

    def test_milestone_progression_past_iss(self) -> None:
        db = _make_test_db()
        target_km = ISS_ORBIT_KM + (EARTH_CIRCUMFERENCE_KM - ISS_ORBIT_KM) * 0.1
        target_cm = target_km * 100_000
        db.add(
            RhythmDistanceAggregate(
                aggregate_id=SINGLETON_AGGREGATE_ID,
                total_distance_cm=target_cm,
                total_contributions=1000,
                last_contribution_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.flush()

        stats = get_rhythm_distance_stats(db)
        self.assertIsNotNone(stats.current_milestone)
        self.assertEqual(stats.current_milestone.key, "iss_orbit")
        self.assertIsNotNone(stats.next_milestone)
        self.assertEqual(stats.next_milestone.key, "earth_circumference")
        self.assertGreater(stats.progress_toward_next, 0.0)
        self.assertLess(stats.progress_toward_next, 1.0)
        db.close()

    def test_earth_loops_calculation(self) -> None:
        db = _make_test_db()
        two_earths_cm = EARTH_CIRCUMFERENCE_KM * 2 * 100_000
        db.add(
            RhythmDistanceAggregate(
                aggregate_id=SINGLETON_AGGREGATE_ID,
                total_distance_cm=two_earths_cm,
                total_contributions=10000,
                last_contribution_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.flush()

        stats = get_rhythm_distance_stats(db)
        self.assertAlmostEqual(stats.earth_loops, 2.0, places=4)
        db.close()


if __name__ == "__main__":
    unittest.main()
