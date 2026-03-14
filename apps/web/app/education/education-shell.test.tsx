import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EducationalContentResponse } from "@onerhythm/types";

import { EducationShell } from "./education-shell";

vi.mock("../../components/session-actions", () => ({
  SessionActions: () => <div>Session actions</div>,
}));

const authApiMocks = vi.hoisted(() => ({
  getOwnedProfile: vi.fn(),
  getSession: vi.fn(),
}));

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackSurfaceVisit: vi.fn(),
}));

vi.mock("../../lib/auth-api", () => authApiMocks);
vi.mock("../../lib/analytics", () => analyticsMocks);

const educationalResponse: EducationalContentResponse = {
  condition_education: {
    everyday_language_notes: ["Episodes can feel unpredictable."],
    summary: "A calm summary grounded in self-reported context.",
    title: "Understanding atrial fibrillation",
  },
  content_basis: ["self_reported_profile", "curated_retrieval"],
  content_reviewed_at: "2026-03-11T00:00:00Z",
  content_stale: false,
  disclaimer: {
    disclaimer_text:
      "Educational only. Not diagnostic. Not a substitute for professional medical advice.",
    disclaimer_version: "launch-v1",
    dismissible: false,
    placement: "persistent_banner",
    required_on_surfaces: ["api_response", "web_page", "educational_panel"],
  },
  doctor_questions: {
    items: ["What symptoms should I track between visits?"],
  },
  ecg_clinical_inputs_used: false,
  generated_at: "2026-03-14T12:00:00Z",
  guardrails_applied: [
    "no_ecg_inputs",
    "no_treatment_recommendations",
    "no_diagnostic_language",
    "disclaimer_required",
    "curated_sources_only",
  ],
  locale: "en-US",
  mental_health_resources: [
    {
      description: "Peer support from others living with arrhythmias.",
      resource_kind: "peer_support",
      source_reference_id: "source-2",
      title: "Peer support circle",
      url: "https://example.org/support",
    },
  ],
  profile_id: "profile-1",
  recent_advancements: [
    {
      published_at: "2026-02-01",
      source_name: "Journal of Rhythm",
      source_reference_id: "source-1",
      source_url: "https://example.org/study",
      summary: "A recent peer-reviewed update.",
      title: "New mapping workflow",
    },
  ],
  response_id: "response-1",
  response_version: "guidance-v1",
  retrieval_corpus_version: "corpus-v3",
  section_statuses: [
    {
      message: "Reviewed this month.",
      section_key: "condition_education",
      status: "ready",
    },
    {
      message: "Reviewed this month.",
      section_key: "recent_advancements",
      status: "ready",
    },
  ],
  self_reported_profile_snapshot: {
    diagnosis_selection: {
      diagnosis_code: "afib",
      diagnosis_source: "self_reported",
    },
    emotional_context: ["anxious during episodes"],
    personal_narrative: "Trying to understand what triggers episodes.",
    physical_symptoms: ["palpitations"],
    treatment_history: {
      ablation_count: 1,
      current_medications: ["beta blocker"],
      has_implantable_device: false,
      prior_procedures: [],
    },
  },
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
      title: "New mapping workflow",
      topic_tags: ["mapping"],
      usage_scope: ["education"],
    },
  ],
};

describe("EducationShell", () => {
  beforeEach(() => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      user: {
        email: "person@example.com",
        preferred_language: "en-US",
        profile_id: "profile-1",
        role: "user",
        user_id: "user-1",
      },
    });
    authApiMocks.getOwnedProfile.mockResolvedValue({
      created_at: "2026-03-01T12:00:00Z",
      diagnosis_selection: {
        diagnosis_code: "afib",
        diagnosis_source: "self_reported",
      },
      emotional_context: ["uncertain"],
      physical_symptoms: ["palpitations"],
      preferred_language: "en-US",
      profile_id: "profile-1",
      treatment_history: {
        ablation_count: 1,
        current_medications: ["beta blocker"],
        has_implantable_device: false,
        prior_procedures: [],
      },
      updated_at: "2026-03-05T15:30:00Z",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(educationalResponse), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );
  });

  it("keeps the disclaimer visible when profile-backed access is unavailable", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      user: {
        email: "person@example.com",
        preferred_language: "en-US",
        profile_id: null,
        role: "user",
        user_id: "user-1",
      },
    });

    render(<EducationShell />);

    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Create your self-reported profile before requesting educational guidance.",
      ),
    );
  });

  it("renders provenance and source metadata for educational guidance", async () => {
    render(<EducationShell />);

    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    await screen.findByText("Content provenance");

    expect(screen.getByText(/Corpus version corpus-v3/)).toBeInTheDocument();
    expect(screen.getAllByText("New mapping workflow")).toHaveLength(2);
    expect(screen.getByText("Review: published")).toBeInTheDocument();
    expect(screen.getByText("DOI: 10.1000/example-doi")).toBeInTheDocument();
    expect(screen.getByText("PMID: 12345678")).toBeInTheDocument();
    expect(screen.getByText(/Section: recent advancements/)).toBeInTheDocument();
  });
});
