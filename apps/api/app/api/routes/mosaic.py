from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Query, Request

from app.api.contracts import MosaicStatsResponse, MosaicTileResponse
from app.api.db import get_db
from app.db.models import MosaicTile
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings

router = APIRouter(prefix="/mosaic", tags=["mosaic"])
settings = get_settings()

VISIBLE_STATUSES = {"visible"}
PUBLIC_MOSAIC_RENDER_LIMIT = 45


def _public_mosaic_query(db: Session):
    return db.query(MosaicTile).filter(
        MosaicTile.is_public.is_(True),
        MosaicTile.visibility_status.in_(VISIBLE_STATUSES),
    )


@router.get(
    "/stats",
    response_model=MosaicStatsResponse,
)
def get_mosaic_stats(request: Request, db: Session = Depends(get_db)) -> MosaicStatsResponse:
    rate_limiter.check(
        key=f"public:mosaic:stats:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    public_query = _public_mosaic_query(db)
    total_tiles = db.query(func.count(MosaicTile.tile_id)).scalar() or 0
    public_tiles = public_query.with_entities(func.count(MosaicTile.tile_id)).scalar() or 0
    latest_contribution_at = public_query.with_entities(func.max(MosaicTile.contributed_at)).scalar()
    visible_condition_categories = [
        condition
        for (condition,) in public_query.with_entities(MosaicTile.condition_category)
        .distinct()
        .order_by(MosaicTile.condition_category.asc())
        .all()
    ]

    return MosaicStatsResponse(
        total_tiles=total_tiles,
        public_tiles=public_tiles,
        render_tile_limit=PUBLIC_MOSAIC_RENDER_LIMIT,
        has_more_public_tiles=public_tiles > PUBLIC_MOSAIC_RENDER_LIMIT,
        visible_condition_categories=visible_condition_categories,
        latest_contribution_at=latest_contribution_at,
    )


@router.get(
    "/tiles",
    response_model=list[MosaicTileResponse],
)
def list_mosaic_tiles(
    request: Request,
    limit: int = Query(default=PUBLIC_MOSAIC_RENDER_LIMIT, ge=1, le=180),
    db: Session = Depends(get_db),
) -> list[MosaicTileResponse]:
    rate_limiter.check(
        key=f"public:mosaic:tiles:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    tiles = (
        _public_mosaic_query(db)
        .order_by(MosaicTile.contributed_at.desc(), MosaicTile.tile_id.asc())
        .limit(limit)
        .all()
    )

    return [
        MosaicTileResponse(
            tile_id=tile.tile_id,
            condition_category=tile.condition_category,
            contributed_at=tile.contributed_at,
            is_public=tile.is_public,
            display_date=tile.display_date,
            tile_version=tile.tile_version,
            render_version=tile.render_version,
            visual_style=tile.visual_style,
            rhythm_distance_cm=tile.rhythm_distance_cm,
        )
        for tile in tiles
    ]
