from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import BetaAllowlist
from app.runtime import AppSettings


def resolve_beta_access_state(
    *,
    db: Session,
    email: str,
    settings: AppSettings,
) -> str:
    if settings.beta_mode != "invite_only":
        return "not_required"

    allowlisted_email = (
        db.query(BetaAllowlist.email)
        .filter(BetaAllowlist.email == email)
        .one_or_none()
    )
    return "granted" if allowlisted_email is not None else "pending"
