import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ResearchPulseDetail } from "@onerhythm/types";

import ResearchPulseDetailPage from "./page";

const researchPulseApiMocks = vi.hoisted(() => ({
  getResearchPulseDetail: vi.fn(),
}));

vi.mock("../../../../lib/research-pulse-api", async () => {
  const actual = await vi.importActual<object>("../../../../lib/research-pulse-api");
  return {
    ...actual,
    getResearchPulseDetail: researchPulseApiMocks.getResearchPulseDetail,
  };
});

const detail: ResearchPulseDetail = {
  claim_citations: [],
  disclaimer: {
    disclaimer_text:
      "Educational only. Not diagnostic. Not a substitute for professional medical advice.",
    disclaimer_version: "launch-v1",
    dismissible: false,
    placement: "persistent_banner",
    required_on_surfaces: ["api_response", "web_page", "educational_panel"],
  },
  diagnosis_tags: [
    {
      diagnosis_code: "afib",
      label: "Atrial fibrillation",
      slug: "atrial-fibrillation",
      theme_key: "monitoring",
    },
  ],
  disclaimer_required: true,
  doi: "10.1000/example-doi",
  important_limits: "This was a single-center study with limited diversity.",
  integrity: {
    adequate_source_grounding: true,
    citation_complete: true,
    guardrail_status: "passed",
    human_reviewed: true,
    provenance_complete: true,
    publisher_kind: "journal",
    review_state: "published",
    reviewed_at: "2026-03-11T00:00:00Z",
    reviewer_ref: "editor-1",
    source_classification: "peer_reviewed_study",
    summary_origin: "reviewed_editorial",
    trust_state: "verified",
  },
  journal_name: "Journal of Rhythm",
  plain_language_explanation: "The study looked at whether remote monitoring changed symptom burden.",
  pmid: "12345678",
  population_sample_size: "222 adults with symptomatic AF",
  publication_id: "publication-1",
  published_at: "2026-02-01",
  questions_to_ask_your_doctor: ["How might this apply to my symptoms?"],
  short_summary: "A concise summary.",
  slug: "remote-monitoring-study",
  source_references: [
    {
      approval_status: "approved",
      citation: {
        citation_label: "Journal of Rhythm 2026;12(3):101-110",
        doi: "10.1000/example-doi",
        pmid: "12345678",
      },
      content_section: "recent_advancements",
      evidence_kind: "research_update",
      ingestion_run_id: "ingest-1",
      monthly_update_cycle: "monthly",
      published_at: "2026-02-01",
      publisher_kind: "journal",
      registry_source_id: "registry-source-1",
      reviewed_at: "2026-03-11T00:00:00Z",
      reviewer_ref: "editor-1",
      source_checksum: "checksum-1",
      source_classification: "peer_reviewed_study",
      source_name: "Journal of Rhythm",
      source_reference_id: "source-1",
      source_url: "https://example.org/study",
      title: "Remote monitoring and AF symptom burden",
      topic_tags: ["monitoring"],
      usage_scope: ["research_pulse"],
    },
  ],
  source_url: "https://example.org/study",
  study_type: "Prospective cohort study",
  summary: "A reviewed summary of a remote monitoring study.",
  theme_tags: [
    {
      label: "Monitoring",
      slug: "monitoring",
      theme_key: "monitoring",
    },
  ],
  title: "Remote monitoring and AF symptom burden",
  uncertainty_notes: ["The follow-up period was short."],
  what_researchers_studied: "Researchers compared symptom trends after remote monitoring support.",
  what_they_found: "People reported fewer disruptive symptoms over the study window.",
  what_this_does_not_prove: "It does not prove the result will apply to every person or setting.",
  who_this_may_apply_to: "Adults with symptomatic atrial fibrillation in specialist care.",
  why_it_matters: "It offers a careful signal about monitoring support, not a universal rule.",
};

describe("ResearchPulseDetailPage", () => {
  it("keeps the disclaimer and primary-source trail visible", async () => {
    researchPulseApiMocks.getResearchPulseDetail.mockResolvedValue(detail);

    render(
      await ResearchPulseDetailPage({
        params: Promise.resolve({ slug: "remote-monitoring-study" }),
      }),
    );

    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    expect(screen.getByText("Primary source")).toBeInTheDocument();
    expect(screen.getAllByText("Journal of Rhythm")).toHaveLength(2);
    expect(screen.getByText(/12345678/)).toBeInTheDocument();
    expect(screen.getByText(/10\.1000\/example-doi/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open publication record/i })).toHaveAttribute(
      "href",
      "https://example.org/study",
    );
    expect(screen.getByText("Uncertainty notes")).toBeInTheDocument();
    expect(screen.getByText("The follow-up period was short.")).toBeInTheDocument();
  });
});
