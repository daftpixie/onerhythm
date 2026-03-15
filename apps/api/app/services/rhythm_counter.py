"""Contribution distance policy and aggregate tracking.

OneRhythm's shared rhythm distance is not derived from artistic-tile pixels and
is not a clinical ECG measurement. Instead, the contribution metric uses a
small, explicit document-layout policy based on common ECG paper conventions:

- standard 3x4 12-lead page plus long rhythm strip -> 10 seconds @ 25 mm/s -> 25 cm
- standard single lead segment -> 2.5 seconds @ 25 mm/s -> 6.25 cm
- uncertain timing/layout -> documented fallback of 1 Rhythm Unit -> 6.25 cm

This keeps the number explainable, testable, and non-diagnostic.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import uuid4
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import MilestoneEvent, MosaicTile, RhythmDistanceAggregate, utcnow

logger = logging.getLogger(__name__)

EARTH_CIRCUMFERENCE_KM = 40_075.0
MOON_DISTANCE_KM = 384_400.0
SUN_DISTANCE_KM = 149_600_000.0
ISS_ORBIT_KM = 408.0

SINGLETON_AGGREGATE_ID = "rhythm-distance-singleton"
STANDARD_PAPER_SPEED_MM_PER_SEC = 25
STANDARD_LONG_RHYTHM_STRIP_SECONDS = 10.0
STANDARD_SINGLE_SEGMENT_SECONDS = 2.5
STANDARD_LONG_RHYTHM_STRIP_CM = 25.0
STANDARD_SINGLE_SEGMENT_CM = 6.25
FALLBACK_RHYTHM_UNIT_CM = STANDARD_SINGLE_SEGMENT_CM


@dataclass(frozen=True)
class MilestoneDefinition:
    key: str
    label: str
    distance_km: float
    description: str


MILESTONES: list[MilestoneDefinition] = [
    MilestoneDefinition(
        key="iss_orbit",
        label="ISS Orbit",
        distance_km=ISS_ORBIT_KM,
        description="Our shared rhythm has circled the International Space Station.",
    ),
    MilestoneDefinition(
        key="earth_circumference",
        label="Around the Earth",
        distance_km=EARTH_CIRCUMFERENCE_KM,
        description="Our shared rhythm has wrapped around the planet.",
    ),
    MilestoneDefinition(
        key="moon_distance",
        label="To the Moon",
        distance_km=MOON_DISTANCE_KM,
        description="Our shared rhythm has reached the Moon.",
    ),
    MilestoneDefinition(
        key="sun_distance",
        label="To the Sun",
        distance_km=SUN_DISTANCE_KM,
        description="Our shared rhythm has reached the Sun.",
    ),
]


@dataclass(frozen=True)
class RhythmDistanceStats:
    total_distance_km: float
    total_contributions: int
    earth_loops: float
    current_milestone: MilestoneDefinition | None
    next_milestone: MilestoneDefinition | None
    progress_toward_next: float
    last_contribution_at: str | None


@dataclass(frozen=True)
class ContributionDistanceResult:
    distance_cm: float
    policy_id: str
    label: str
    rationale: str
    provenance: str
    inferred_layout: str
    paper_speed_mm_per_sec: int | None
    fallback_used: bool

    def to_summary(self) -> dict:
        return {
            "distance_cm": self.distance_cm,
            "policy_id": self.policy_id,
            "label": self.label,
            "rationale": self.rationale,
            "provenance": self.provenance,
            "inferred_layout": self.inferred_layout,
            "paper_speed_mm_per_sec": self.paper_speed_mm_per_sec,
            "fallback_used": self.fallback_used,
        }


def determine_contribution_distance(
    *,
    redaction_summary: dict | None,
) -> ContributionDistanceResult:
    """Map a safe OCR/layout summary to a documented shared-distance policy.

    The policy is intentionally simple and conservative. We only need enough
    information to represent the document's contribution to the shared artwork,
    not to interpret a clinical waveform.
    """
    layout = ((redaction_summary or {}).get("ocr_redaction") or {}).get("document_layout") or {}
    paper_speed = layout.get("paper_speed_mm_per_sec")
    layout_kind = str(layout.get("layout_kind") or "unknown")
    layout_confidence = str(layout.get("layout_confidence") or "low")
    standard_twelve_lead_detected = bool(layout.get("standard_twelve_lead_detected"))
    long_rhythm_strip_detected = bool(layout.get("long_rhythm_strip_detected"))
    lead_label_count = int(layout.get("detected_lead_label_count") or 0)

    if (
        (standard_twelve_lead_detected or lead_label_count >= 8)
        and long_rhythm_strip_detected
        and paper_speed in {None, 25}
    ):
        return ContributionDistanceResult(
            distance_cm=STANDARD_LONG_RHYTHM_STRIP_CM,
            policy_id="standard_12_lead_long_strip",
            label="Standard 10-second rhythm strip",
            rationale=(
                "Count the contribution as the canonical long rhythm strip from a standard "
                "3x4 twelve-lead ECG page."
            ),
            provenance=(
                "Inferred a standard 12-lead layout with a long rhythm strip. "
                "Applied the canonical 10 seconds at 25 mm/sec -> 25 cm policy."
            ),
            inferred_layout="standard_12_lead_with_long_strip",
            paper_speed_mm_per_sec=STANDARD_PAPER_SPEED_MM_PER_SEC,
            fallback_used=False,
        )

    if layout_kind == "single_lead_segment" and paper_speed in {None, 25} and lead_label_count == 1:
        return ContributionDistanceResult(
            distance_cm=STANDARD_SINGLE_SEGMENT_CM,
            policy_id="standard_single_segment",
            label="Standard 2.5-second segment",
            rationale=(
                "Count the contribution as one standard single-lead segment when the document "
                "does not confidently indicate a full long-strip page."
            ),
            provenance=(
                "Detected one lead label without a full twelve-lead layout. "
                "Applied the canonical 2.5 seconds at 25 mm/sec -> 6.25 cm policy."
            ),
            inferred_layout="single_lead_segment",
            paper_speed_mm_per_sec=STANDARD_PAPER_SPEED_MM_PER_SEC if paper_speed in {None, 25} else paper_speed,
            fallback_used=False,
        )

    if (
        (standard_twelve_lead_detected or lead_label_count >= 8)
        and layout_confidence in {"medium", "high"}
        and paper_speed in {None, 25}
    ):
        return ContributionDistanceResult(
            distance_cm=STANDARD_LONG_RHYTHM_STRIP_CM,
            policy_id="standard_12_lead_canonical_long_strip",
            label="Canonical long-strip page",
            rationale=(
                "When the page confidently matches the common twelve-lead layout and no non-standard "
                "paper speed is detected, v1 treats the contribution as a canonical long rhythm strip."
            ),
            provenance=(
                "Detected the full twelve-lead label set. No contradictory paper speed was found, "
                "so the v1 canonical long-strip policy was applied -> 25 cm."
            ),
            inferred_layout="standard_12_lead",
            paper_speed_mm_per_sec=STANDARD_PAPER_SPEED_MM_PER_SEC,
            fallback_used=False,
        )

    return ContributionDistanceResult(
        distance_cm=FALLBACK_RHYTHM_UNIT_CM,
        policy_id="fallback_one_rhythm_unit",
        label="1 Rhythm Unit fallback",
        rationale=(
            "When timing metadata cannot be inferred confidently, use one explicit fallback unit "
            "instead of an opaque fractional centimeter value."
        ),
        provenance=(
            "Layout/timing could not be confirmed from the safe OCR summary, so the documented "
            f"1 Rhythm Unit fallback was used -> {FALLBACK_RHYTHM_UNIT_CM} cm."
        ),
        inferred_layout=layout_kind,
        paper_speed_mm_per_sec=paper_speed,
        fallback_used=True,
    )


def record_rhythm_distance(
    db: Session,
    *,
    tile_id: str,
    distance_cm: float,
) -> None:
    """Atomically update the tile's rhythm_distance_cm and the aggregate row."""
    tile = db.query(MosaicTile).filter(MosaicTile.tile_id == tile_id).one()
    tile.rhythm_distance_cm = distance_cm

    now = utcnow()
    aggregate = (
        db.query(RhythmDistanceAggregate)
        .filter(RhythmDistanceAggregate.aggregate_id == SINGLETON_AGGREGATE_ID)
        .with_for_update()
        .one_or_none()
    )
    if aggregate is None:
        aggregate = RhythmDistanceAggregate(
            aggregate_id=SINGLETON_AGGREGATE_ID,
            total_distance_cm=distance_cm,
            total_contributions=1,
            last_contribution_at=now,
            updated_at=now,
        )
        db.add(aggregate)
    else:
        aggregate.total_distance_cm += distance_cm
        aggregate.total_contributions += 1
        aggregate.last_contribution_at = now
        aggregate.updated_at = now

    db.flush()

    _check_milestone_crossing(db, aggregate)


def rebuild_rhythm_distance_aggregate(db: Session) -> RhythmDistanceAggregate:
    """Recompute the aggregate row from current retained tile metadata."""
    total_distance_cm, total_contributions, last_contribution_at = db.query(
        func.coalesce(func.sum(MosaicTile.rhythm_distance_cm), 0.0),
        func.count(MosaicTile.tile_id),
        func.max(MosaicTile.contributed_at),
    ).one()

    aggregate = (
        db.query(RhythmDistanceAggregate)
        .filter(RhythmDistanceAggregate.aggregate_id == SINGLETON_AGGREGATE_ID)
        .with_for_update()
        .one_or_none()
    )
    now = utcnow()

    if aggregate is None:
        aggregate = RhythmDistanceAggregate(
            aggregate_id=SINGLETON_AGGREGATE_ID,
            total_distance_cm=float(total_distance_cm or 0.0),
            total_contributions=int(total_contributions or 0),
            last_contribution_at=last_contribution_at,
            updated_at=now,
        )
        db.add(aggregate)
    else:
        aggregate.total_distance_cm = float(total_distance_cm or 0.0)
        aggregate.total_contributions = int(total_contributions or 0)
        aggregate.last_contribution_at = last_contribution_at
        aggregate.updated_at = now

    db.flush()
    return aggregate


def _check_milestone_crossing(
    db: Session,
    aggregate: RhythmDistanceAggregate,
) -> None:
    """Insert milestone_events rows for any newly crossed milestones."""
    total_km = aggregate.total_distance_cm / 100_000.0
    for milestone in MILESTONES:
        if total_km >= milestone.distance_km:
            existing = (
                db.query(MilestoneEvent)
                .filter(MilestoneEvent.milestone_key == milestone.key)
                .one_or_none()
            )
            if existing is None:
                db.add(
                    MilestoneEvent(
                        milestone_event_id=str(uuid4()),
                        milestone_key=milestone.key,
                        reached_at=utcnow(),
                        distance_at_crossing_km=total_km,
                        contribution_count=aggregate.total_contributions,
                    )
                )
    db.flush()


def get_rhythm_distance_stats(db: Session) -> RhythmDistanceStats:
    """Read aggregate table and compute milestone progress."""
    aggregate = (
        db.query(RhythmDistanceAggregate)
        .filter(RhythmDistanceAggregate.aggregate_id == SINGLETON_AGGREGATE_ID)
        .one_or_none()
    )

    if aggregate is None:
        return RhythmDistanceStats(
            total_distance_km=0.0,
            total_contributions=0,
            earth_loops=0.0,
            current_milestone=None,
            next_milestone=MILESTONES[0] if MILESTONES else None,
            progress_toward_next=0.0,
            last_contribution_at=None,
        )

    total_km = aggregate.total_distance_cm / 100_000.0
    earth_loops = total_km / EARTH_CIRCUMFERENCE_KM if EARTH_CIRCUMFERENCE_KM > 0 else 0.0

    current_milestone: MilestoneDefinition | None = None
    next_milestone: MilestoneDefinition | None = None
    for milestone in MILESTONES:
        if total_km >= milestone.distance_km:
            current_milestone = milestone
        else:
            next_milestone = milestone
            break

    if next_milestone is not None:
        prev_km = current_milestone.distance_km if current_milestone else 0.0
        span = next_milestone.distance_km - prev_km
        progress = (total_km - prev_km) / span if span > 0 else 0.0
        progress_toward_next = min(max(progress, 0.0), 1.0)
    else:
        progress_toward_next = 1.0

    last_at = (
        aggregate.last_contribution_at.isoformat()
        if aggregate.last_contribution_at
        else None
    )

    return RhythmDistanceStats(
        total_distance_km=round(total_km, 4),
        total_contributions=aggregate.total_contributions,
        earth_loops=round(earth_loops, 6),
        current_milestone=current_milestone,
        next_milestone=next_milestone,
        progress_toward_next=round(progress_toward_next, 4),
        last_contribution_at=last_at,
    )


@dataclass(frozen=True)
class AchievedMilestone:
    milestone_key: str
    label: str
    distance_km: float
    description: str
    reached_at: str
    distance_at_crossing_km: float
    contribution_count: int


def get_achieved_milestones(db: Session) -> list[AchievedMilestone]:
    """Return all achieved milestones with their crossing data."""
    milestone_map = {m.key: m for m in MILESTONES}
    events = (
        db.query(MilestoneEvent)
        .order_by(MilestoneEvent.reached_at.asc())
        .all()
    )
    results: list[AchievedMilestone] = []
    for event in events:
        definition = milestone_map.get(event.milestone_key)
        if definition is None:
            continue
        results.append(
            AchievedMilestone(
                milestone_key=event.milestone_key,
                label=definition.label,
                distance_km=definition.distance_km,
                description=definition.description,
                reached_at=event.reached_at.isoformat(),
                distance_at_crossing_km=event.distance_at_crossing_km,
                contribution_count=event.contribution_count,
            )
        )
    return results
