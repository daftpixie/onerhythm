from fastapi import APIRouter, Depends

from app.api.routes.analytics import router as analytics_router
from app.api.routes.beta_access import router as beta_access_router
from app.api.routes.auth import router as auth_router
from app.api.routes.community_stories import router as community_stories_router
from app.api.routes.consent import router as consent_router
from app.api.routes.delete_requests import router as delete_requests_router
from app.api.routes.educational_content import router as educational_content_router
from app.api.routes.export_requests import router as export_requests_router
from app.api.routes.mosaic import router as mosaic_router
from app.api.routes.profiles import router as profiles_router
from app.api.routes.rhythm import router as rhythm_router
from app.api.routes.research_pulse import router as research_pulse_router
from app.api.routes.upload_sessions import router as upload_sessions_router
from app.request_security import enforce_trusted_browser_origin

api_router = APIRouter(
    prefix="/v1",
    dependencies=[Depends(enforce_trusted_browser_origin)],
)
api_router.include_router(beta_access_router)
api_router.include_router(analytics_router)
api_router.include_router(auth_router)
api_router.include_router(research_pulse_router)
api_router.include_router(profiles_router)
api_router.include_router(consent_router)
api_router.include_router(community_stories_router)
api_router.include_router(export_requests_router)
api_router.include_router(delete_requests_router)
api_router.include_router(upload_sessions_router)
api_router.include_router(mosaic_router)
api_router.include_router(rhythm_router)
api_router.include_router(educational_content_router)
