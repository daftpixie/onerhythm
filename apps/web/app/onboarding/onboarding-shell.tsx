"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Card,
  FieldWrapper,
  Input,
  MedicalDisclaimer,
  Select,
} from "@onerhythm/ui";
import { SessionActions } from "../../components/session-actions";
import { createConsent, createProfile } from "../../lib/auth-api";
import type {
  ConsentType,
  DiagnosisCode,
  DiagnosisSelection,
  UserProfile,
} from "@onerhythm/types";

type StepId = "welcome" | "profile" | "consent";

type ConsentChoice = "yes" | "not_now";

type FormState = {
  diagnosis_code: DiagnosisCode | "";
  diagnosis_source: DiagnosisSelection["diagnosis_source"];
  free_text_condition: string;
  physical_symptoms_input: string;
  emotional_context_input: string;
  ablation_count: string;
  has_implantable_device: "yes" | "no" | "unsure";
  current_medications_input: string;
  prior_procedures_input: string;
  personal_narrative: string;
  consent_mosaic: ConsentChoice | "";
  consent_education: ConsentChoice | "";
  consent_research: ConsentChoice | "";
  confirm_understanding: boolean;
};

type ValidationState = Partial<Record<keyof FormState, string>>;

const steps: Array<{ id: StepId; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "About you" },
  { id: "consent", label: "Consent" },
];

const diagnosisOptions: Array<{ value: DiagnosisCode; label: string }> = [
  { value: "afib", label: "Atrial fibrillation" },
  { value: "arvc", label: "ARVC" },
  { value: "vt", label: "Ventricular tachycardia" },
  { value: "svt", label: "Supraventricular tachycardia" },
  { value: "long_qt", label: "Long QT syndrome" },
  { value: "brugada", label: "Brugada syndrome" },
  { value: "wpw", label: "Wolff-Parkinson-White syndrome" },
  { value: "other", label: "Another arrhythmia" },
];

const initialState: FormState = {
  diagnosis_code: "",
  diagnosis_source: "self_reported",
  free_text_condition: "",
  physical_symptoms_input: "",
  emotional_context_input: "",
  ablation_count: "0",
  has_implantable_device: "unsure",
  current_medications_input: "",
  prior_procedures_input: "",
  personal_narrative: "",
  consent_mosaic: "",
  consent_education: "",
  consent_research: "",
  confirm_understanding: false,
};

function splitList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toProfileDraft(form: FormState): Pick<
  UserProfile,
  | "diagnosis_selection"
  | "physical_symptoms"
  | "emotional_context"
  | "treatment_history"
  | "personal_narrative"
> {
  return {
    diagnosis_selection: {
      diagnosis_code: (form.diagnosis_code || "other") as DiagnosisCode,
      diagnosis_source: form.diagnosis_source,
      free_text_condition:
        form.diagnosis_code === "other" ? form.free_text_condition.trim() : undefined,
    },
    physical_symptoms: splitList(form.physical_symptoms_input),
    emotional_context: splitList(form.emotional_context_input),
    treatment_history: {
      ablation_count: Number.parseInt(form.ablation_count || "0", 10) || 0,
      has_implantable_device:
        form.has_implantable_device === "unsure"
          ? null
          : form.has_implantable_device === "yes",
      current_medications: splitList(form.current_medications_input),
      prior_procedures: splitList(form.prior_procedures_input),
    },
    personal_narrative: form.personal_narrative.trim() || undefined,
  };
}

function ConsentOption({
  checked,
  description,
  name,
  onChange,
  value,
  children,
}: {
  checked: boolean;
  description: string;
  name: string;
  onChange: (value: ConsentChoice) => void;
  value: ConsentChoice;
  children: string;
}) {
  return (
    <label className="surface-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-token p-4 transition-colors duration-micro ease-out hover:bg-cosmos-nebula">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-[var(--color-pulse)]"
        name={name}
        onChange={() => onChange(value)}
        type="radio"
        value={value}
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-text-primary">
          {children}
        </span>
        <span className="block text-sm leading-6 text-text-secondary">
          {description}
        </span>
      </span>
    </label>
  );
}

export function OnboardingShell() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<ValidationState>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentStep = steps[stepIndex];
  const profileDraft = toProfileDraft(form);
  const consentPolicyVersion = "launch-v1";

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionError(null);
  }

  function consentStatus(choice: ConsentChoice): "granted" | "revoked" {
    return choice === "yes" ? "granted" : "revoked";
  }

  function consentReason(choice: ConsentChoice): string | undefined {
    return choice === "not_now" ? "not_now" : undefined;
  }

  function buildConsentPayloads(profileId: string): Array<{
    profile_id: string;
    consent_type: ConsentType;
    status: "granted" | "revoked";
    revocation_reason?: string;
  }> {
    return [
      {
        profile_id: profileId,
        consent_type: "mosaic_contribution",
        status: consentStatus(form.consent_mosaic as ConsentChoice),
        revocation_reason: consentReason(form.consent_mosaic as ConsentChoice),
      },
      {
        profile_id: profileId,
        consent_type: "educational_profile",
        status: consentStatus(form.consent_education as ConsentChoice),
        revocation_reason: consentReason(form.consent_education as ConsentChoice),
      },
      {
        profile_id: profileId,
        consent_type: "research_aggregation",
        status: consentStatus((form.consent_research || "not_now") as ConsentChoice),
        revocation_reason: consentReason((form.consent_research || "not_now") as ConsentChoice),
      },
    ];
  }

  function submitOnboarding() {
    setSubmissionError(null);
    setSubmissionMessage(null);

    startTransition(async () => {
      try {
        const profile = await createProfile({
          display_name: undefined,
          preferred_language: "en-US",
          diagnosis_selection: profileDraft.diagnosis_selection,
          physical_symptoms: profileDraft.physical_symptoms,
          emotional_context: profileDraft.emotional_context,
          treatment_history: profileDraft.treatment_history,
          personal_narrative: profileDraft.personal_narrative,
        });
        const effectiveAt = new Date().toISOString();
        await Promise.all(
          buildConsentPayloads(profile.profile_id).map((payload) =>
            createConsent({
              profile_id: payload.profile_id,
              consent_type: payload.consent_type,
              status: payload.status,
              policy_version: consentPolicyVersion,
              locale: "en-US",
              effective_at: effectiveAt,
              revocation_reason: payload.revocation_reason,
            }),
          ),
        );
        setSubmitted(true);
        setSubmissionMessage(
          "Your profile and consent choices were saved. You can review them in Data controls.",
        );
        router.refresh();
      } catch (error) {
        setSubmissionError(
          error instanceof Error ? error.message : "The onboarding flow could not be completed.",
        );
      }
    });
  }

  function validateStep(step: StepId): boolean {
    const nextErrors: ValidationState = {};

    if (step === "profile") {
      if (!form.diagnosis_code) {
        nextErrors.diagnosis_code =
          "Select the condition that best matches your self-reported experience.";
      }

      if (
        form.diagnosis_code === "other" &&
        !form.free_text_condition.trim()
      ) {
        nextErrors.free_text_condition =
          "Add a short condition label so the profile stays understandable.";
      }

      if (!splitList(form.physical_symptoms_input).length) {
        nextErrors.physical_symptoms_input =
          "Add at least one symptom or lived-effect to ground the educational profile.";
      }

      if (!splitList(form.emotional_context_input).length) {
        nextErrors.emotional_context_input =
          "Add at least one emotional experience so the profile reflects the human side of care.";
      }

      if (!/^\d+$/.test(form.ablation_count)) {
        nextErrors.ablation_count =
          "Use a whole number for ablations, even if that number is 0.";
      }
    }

    if (step === "consent") {
      if (!form.consent_mosaic) {
        nextErrors.consent_mosaic =
          "Choose whether you want to contribute to the public mosaic.";
      }

      if (!form.consent_education) {
        nextErrors.consent_education =
          "Choose whether we may use your self-reported profile for educational content.";
      }

      if (!form.confirm_understanding) {
        nextErrors.confirm_understanding =
          "Confirm that you understand the educational and non-diagnostic boundary.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(currentStep.id)) {
      return;
    }

    if (currentStep.id === "consent") {
      submitOnboarding();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function goBack() {
    setErrors({});
    setStepIndex((current) => Math.max(0, current - 1));
  }

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="page-header">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <p className="page-eyebrow">Onboarding</p>
            <h1 className="page-title max-w-3xl">
              Begin with clarity, consent, and only the information we need.
            </h1>
            <p className="page-intro max-w-2xl">
              The first pass keeps the tone warm and the collection modest.
              Every step should feel measured, explicit, and respectful.
            </p>
          </div>
          <SessionActions />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Card className="surface-panel-accent">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Progress
          </p>
          <ol className="mt-5 space-y-3">
            {steps.map((step, index) => {
              const isCurrent = index === stepIndex;
              const isComplete = index < stepIndex || submitted;

              return (
                <li
                  key={step.id}
                  className={[
                    "rounded-lg border p-4",
                    isCurrent
                      ? "border-signal surface-3 shadow-signal"
                      : "border-token surface-2",
                  ].join(" ")}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-base font-medium text-text-primary">
                    {step.label}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {isComplete
                      ? "Ready to review or revisit."
                      : isCurrent
                        ? "Current step."
                        : "Available next."}
                  </p>
                </li>
              );
            })}
          </ol>

          <MedicalDisclaimer className="mt-6" />
        </Card>

        <Card className="min-h-[32rem] surface-panel-accent">
          {!submitted && currentStep.id === "welcome" ? (
            <section className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Welcome
              </p>
              <div className="space-y-4">
                <h2 className="font-display text-3xl text-text-primary">
                  Before anything else, here is what OneRhythm is and is not.
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  OneRhythm is an educational resource and community platform
                  for people living with arrhythmias. If you continue, the next
                  steps will only ask for your self-reported condition and your
                  consent preferences.
                </p>
                <p className="text-base leading-7 text-text-secondary">
                  We are not asking for an upload yet. We are not making medical
                  judgments. We are showing the tone and choices that should be
                  visible before any data is used.
                </p>
              </div>

              <div className="surface-2 rounded-lg border border-token p-5">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
                  What happens later
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-text-secondary">
                  <li>Your ECG can contribute to the public mosaic only if you explicitly agree.</li>
                  <li>Educational content can only come from self-reported profile information and curated sources.</li>
                  <li>You can choose not to participate in research aggregation.</li>
                </ul>
              </div>
            </section>
          ) : null}

          {!submitted && currentStep.id === "profile" ? (
            <section className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                About you
              </p>
              <div className="space-y-4">
                <h2 className="font-display text-3xl text-text-primary">
                  Build a simple self-reported profile for educational guidance.
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  This intake is intentionally modest. We are asking about your
                  condition, symptoms, treatment history, and emotional
                  experience because those are the inputs educational content
                  should be based on.
                </p>
              </div>

              <MedicalDisclaimer />

              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <FieldWrapper
                    description="Choose the option that best matches your self-reported diagnosis or lived experience."
                    error={errors.diagnosis_code}
                    htmlFor="diagnosis_code"
                    label="Self-reported condition"
                  >
                    <Select
                      id="diagnosis_code"
                      name="diagnosis_code"
                      onChange={(event) =>
                        updateField(
                          "diagnosis_code",
                          event.target.value as DiagnosisCode | "",
                        )
                      }
                      value={form.diagnosis_code}
                    >
                      <option value="">Select a condition</option>
                      {diagnosisOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FieldWrapper>

                  <FieldWrapper
                    description="This keeps the source of the profile transparent."
                    htmlFor="diagnosis_source"
                    label="Condition source"
                  >
                    <Select
                      id="diagnosis_source"
                      name="diagnosis_source"
                      onChange={(event) =>
                        updateField(
                          "diagnosis_source",
                          event.target
                            .value as FormState["diagnosis_source"],
                        )
                      }
                      value={form.diagnosis_source}
                    >
                      <option value="self_reported">Self-reported by me</option>
                      <option value="caregiver_reported">
                        Shared by a caregiver or family member
                      </option>
                      <option value="clinician_confirmed_by_user">
                        Clinician-confirmed, as I understand it
                      </option>
                    </Select>
                  </FieldWrapper>
                </div>

                {form.diagnosis_code === "other" ? (
                  <FieldWrapper
                    description="A short plain-language label is enough."
                    error={errors.free_text_condition}
                    htmlFor="free_text_condition"
                    label="Condition label"
                  >
                    <Input
                      id="free_text_condition"
                      name="free_text_condition"
                      onChange={(event) =>
                        updateField("free_text_condition", event.target.value)
                      }
                      placeholder="For example, premature ventricular contractions"
                      value={form.free_text_condition}
                    />
                  </FieldWrapper>
                ) : null}

                <FieldWrapper
                  description="List symptoms or lived effects that matter to your experience. Separate items with commas or line breaks."
                  error={errors.physical_symptoms_input}
                  htmlFor="physical_symptoms_input"
                  label="Symptom history"
                >
                  <textarea
                    className="form-area"
                    id="physical_symptoms_input"
                    name="physical_symptoms_input"
                    onChange={(event) =>
                      updateField("physical_symptoms_input", event.target.value)
                    }
                    placeholder="Palpitations, fatigue after exertion, dizziness"
                    value={form.physical_symptoms_input}
                  />
                </FieldWrapper>

                <div className="grid gap-5 md:grid-cols-2">
                  <FieldWrapper
                    description="Use 0 if you have not had an ablation."
                    error={errors.ablation_count}
                    htmlFor="ablation_count"
                    label="Ablations"
                  >
                    <Input
                      id="ablation_count"
                      inputMode="numeric"
                      name="ablation_count"
                      onChange={(event) =>
                        updateField("ablation_count", event.target.value)
                      }
                      placeholder="0"
                      value={form.ablation_count}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    description="This supports treatment-history context only."
                    htmlFor="has_implantable_device"
                    label="Implantable device"
                  >
                    <Select
                      id="has_implantable_device"
                      name="has_implantable_device"
                      onChange={(event) =>
                        updateField(
                          "has_implantable_device",
                          event.target.value as FormState["has_implantable_device"],
                        )
                      }
                      value={form.has_implantable_device}
                    >
                      <option value="unsure">Unsure or prefer not to say</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  </FieldWrapper>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FieldWrapper
                    description="Optional. Separate medications with commas or line breaks."
                    htmlFor="current_medications_input"
                    label="Current medications"
                  >
                    <textarea
                      className="form-area min-h-24"
                      id="current_medications_input"
                      name="current_medications_input"
                      onChange={(event) =>
                        updateField("current_medications_input", event.target.value)
                      }
                      placeholder="Optional"
                      value={form.current_medications_input}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    description="Optional. Include procedures or interventions you want reflected in profile context."
                    htmlFor="prior_procedures_input"
                    label="Other procedures"
                  >
                    <textarea
                      className="form-area min-h-24"
                      id="prior_procedures_input"
                      name="prior_procedures_input"
                      onChange={(event) =>
                        updateField("prior_procedures_input", event.target.value)
                      }
                      placeholder="Optional"
                      value={form.prior_procedures_input}
                    />
                  </FieldWrapper>
                </div>

                <FieldWrapper
                  description="Share how living with this condition feels day to day. Separate short themes with commas or line breaks."
                  error={errors.emotional_context_input}
                  htmlFor="emotional_context_input"
                  label="Emotional experience"
                >
                  <textarea
                    className="form-area"
                    id="emotional_context_input"
                    name="emotional_context_input"
                    onChange={(event) =>
                      updateField("emotional_context_input", event.target.value)
                    }
                    placeholder="Anxious during episodes, frustrated by uncertainty, trying to stay hopeful"
                    value={form.emotional_context_input}
                  />
                </FieldWrapper>

                <FieldWrapper
                  description="Optional. A short note in your own words can help keep the experience human."
                  htmlFor="personal_narrative"
                  label="Personal note"
                >
                  <textarea
                    className="form-area"
                    id="personal_narrative"
                    name="personal_narrative"
                    onChange={(event) =>
                      updateField("personal_narrative", event.target.value)
                    }
                    placeholder="Optional"
                    value={form.personal_narrative}
                  />
                </FieldWrapper>
              </div>
            </section>
          ) : null}

          {!submitted && currentStep.id === "consent" ? (
            <section className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Consent
              </p>
              <div className="space-y-4">
                <h2 className="font-display text-3xl text-text-primary">
                  Your choices should be explicit, reversible, and easy to understand.
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  Nothing is preselected. Each choice below stands on its own.
                  Saying “not now” does not block the rest of the experience
                  unless that choice is required for the specific feature.
                </p>
              </div>

              <MedicalDisclaimer />

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-text-primary">
                  May we include your future ECG contribution in the public mosaic?
                </legend>
                <ConsentOption
                  checked={form.consent_mosaic === "yes"}
                  description="Your de-identified contribution may become part of the community artwork."
                  name="consent_mosaic"
                  onChange={(value) => updateField("consent_mosaic", value)}
                  value="yes"
                >
                  Yes, I want that option available.
                </ConsentOption>
                <ConsentOption
                  checked={form.consent_mosaic === "not_now"}
                  description="You can continue learning about the flow without opting in right now."
                  name="consent_mosaic"
                  onChange={(value) => updateField("consent_mosaic", value)}
                  value="not_now"
                >
                  Not now.
                </ConsentOption>
                {errors.consent_mosaic ? (
                  <p aria-live="polite" className="text-sm text-pulse">
                    {errors.consent_mosaic}
                  </p>
                ) : null}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-text-primary">
                  May we use your self-reported profile to tailor educational content?
                </legend>
                <ConsentOption
                  checked={form.consent_education === "yes"}
                  description="This supports condition education, question prompts, and relevant resources."
                  name="consent_education"
                  onChange={(value) => updateField("consent_education", value)}
                  value="yes"
                >
                  Yes, for educational guidance.
                </ConsentOption>
                <ConsentOption
                  checked={form.consent_education === "not_now"}
                  description="We would avoid using your self-reported profile for personalized educational content."
                  name="consent_education"
                  onChange={(value) => updateField("consent_education", value)}
                  value="not_now"
                >
                  Not now.
                </ConsentOption>
                {errors.consent_education ? (
                  <p aria-live="polite" className="text-sm text-pulse">
                    {errors.consent_education}
                  </p>
                ) : null}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-text-primary">
                  May we include your data in aggregated, de-identified research sharing later?
                </legend>
                <ConsentOption
                  checked={form.consent_research === "yes"}
                  description="This would only apply to aggregated, de-identified use if the feature is enabled later."
                  name="consent_research"
                  onChange={(value) => updateField("consent_research", value)}
                  value="yes"
                >
                  Yes, I am open to that.
                </ConsentOption>
                <ConsentOption
                  checked={form.consent_research === "not_now"}
                  description="You can decline this without affecting the rest of the onboarding flow."
                  name="consent_research"
                  onChange={(value) => updateField("consent_research", value)}
                  value="not_now"
                >
                  Not now.
                </ConsentOption>
              </fieldset>

              <label className="surface-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-token p-4">
                <input
                  checked={form.confirm_understanding}
                  className="mt-1 h-4 w-4 accent-[var(--color-pulse)]"
                  onChange={(event) =>
                    updateField("confirm_understanding", event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-text-primary">
                    I understand that OneRhythm is educational, not diagnostic.
                  </span>
                  <span className="block text-sm leading-6 text-text-secondary">
                    Educational content should never be based on ECG-derived
                    clinical interpretation.
                  </span>
                </span>
              </label>
              {errors.confirm_understanding ? (
                <p aria-live="polite" className="text-sm text-pulse">
                  {errors.confirm_understanding}
                </p>
              ) : null}
              {submissionError ? (
                <p aria-live="polite" className="text-sm text-pulse">
                  {submissionError}
                </p>
              ) : null}
            </section>
          ) : null}

          {submitted ? (
            <section className="space-y-6">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
                Review
              </p>
              <div className="space-y-4">
                <h2 className="font-display text-3xl text-text-primary">
                  Your profile and consent choices are now part of your account.
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  You can return later to revoke consent, export your data, or
                  request deletion from Data controls.
                </p>
              </div>
              {submissionMessage ? (
                <p className="text-sm leading-6 text-text-secondary">
                  {submissionMessage}
                </p>
              ) : null}

              <Card className="surface-3 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  Profile draft
                </p>
                <dl className="mt-4 grid gap-3 text-sm leading-6 text-text-secondary">
                  <div>
                    <dt className="text-text-primary">Condition</dt>
                    <dd>{profileDraft.diagnosis_selection.diagnosis_code}</dd>
                  </div>
                  <div>
                    <dt className="text-text-primary">Symptom history</dt>
                    <dd>
                      {profileDraft.physical_symptoms.length
                        ? profileDraft.physical_symptoms.join(", ")
                        : "None added"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-primary">Emotional experience</dt>
                    <dd>
                      {profileDraft.emotional_context.length
                        ? profileDraft.emotional_context.join(", ")
                        : "None added"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-primary">Treatment history</dt>
                    <dd>
                      {profileDraft.treatment_history.ablation_count} ablations,
                      implantable device:{" "}
                      {profileDraft.treatment_history.has_implantable_device === null
                        ? "unsure"
                        : profileDraft.treatment_history.has_implantable_device
                          ? "yes"
                          : "no"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-primary">Educational consent</dt>
                    <dd>{form.consent_education || "Not selected"}</dd>
                  </div>
                </dl>
              </Card>

              <MedicalDisclaimer />
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-token pt-6">
            <div className="flex gap-3">
              {stepIndex > 0 && !submitted ? (
                <Button onClick={goBack} variant="ghost">
                  Back
                </Button>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula hover:text-text-primary"
                href="/"
              >
                Return home
              </Link>
            </div>

            {!submitted ? (
              <Button disabled={isPending} onClick={goNext}>
                {currentStep.id === "consent"
                  ? isPending
                    ? "Saving choices..."
                    : "Save and continue"
                  : "Continue"}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link
                  className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  href="/account/data"
                >
                  Open data controls
                </Link>
                <Button
                  onClick={() => {
                    setForm(initialState);
                    setErrors({});
                    setSubmitted(false);
                    setSubmissionError(null);
                    setSubmissionMessage(null);
                    setStepIndex(0);
                  }}
                  variant="secondary"
                >
                  Start again
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
