import logging
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.contracts import APIErrorResponse
from app.api.errors import APIContractError
from app.api.db import get_db
from app.api.routes import api_router
from app.error_reporting import report_exception
from app.logging_config import configure_logging
from app.request_context import get_request_id, reset_request_id, set_request_id
from app.response_security import build_response_security_headers
from app.runtime import SettingsValidationError, get_settings
from app.shared_schemas import EDUCATIONAL_CONTENT_RESPONSE_SCHEMA

settings = get_settings()
configure_logging(settings)
logger = logging.getLogger("onerhythm.api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        settings.validate()
    except SettingsValidationError:
        logger.exception("Startup configuration validation failed", extra={"event_type": "startup.invalid_config"})
        raise
    logger.info(
        "OneRhythm API startup complete",
        extra={"event_type": "startup.ready"},
    )
    yield


app = FastAPI(title="OneRhythm API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get(settings.request_id_header) or str(uuid4())
    token = set_request_id(request_id)
    started_at = perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
    finally:
        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        logger.info(
            "Request completed",
            extra={
                "event_type": "http.request.completed",
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "duration_ms": duration_ms,
            },
        )
        reset_request_id(token)
    for header_name, header_value in build_response_security_headers(
        path=request.url.path,
        settings=settings,
    ).items():
        response.headers[header_name] = header_value
    response.headers[settings.request_id_header] = request_id
    return response


@app.exception_handler(APIContractError)
def handle_api_contract_error(
    request: Request,
    exc: APIContractError,
) -> JSONResponse:
    payload = APIErrorResponse(
        error={
            "code": exc.code,
            "message": exc.message,
            "details": {**exc.details, "request_id": get_request_id()},
        }
    )
    logger.warning(
        "API contract error",
        extra={
            "event_type": "http.request.error",
            "method": request.method,
            "path": request.url.path,
            "status_code": exc.status_code,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(mode="json"),
        headers={settings.request_id_header: get_request_id()},
    )


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    report_exception(exc, request=request)
    payload = APIErrorResponse(
        error={
            "code": "internal_server_error",
            "message": "The server could not complete this request.",
            "details": {"request_id": get_request_id()},
        }
    )
    return JSONResponse(
        status_code=500,
        content=payload.model_dump(mode="json"),
        headers={settings.request_id_header: get_request_id()},
    )


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "environment": settings.env_name,
        "shared_educational_schema_loaded": bool(EDUCATIONAL_CONTENT_RESPONSE_SCHEMA),
    }


@app.get("/ready")
def readiness() -> dict[str, str | bool]:
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as exc:
        report_exception(exc)
        raise APIContractError(
            code="service_not_ready",
            message="The service is not ready to serve requests.",
            status_code=503,
            details={"database": False},
        ) from exc
    return {
        "status": "ready",
        "database": True,
        "shared_educational_schema_loaded": bool(EDUCATIONAL_CONTENT_RESPONSE_SCHEMA),
    }
