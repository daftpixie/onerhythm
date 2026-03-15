from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


case_insensitive_text = String(320).with_variant(postgresql.CITEXT(), "postgresql")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(24), nullable=False, default="user")
    preferred_language: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)
    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user")


class Profile(Base):
    __tablename__ = "profiles"

    profile_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), unique=True
    )
    display_name: Mapped[str | None] = mapped_column(String(120))
    diagnosis_code: Mapped[str] = mapped_column(String(32), nullable=False)
    diagnosis_source: Mapped[str] = mapped_column(String(32), nullable=False)
    free_text_condition: Mapped[str | None] = mapped_column(Text)
    physical_symptoms: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    emotional_context: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    ablation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    has_implantable_device: Mapped[bool | None] = mapped_column(Boolean)
    current_medications: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    prior_procedures: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    personal_narrative: Mapped[str | None] = mapped_column(Text)
    profile_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="profile")
    consent_records: Mapped[list["ConsentRecord"]] = relationship(back_populates="profile")
    export_requests: Mapped[list["ExportRequest"]] = relationship(back_populates="profile")
    delete_requests: Mapped[list["DeleteRequest"]] = relationship(back_populates="profile")
    upload_sessions: Mapped[list["UploadSession"]] = relationship(back_populates="profile")
    stories: Mapped[list["CommunityStory"]] = relationship(back_populates="profile")


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    consent_record_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    consent_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    policy_version: Mapped[str] = mapped_column(String(32), nullable=False)
    locale: Mapped[str] = mapped_column(String(16), nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    effective_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revocation_reason: Mapped[str | None] = mapped_column(String(120))

    profile: Mapped[Profile] = relationship(back_populates="consent_records")


class ExportRequest(Base):
    __tablename__ = "export_requests"

    export_request_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    download_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    artifact_path: Mapped[str | None] = mapped_column(String(255))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    profile: Mapped[Profile] = relationship(back_populates="export_requests")


class DeleteRequest(Base):
    __tablename__ = "delete_requests"

    delete_request_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    audit_retention_reason: Mapped[str | None] = mapped_column(String(255))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    profile: Mapped[Profile] = relationship(back_populates="delete_requests")


class UploadSession(Base):
    __tablename__ = "upload_sessions"

    upload_session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="SET NULL")
    )
    upload_format: Mapped[str] = mapped_column(String(16), nullable=False)
    processing_status: Mapped[str] = mapped_column(String(24), nullable=False)
    consent_record_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    phi_redaction_applied: Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw_upload_retained: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    processing_pipeline_version: Mapped[str] = mapped_column(String(32), nullable=False)
    raw_upload_destroyed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    redaction_summary: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    anonymization_summary: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resulting_tile_id: Mapped[str | None] = mapped_column(String(36))
    failure_reason: Mapped[str | None] = mapped_column(Text)

    profile: Mapped[Profile | None] = relationship(back_populates="upload_sessions")
    user: Mapped[User] = relationship()
    processing_jobs: Mapped[list["ProcessingJob"]] = relationship(back_populates="upload_session")
    mosaic_tile: Mapped["MosaicTile | None"] = relationship(back_populates="upload_session")


class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    user_agent: Mapped[str | None] = mapped_column(String(255))
    ip_address: Mapped[str | None] = mapped_column(String(64))

    user: Mapped[User] = relationship(back_populates="sessions")


class BetaWaitlistSignup(Base):
    __tablename__ = "beta_waitlist_signups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(case_insensitive_text, unique=True, nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False, default="landing-page")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )


class BetaAllowlist(Base):
    __tablename__ = "beta_allowlist"

    email: Mapped[str] = mapped_column(case_insensitive_text, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    processing_job_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    upload_session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("upload_sessions.upload_session_id", ondelete="CASCADE")
    )
    job_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)
    job_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    upload_session: Mapped[UploadSession] = relationship(back_populates="processing_jobs")


class MosaicTile(Base):
    __tablename__ = "mosaic_tiles"

    tile_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_upload_session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("upload_sessions.upload_session_id", ondelete="CASCADE"),
        unique=True,
    )
    condition_category: Mapped[str] = mapped_column(String(32), nullable=False)
    display_date: Mapped[str] = mapped_column(String(32), nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False)
    visibility_status: Mapped[str] = mapped_column(String(24), nullable=False)
    tile_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    render_version: Mapped[str] = mapped_column(String(32), nullable=False)
    visual_style: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    rhythm_distance_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    contributed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ledger_adapter_ref: Mapped[str | None] = mapped_column(String(128))

    upload_session: Mapped[UploadSession] = relationship(back_populates="mosaic_tile")


class RhythmDistanceAggregate(Base):
    __tablename__ = "rhythm_distance_aggregate"

    aggregate_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    total_distance_cm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_contributions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_contribution_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MilestoneEvent(Base):
    __tablename__ = "milestone_events"

    milestone_event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    milestone_key: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    reached_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    distance_at_crossing_km: Mapped[float] = mapped_column(Float, nullable=False)
    contribution_count: Mapped[int] = mapped_column(Integer, nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    audit_event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    event_type: Mapped[str] = mapped_column(String(48), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(48), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(24), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(36))
    event_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    analytics_event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    event_name: Mapped[str] = mapped_column(String(64), nullable=False)
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_scope: Mapped[str] = mapped_column(String(24), nullable=False)
    visitor_id: Mapped[str | None] = mapped_column(String(64))
    session_id: Mapped[str | None] = mapped_column(String(64))
    request_id: Mapped[str | None] = mapped_column(String(64))
    event_properties: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CuratedContentEntry(Base):
    __tablename__ = "curated_content_entries"

    entry_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    content_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    locale: Mapped[str] = mapped_column(String(16), nullable=False)
    diagnosis_code: Mapped[str | None] = mapped_column(String(32))
    content_section: Mapped[str] = mapped_column(String(32), nullable=False)
    evidence_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reviewer_ref: Mapped[str] = mapped_column(String(120), nullable=False)
    ingestion_run_id: Mapped[str] = mapped_column(String(36), nullable=False)
    source_checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    content_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    provenance: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )


class SourceFeed(Base):
    __tablename__ = "source_feed"

    source_feed_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    source_system: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(500))
    feed_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    supports_fulltext_lookup: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    source_queries: Mapped[list["SourceQuery"]] = relationship(back_populates="source_feed")
    publication_ingest_runs: Mapped[list["PublicationIngestRun"]] = relationship(back_populates="source_feed")
    publication_provenance: Mapped[list["PublicationProvenance"]] = relationship(back_populates="source_feed")


class SourceQuery(Base):
    __tablename__ = "source_query"

    source_query_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_feed_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_feed.source_feed_id", ondelete="CASCADE"), nullable=False
    )
    query_key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis_code: Mapped[str | None] = mapped_column(String(32))
    theme_key: Mapped[str | None] = mapped_column(String(64))
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en-US")
    exclude_preprints: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    poll_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=1440)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    source_feed: Mapped[SourceFeed] = relationship(back_populates="source_queries")
    publication_ingest_runs: Mapped[list["PublicationIngestRun"]] = relationship(back_populates="source_query")
    publication_provenance: Mapped[list["PublicationProvenance"]] = relationship(back_populates="source_query")


class PublicationJournal(Base):
    __tablename__ = "publication_journal"

    publication_journal_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    iso_abbreviation: Mapped[str | None] = mapped_column(String(120))
    issn_print: Mapped[str | None] = mapped_column(String(16))
    issn_electronic: Mapped[str | None] = mapped_column(String(16))
    publisher_name: Mapped[str | None] = mapped_column(String(255))
    journal_home_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    publications: Mapped[list["Publication"]] = relationship(back_populates="publication_journal")


class Publication(Base):
    __tablename__ = "publication"

    publication_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_journal_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication_journal.publication_journal_id", ondelete="SET NULL")
    )
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    abstract_text: Mapped[str | None] = mapped_column(Text)
    content_scope: Mapped[str] = mapped_column(String(24), nullable=False, default="abstract_only")
    oa_fulltext_storage_ref: Mapped[str | None] = mapped_column(String(500))
    oa_fulltext_mime_type: Mapped[str | None] = mapped_column(String(120))
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    article_type: Mapped[str | None] = mapped_column(String(64))
    study_design: Mapped[str | None] = mapped_column(String(64))
    language: Mapped[str | None] = mapped_column(String(16))
    publication_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    epub_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    featured_rank: Mapped[int | None] = mapped_column(Integer)
    freshness_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    relevance_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    quality_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    overall_rank: Mapped[float] = mapped_column(nullable=False, default=0.0)
    stale_after: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_peer_reviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_preprint: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_retracted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_expression_of_concern: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    metadata_checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    superseded_by_publication_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="SET NULL")
    )

    publication_journal: Mapped["PublicationJournal | None"] = relationship(back_populates="publications")
    identifiers: Mapped[list["PublicationIdentifier"]] = relationship(back_populates="publication")
    publication_license_records: Mapped[list["PublicationLicense"]] = relationship(back_populates="publication")
    topics: Mapped[list["PublicationTopic"]] = relationship(back_populates="publication")
    authors: Mapped[list["PublicationAuthor"]] = relationship(back_populates="publication")
    publication_ingest_runs: Mapped[list["PublicationIngestRun"]] = relationship(back_populates="publication")
    summaries: Mapped[list["PublicationSummary"]] = relationship(back_populates="publication")
    provenance_records: Mapped[list["PublicationProvenance"]] = relationship(back_populates="publication")
    user_relevance_records: Mapped[list["PublicationUserRelevance"]] = relationship(back_populates="publication")
    review_states: Mapped[list["PublicationReviewState"]] = relationship(back_populates="publication")


class PublicationIdentifier(Base):
    __tablename__ = "publication_identifier"

    publication_identifier_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    identifier_kind: Mapped[str] = mapped_column(String(24), nullable=False)
    identifier_value: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(255), nullable=False)
    is_canonical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source_system: Mapped[str | None] = mapped_column(String(32))

    publication: Mapped[Publication] = relationship(back_populates="identifiers")


class PublicationLicense(Base):
    __tablename__ = "publication_license"

    publication_license_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    license_code: Mapped[str | None] = mapped_column(String(64))
    license_name: Mapped[str | None] = mapped_column(String(160))
    license_url: Mapped[str | None] = mapped_column(String(500))
    access_status: Mapped[str] = mapped_column(String(32), nullable=False, default="metadata_only")
    permits_fulltext_storage: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    permits_fulltext_ai_processing: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    permits_quote_excerpt: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source_system: Mapped[str | None] = mapped_column(String(32))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    publication: Mapped[Publication] = relationship(back_populates="publication_license_records")


class PublicationTopic(Base):
    __tablename__ = "publication_topic"

    publication_topic_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    diagnosis_code: Mapped[str | None] = mapped_column(String(32))
    theme_key: Mapped[str] = mapped_column(String(64), nullable=False)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False, default=1.0)
    assignment_source: Mapped[str] = mapped_column(String(24), nullable=False, default="reviewer")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    publication: Mapped[Publication] = relationship(back_populates="topics")


class PublicationAuthor(Base):
    __tablename__ = "publication_author"

    publication_author_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    author_position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    given_name: Mapped[str | None] = mapped_column(String(120))
    family_name: Mapped[str | None] = mapped_column(String(120))
    affiliation: Mapped[str | None] = mapped_column(String(500))
    orcid: Mapped[str | None] = mapped_column(String(32))

    publication: Mapped[Publication] = relationship(back_populates="authors")


class PublicationIngestRun(Base):
    __tablename__ = "publication_ingest_run"

    publication_ingest_run_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="SET NULL")
    )
    source_feed_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("source_feed.source_feed_id", ondelete="CASCADE"), nullable=False
    )
    source_query_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_query.source_query_id", ondelete="SET NULL")
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    items_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    items_accepted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    items_rejected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cursor_ref: Mapped[str | None] = mapped_column(String(255))
    error_summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    publication: Mapped["Publication | None"] = relationship(back_populates="publication_ingest_runs")
    source_feed: Mapped[SourceFeed] = relationship(back_populates="publication_ingest_runs")
    source_query: Mapped["SourceQuery | None"] = relationship(back_populates="publication_ingest_runs")
    provenance_records: Mapped[list["PublicationProvenance"]] = relationship(back_populates="publication_ingest_run")


class PublicationSummary(Base):
    __tablename__ = "publication_summary"

    publication_summary_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    locale: Mapped[str] = mapped_column(String(16), nullable=False)
    pipeline_version: Mapped[str] = mapped_column(String(32), nullable=False)
    short_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    plain_title: Mapped[str] = mapped_column(String(255), nullable=False)
    plain_language_explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    why_it_matters: Mapped[str] = mapped_column(Text, nullable=False)
    what_this_does_not_prove: Mapped[str] = mapped_column(Text, nullable=False, default="")
    what_researchers_studied: Mapped[str] = mapped_column(Text, nullable=False)
    what_they_found: Mapped[str] = mapped_column(Text, nullable=False)
    important_limits: Mapped[str] = mapped_column(Text, nullable=False)
    study_type: Mapped[str] = mapped_column(String(120), nullable=False, default="Study")
    population_sample_size: Mapped[str | None] = mapped_column(String(255))
    questions_to_ask_your_doctor_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    who_this_may_apply_to: Mapped[str] = mapped_column(Text, nullable=False)
    source_claims_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    uncertainty_notes_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    content_checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    publication: Mapped[Publication] = relationship(back_populates="summaries")
    provenance_records: Mapped[list["PublicationProvenance"]] = relationship(back_populates="publication_summary")
    review_states: Mapped[list["PublicationReviewState"]] = relationship(back_populates="publication_summary")


class PublicationProvenance(Base):
    __tablename__ = "publication_provenance"

    publication_provenance_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    publication_summary_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication_summary.publication_summary_id", ondelete="SET NULL")
    )
    source_feed_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_feed.source_feed_id", ondelete="SET NULL")
    )
    source_query_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("source_query.source_query_id", ondelete="SET NULL")
    )
    publication_ingest_run_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication_ingest_run.publication_ingest_run_id", ondelete="SET NULL")
    )
    source_system: Mapped[str] = mapped_column(String(32), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255))
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    content_source_kind: Mapped[str] = mapped_column(String(24), nullable=False, default="metadata")
    reuse_status: Mapped[str] = mapped_column(String(32), nullable=False, default="metadata_only")
    citation_label: Mapped[str | None] = mapped_column(String(255))
    source_quote_locator: Mapped[str | None] = mapped_column(String(255))
    raw_payload_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    checksum: Mapped[str | None] = mapped_column(String(128))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    publication: Mapped[Publication] = relationship(back_populates="provenance_records")
    publication_summary: Mapped["PublicationSummary | None"] = relationship(back_populates="provenance_records")
    source_feed: Mapped["SourceFeed | None"] = relationship(back_populates="publication_provenance")
    source_query: Mapped["SourceQuery | None"] = relationship(back_populates="publication_provenance")
    publication_ingest_run: Mapped["PublicationIngestRun | None"] = relationship(back_populates="provenance_records")


class PublicationUserRelevance(Base):
    __tablename__ = "publication_user_relevance"

    publication_user_relevance_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    locale: Mapped[str] = mapped_column(String(16), nullable=False)
    diagnosis_code: Mapped[str] = mapped_column(String(32), nullable=False)
    matched_keywords_json: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    relevance_score: Mapped[float] = mapped_column(nullable=False, default=0.0)
    rationale_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)

    publication: Mapped[Publication] = relationship(back_populates="user_relevance_records")
    profile: Mapped[Profile] = relationship()


class PublicationReviewState(Base):
    __tablename__ = "publication_review_state"

    publication_review_state_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    publication_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("publication.publication_id", ondelete="CASCADE"), nullable=False
    )
    publication_summary_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("publication_summary.publication_summary_id", ondelete="SET NULL")
    )
    state: Mapped[str] = mapped_column(String(24), nullable=False)
    guardrail_status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending")
    provenance_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    citation_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reviewer_ref: Mapped[str | None] = mapped_column(String(120))
    reviewer_note: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    publication: Mapped[Publication] = relationship(back_populates="review_states")
    publication_summary: Mapped["PublicationSummary | None"] = relationship(back_populates="review_states")


class CommunityStory(Base):
    __tablename__ = "community_stories"

    story_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    consent_record_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("consent_records.consent_record_id", ondelete="SET NULL")
    )
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    visibility_status: Mapped[str] = mapped_column(String(24), nullable=False, default="private")
    review_status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    author_display_mode: Mapped[str] = mapped_column(String(24), nullable=False, default="first_name")
    pseudonym: Mapped[str | None] = mapped_column(String(120))
    moderator_note: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    profile: Mapped[Profile] = relationship(back_populates="stories")
    user: Mapped[User] = relationship()
    consent_record: Mapped[ConsentRecord | None] = relationship()
