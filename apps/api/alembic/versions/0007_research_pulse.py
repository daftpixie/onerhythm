"""add normalized research pulse data model

Revision ID: 0007_research_pulse
Revises: 0006_analytics_events
Create Date: 2026-03-12 20:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_research_pulse"
down_revision = "0006_analytics_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "source_feed",
        sa.Column("source_feed_id", sa.String(length=36), primary_key=True),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("source_system", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("base_url", sa.String(length=500), nullable=True),
        sa.Column("feed_kind", sa.String(length=32), nullable=False),
        sa.Column("supports_fulltext_lookup", sa.Boolean(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "source_query",
        sa.Column("source_query_id", sa.String(length=36), primary_key=True),
        sa.Column("source_feed_id", sa.String(length=36), nullable=False),
        sa.Column("query_key", sa.String(length=120), nullable=False, unique=True),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("diagnosis_code", sa.String(length=32), nullable=True),
        sa.Column("theme_key", sa.String(length=64), nullable=True),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("exclude_preprints", sa.Boolean(), nullable=False),
        sa.Column("poll_interval_minutes", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_feed_id"], ["source_feed.source_feed_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_journal",
        sa.Column("publication_journal_id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("iso_abbreviation", sa.String(length=120), nullable=True),
        sa.Column("issn_print", sa.String(length=16), nullable=True),
        sa.Column("issn_electronic", sa.String(length=16), nullable=True),
        sa.Column("publisher_name", sa.String(length=255), nullable=True),
        sa.Column("journal_home_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "publication",
        sa.Column("publication_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_journal_id", sa.String(length=36), nullable=True),
        sa.Column("slug", sa.String(length=180), nullable=False, unique=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("abstract_text", sa.Text(), nullable=True),
        sa.Column("content_scope", sa.String(length=24), nullable=False),
        sa.Column("oa_fulltext_storage_ref", sa.String(length=500), nullable=True),
        sa.Column("oa_fulltext_mime_type", sa.String(length=120), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("article_type", sa.String(length=64), nullable=True),
        sa.Column("study_design", sa.String(length=64), nullable=True),
        sa.Column("language", sa.String(length=16), nullable=True),
        sa.Column("publication_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("epub_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("featured_rank", sa.Integer(), nullable=True),
        sa.Column("freshness_score", sa.Float(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("overall_rank", sa.Float(), nullable=False),
        sa.Column("stale_after", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_peer_reviewed", sa.Boolean(), nullable=False),
        sa.Column("is_preprint", sa.Boolean(), nullable=False),
        sa.Column("is_retracted", sa.Boolean(), nullable=False),
        sa.Column("is_expression_of_concern", sa.Boolean(), nullable=False),
        sa.Column("metadata_checksum", sa.String(length=128), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("superseded_by_publication_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["publication_journal_id"],
            ["publication_journal.publication_journal_id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["superseded_by_publication_id"],
            ["publication.publication_id"],
            ondelete="SET NULL",
        ),
    )
    op.create_table(
        "publication_identifier",
        sa.Column("publication_identifier_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("identifier_kind", sa.String(length=24), nullable=False),
        sa.Column("identifier_value", sa.String(length=255), nullable=False),
        sa.Column("normalized_value", sa.String(length=255), nullable=False),
        sa.Column("is_canonical", sa.Boolean(), nullable=False),
        sa.Column("source_system", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_publication_identifier_kind_value",
        "publication_identifier",
        ["identifier_kind", "normalized_value"],
    )
    op.create_table(
        "publication_license",
        sa.Column("publication_license_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("license_code", sa.String(length=64), nullable=True),
        sa.Column("license_name", sa.String(length=160), nullable=True),
        sa.Column("license_url", sa.String(length=500), nullable=True),
        sa.Column("access_status", sa.String(length=32), nullable=False),
        sa.Column("permits_fulltext_storage", sa.Boolean(), nullable=False),
        sa.Column("permits_fulltext_ai_processing", sa.Boolean(), nullable=False),
        sa.Column("permits_quote_excerpt", sa.Boolean(), nullable=False),
        sa.Column("source_system", sa.String(length=32), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_topic",
        sa.Column("publication_topic_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("diagnosis_code", sa.String(length=32), nullable=True),
        sa.Column("theme_key", sa.String(length=64), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("assignment_source", sa.String(length=24), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_author",
        sa.Column("publication_author_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("author_position", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("given_name", sa.String(length=120), nullable=True),
        sa.Column("family_name", sa.String(length=120), nullable=True),
        sa.Column("affiliation", sa.String(length=500), nullable=True),
        sa.Column("orcid", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_ingest_run",
        sa.Column("publication_ingest_run_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=True),
        sa.Column("source_feed_id", sa.String(length=36), nullable=False),
        sa.Column("source_query_id", sa.String(length=36), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("items_seen", sa.Integer(), nullable=False),
        sa.Column("items_accepted", sa.Integer(), nullable=False),
        sa.Column("items_rejected", sa.Integer(), nullable=False),
        sa.Column("cursor_ref", sa.String(length=255), nullable=True),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_feed_id"], ["source_feed.source_feed_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_query_id"], ["source_query.source_query_id"], ondelete="SET NULL"),
    )
    op.create_table(
        "publication_summary",
        sa.Column("publication_summary_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("pipeline_version", sa.String(length=32), nullable=False),
        sa.Column("plain_title", sa.String(length=255), nullable=False),
        sa.Column("why_it_matters", sa.Text(), nullable=False),
        sa.Column("what_researchers_studied", sa.Text(), nullable=False),
        sa.Column("what_they_found", sa.Text(), nullable=False),
        sa.Column("important_limits", sa.Text(), nullable=False),
        sa.Column("who_this_may_apply_to", sa.Text(), nullable=False),
        sa.Column("source_claims_json", sa.JSON(), nullable=False),
        sa.Column("uncertainty_notes_json", sa.JSON(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("content_checksum", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_provenance",
        sa.Column("publication_provenance_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("publication_summary_id", sa.String(length=36), nullable=True),
        sa.Column("source_feed_id", sa.String(length=36), nullable=True),
        sa.Column("source_query_id", sa.String(length=36), nullable=True),
        sa.Column("publication_ingest_run_id", sa.String(length=36), nullable=True),
        sa.Column("source_system", sa.String(length=32), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("content_source_kind", sa.String(length=24), nullable=False),
        sa.Column("reuse_status", sa.String(length=32), nullable=False),
        sa.Column("citation_label", sa.String(length=255), nullable=True),
        sa.Column("source_quote_locator", sa.String(length=255), nullable=True),
        sa.Column("raw_payload_json", sa.JSON(), nullable=True),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["publication_summary_id"],
            ["publication_summary.publication_summary_id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["source_feed_id"], ["source_feed.source_feed_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_query_id"], ["source_query.source_query_id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["publication_ingest_run_id"],
            ["publication_ingest_run.publication_ingest_run_id"],
            ondelete="SET NULL",
        ),
    )
    op.create_table(
        "publication_user_relevance",
        sa.Column("publication_user_relevance_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("diagnosis_code", sa.String(length=32), nullable=False),
        sa.Column("matched_keywords_json", sa.JSON(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("rationale_json", sa.JSON(), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("model_version", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.profile_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "publication_review_state",
        sa.Column("publication_review_state_id", sa.String(length=36), primary_key=True),
        sa.Column("publication_id", sa.String(length=36), nullable=False),
        sa.Column("publication_summary_id", sa.String(length=36), nullable=True),
        sa.Column("state", sa.String(length=24), nullable=False),
        sa.Column("guardrail_status", sa.String(length=24), nullable=False),
        sa.Column("provenance_complete", sa.Boolean(), nullable=False),
        sa.Column("citation_complete", sa.Boolean(), nullable=False),
        sa.Column("reviewer_ref", sa.String(length=120), nullable=True),
        sa.Column("reviewer_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["publication.publication_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["publication_summary_id"],
            ["publication_summary.publication_summary_id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index(
        "ix_publication_published_at_rank",
        "publication",
        ["published_at", "overall_rank"],
    )


def downgrade() -> None:
    op.drop_index("ix_publication_published_at_rank", table_name="publication")
    op.drop_table("publication_review_state")
    op.drop_table("publication_user_relevance")
    op.drop_table("publication_provenance")
    op.drop_table("publication_summary")
    op.drop_table("publication_ingest_run")
    op.drop_table("publication_author")
    op.drop_table("publication_topic")
    op.drop_table("publication_license")
    op.drop_index("ix_publication_identifier_kind_value", table_name="publication_identifier")
    op.drop_table("publication_identifier")
    op.drop_table("publication")
    op.drop_table("publication_journal")
    op.drop_table("source_query")
    op.drop_table("source_feed")
