from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.contracts import (
    AchievedMilestoneResponse,
    MilestoneDefinitionModel,
    RhythmDistanceStatsResponse,
)
from app.api.db import get_db
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings
from app.services.rhythm_counter import get_achieved_milestones, get_rhythm_distance_stats

router = APIRouter(prefix="/rhythm", tags=["rhythm"])
settings = get_settings()


@router.get(
    "/stats",
    response_model=RhythmDistanceStatsResponse,
)
def get_rhythm_stats(
    request: Request, db: Session = Depends(get_db)
) -> RhythmDistanceStatsResponse:
    rate_limiter.check(
        key=f"public:rhythm:stats:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    stats = get_rhythm_distance_stats(db)
    return RhythmDistanceStatsResponse(
        total_distance_km=stats.total_distance_km,
        total_contributions=stats.total_contributions,
        earth_loops=stats.earth_loops,
        current_milestone=(
            MilestoneDefinitionModel(
                key=stats.current_milestone.key,
                label=stats.current_milestone.label,
                distance_km=stats.current_milestone.distance_km,
                description=stats.current_milestone.description,
            )
            if stats.current_milestone
            else None
        ),
        next_milestone=(
            MilestoneDefinitionModel(
                key=stats.next_milestone.key,
                label=stats.next_milestone.label,
                distance_km=stats.next_milestone.distance_km,
                description=stats.next_milestone.description,
            )
            if stats.next_milestone
            else None
        ),
        progress_toward_next=stats.progress_toward_next,
        last_contribution_at=stats.last_contribution_at,
    )


@router.get(
    "/milestones",
    response_model=list[AchievedMilestoneResponse],
)
def list_achieved_milestones(
    request: Request, db: Session = Depends(get_db)
) -> list[AchievedMilestoneResponse]:
    rate_limiter.check(
        key=f"public:rhythm:milestones:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    milestones = get_achieved_milestones(db)
    return [
        AchievedMilestoneResponse(
            milestone_key=m.milestone_key,
            label=m.label,
            distance_km=m.distance_km,
            description=m.description,
            reached_at=m.reached_at,
            distance_at_crossing_km=m.distance_at_crossing_km,
            contribution_count=m.contribution_count,
        )
        for m in milestones
    ]
