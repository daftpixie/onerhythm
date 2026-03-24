"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Globe2,
  Hand,
  Heart,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button, Input, MedicalDisclaimer } from "@onerhythm/ui";
import type {
  MissionContributionDraftInput,
  MissionNextChainIndex,
  MissionPaletteKey,
  MissionResultView,
  MissionRhythmType,
  MissionVerificationStartResponse,
} from "@onerhythm/types";
import { CANONICAL_MISSION_CONTRIBUTION_DISTANCE_METERS } from "@onerhythm/types";

import { siteContent } from "../../content/site-copy";
import {
  createMissionContributionDraft,
  finalizeMissionContribution,
  getMissionNextChainIndex,
  MissionApiError,
  startMissionContributionVerification,
} from "../../lib/mission-v3-api";
import { MissionBotcheckField } from "./mission-botcheck-field";
import { cn } from "../../lib/cn";
import { useReducedMotion } from "../../hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MissionJoinShellProps = {
  botcheckBypassToken?: string;
  referralSource?: string | null;
  turnstileSiteKey?: string;
};

type DraftFormState = MissionContributionDraftInput;

type FieldErrors = Partial<Record<string, string>>;

type StepIndex = 0 | 1 | 2 | 3 | 4;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_COUNT = 5;

const rhythmOptions: Array<{
  value: MissionRhythmType;
  label: string;
  evocation: string;
  icon: typeof Heart;
}> = [
  { value: "afib", label: "AFib", evocation: siteContent.join.rhythmEvocations.afib, icon: Waves },
  { value: "caregiver", label: "Caregiver", evocation: siteContent.join.rhythmEvocations.caregiver, icon: Hand },
  { value: "flutter", label: "Flutter", evocation: siteContent.join.rhythmEvocations.flutter, icon: Waves },
  { value: "icd_warrior", label: "ICD warrior", evocation: siteContent.join.rhythmEvocations.icd_warrior, icon: ShieldCheck },
  { value: "normal", label: "Steady", evocation: siteContent.join.rhythmEvocations.normal, icon: Heart },
  { value: "other", label: "Other", evocation: siteContent.join.rhythmEvocations.other, icon: Sparkles },
  { value: "pvcs", label: "PVCs", evocation: siteContent.join.rhythmEvocations.pvcs, icon: HeartPulse },
  { value: "supporter", label: "Supporter", evocation: siteContent.join.rhythmEvocations.supporter, icon: Users },
  { value: "svt", label: "SVT", evocation: siteContent.join.rhythmEvocations.svt, icon: Zap },
  { value: "vt", label: "VT", evocation: siteContent.join.rhythmEvocations.vt, icon: Zap },
];

const paletteOptions: Array<{
  value: MissionPaletteKey;
  label: string;
  accent: string;
  evocation: string;
}> = [
  {
    value: "signal",
    label: "Signal",
    accent: "linear-gradient(135deg, rgba(0,212,255,0.95), rgba(102,229,255,0.35))",
    evocation: siteContent.join.paletteEvocations.signal,
  },
  {
    value: "pulse",
    label: "Pulse",
    accent: "linear-gradient(135deg, rgba(255,45,85,0.95), rgba(255,107,138,0.38))",
    evocation: siteContent.join.paletteEvocations.pulse,
  },
  {
    value: "aurora",
    label: "Aurora",
    accent: "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(167,139,250,0.38))",
    evocation: siteContent.join.paletteEvocations.aurora,
  },
  {
    value: "ember",
    label: "Ember",
    accent: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(255,45,85,0.35))",
    evocation: siteContent.join.paletteEvocations.ember,
  },
  {
    value: "moonlit",
    label: "Moonlit",
    accent: "linear-gradient(135deg, rgba(249,250,251,0.7), rgba(102,229,255,0.18))",
    evocation: siteContent.join.paletteEvocations.moonlit,
  },
];


function defaultDraftState(referralSource?: string | null): DraftFormState {
  return {
    rhythm_type: "normal",
    palette_key: "signal",
    display_name: "",
    country_code: "",
    country_visibility: "public",
    note: "",
    note_visibility: "public",
    public_visibility: "unlisted",
    source: referralSource ? "referral" : "join",
    referral_source: referralSource ?? undefined,
    consent_version: "v3-consent-1",
    consent_flags: {
      terms_accepted: false,
      privacy_accepted: false,
      share_permissions_accepted: false,
    },
    honeypot: "",
  };
}

function formatCountryLabel(countryCode: string | undefined): string | null {
  if (!countryCode) {
    return null;
  }
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode
    );
  } catch {
    return countryCode;
  }
}

function buildCountryOptions() {
  const codes = [
    "US", "CA", "MX", "BR", "AR", "GB", "IE", "FR", "DE", "ES",
    "IT", "NL", "SE", "NO", "IN", "JP", "KR", "PH", "AU", "NZ",
    "ZA", "NG", "EG", "AE", "SG",
  ];
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  return codes
    .map((code) => ({
      code,
      label: displayNames.of(code) ?? code,
    }))
    .filter((option) => option.label && option.label !== option.code)
    .sort((left, right) => left.label.localeCompare(right.label));
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

function slideVariants(direction: number, reduced: boolean) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { x: direction > 0 ? 80 : -80, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: direction > 0 ? -80 : 80, opacity: 0 },
  };
}

/* ------------------------------------------------------------------ */
/*  Loading Phases                                                     */
/* ------------------------------------------------------------------ */

const LOADING_PHASES = [
  { text: "Creating your rhythm...", durationMs: 3000 },
  { text: "Together, we've traveled {distance} km...", durationMs: 3000 },
  { text: "{count} people from {countries} countries have joined...", durationMs: 3000 },
  { text: "We're {remaining} from {milestone}...", durationMs: 3000 },
  { text: "Your rhythm is taking a moment. It's worth the wait.", durationMs: Infinity },
] as const;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function GenerationLoading({
  signalId,
  distanceKm,
  contributions,
  countries,
  nextMilestone,
  remainingKm,
}: {
  signalId?: string;
  distanceKm?: number;
  contributions?: number;
  countries?: number;
  nextMilestone?: string;
  remainingKm?: number;
}) {
  const [phase, setPhase] = useState(0);

  useState(() => {
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < LOADING_PHASES.length - 1; i++) {
      elapsed += LOADING_PHASES[i].durationMs;
      timers.push(setTimeout(() => setPhase(i + 1), elapsed));
    }
    return () => timers.forEach(clearTimeout);
  });

  const current = LOADING_PHASES[phase];
  const text = current.text
    .replace("{distance}", (distanceKm ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 }))
    .replace("{count}", (contributions ?? 0).toLocaleString())
    .replace("{countries}", String(countries ?? 0))
    .replace("{milestone}", nextMilestone ?? "the next milestone")
    .replace("{remaining}", `${(remainingKm ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`);

  return (
    <div className="space-y-2 py-6 text-center">
      {signalId && (
        <p className="font-mono text-sm font-bold uppercase tracking-wider text-signal">
          GENERATING SIGNAL {signalId}...
        </p>
      )}
      <div className="flex items-center justify-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-pulse" />
        <p className="font-body text-sm text-text-secondary">
          {signalId ? "Your rhythm is being written into the chain." : text}
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="font-body text-sm leading-6 text-warning" role="alert">{message}</p>;
}

function MissionOnboardingHeader({ currentStep }: { currentStep: StepIndex }) {
  return (
    <header className="flex h-12 flex-shrink-0 items-center border-b border-token bg-midnight/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {siteContent.join.stepNames.map((name, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={name} className="flex items-center gap-1.5 sm:gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    "hidden h-px w-4 sm:block",
                    isCompleted ? "bg-signal" : "bg-token",
                  )}
                />
              )}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-normal sm:text-xs",
                  isActive && "border border-signal/40 bg-signal/10 text-signal",
                  isCompleted && "text-signal-soft",
                  !isActive && !isCompleted && "text-text-tertiary",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] sm:h-6 sm:w-6",
                  isActive && "border border-signal/50 bg-signal/15",
                  isCompleted && "border border-signal/30 bg-signal/10",
                  !isActive && !isCompleted && "border border-token bg-midnight/60",
                )}>
                  {isCompleted ? "\u2713" : i + 1}
                </span>
                <span className="hidden md:inline">{name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}

function StepNavigation({
  currentStep,
  canContinue,
  isPending,
  onBack,
  onContinue,
  continueLabel,
}: {
  currentStep: StepIndex;
  canContinue: boolean;
  isPending: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  const isLastStep = currentStep === STEP_COUNT - 1;
  return (
    <nav className="flex h-16 flex-shrink-0 items-center justify-between border-t border-token bg-midnight/80 px-4 backdrop-blur-sm sm:px-6">
      <div>
        {currentStep > 0 && (
          <Button
            variant="ghost"
            className="min-h-11 px-5 py-2.5"
            onClick={onBack}
            disabled={isPending}
            aria-label={siteContent.join.buttons.back}
          >
            {siteContent.join.buttons.back}
          </Button>
        )}
      </div>
      <div>
        {!isLastStep && (
          <Button
            className="min-h-11 px-6 py-2.5 shadow-glow-pulse"
            onClick={onContinue}
            disabled={!canContinue || isPending}
            aria-label={continueLabel ?? siteContent.join.buttons.continue}
          >
            {continueLabel ?? siteContent.join.buttons.continue}
          </Button>
        )}
      </div>
    </nav>
  );
}

function MissionPreviewPanel({
  draft,
  currentStep,
  draftResult,
}: {
  draft: DraftFormState;
  currentStep: StepIndex;
  draftResult: MissionResultView | null;
}) {
  const content = siteContent.join.preview;
  const selectedRhythm = rhythmOptions.find((r) => r.value === draft.rhythm_type);
  const selectedPalette = paletteOptions.find((p) => p.value === draft.palette_key);

  return (
    <div className="flex h-full flex-col border-l border-token bg-cosmos/60 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
          {siteContent.join.sections.previewEyebrow}
        </p>

        {draftResult?.art_asset?.image_url ? (
          <div className="mt-5 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-token bg-black/30 p-2">
              <img
                alt={draftResult.art_asset.alt_text ?? "Mission waveform preview"}
                className="w-full rounded-xl border border-token bg-black/20 object-cover"
                src={draftResult.art_asset.image_url}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {currentStep >= 1 && selectedRhythm ? (
              <p className="font-mono text-sm text-signal-soft">
                {content.signalIdentified(selectedRhythm.label)}
              </p>
            ) : (
              <p className="mt-8 text-center font-body text-base text-text-tertiary">
                {content.empty}
              </p>
            )}

            {currentStep >= 1 && selectedPalette && (
              <div
                className="h-20 rounded-xl border border-token"
                style={{ background: selectedPalette.accent }}
                aria-hidden="true"
              />
            )}
          </div>
        )}

        {currentStep >= 2 && (draft.display_name || draft.country_code || draft.note) && (
          <div className="mt-4 space-y-2 rounded-xl border border-token bg-midnight/50 p-3">
            {draft.display_name && (
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                Callsign: <span className="text-text-primary">{draft.display_name}</span>
              </p>
            )}
            {draft.country_code && (
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                Origin: <span className="text-text-primary">{formatCountryLabel(draft.country_code) ?? draft.country_code}</span>
              </p>
            )}
            {draft.note && (
              <p className="font-body text-sm text-text-secondary">{draft.note}</p>
            )}
          </div>
        )}

        {currentStep >= 3 && draft.consent_flags.terms_accepted && (
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
            {content.parametersConfirmed}
          </p>
        )}

        {draftResult?.contribution.signal_id && (
          <div className="mt-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              MISSION SIGNAL
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-signal">
              {draftResult.contribution.signal_id}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-token p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {content.distanceLabel}
          </p>
          <p className="font-display text-lg text-text-primary">
            {content.distanceValue}
          </p>
        </div>
      </div>
    </div>
  );
}

function MobilePreviewSheet({
  isOpen,
  onClose,
  draft,
  currentStep,
  draftResult,
}: {
  isOpen: boolean;
  onClose: () => void;
  draft: DraftFormState;
  currentStep: StepIndex;
  draftResult: MissionResultView | null;
}) {
  const reduced = useReducedMotion();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Close preview"
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-token bg-cosmos"
        initial={reduced ? { opacity: 0 } : { y: "100%" }}
        animate={reduced ? { opacity: 1 } : { y: 0 }}
        exit={reduced ? { opacity: 0 } : { y: "100%" }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between border-b border-token px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">Preview</p>
          <Button variant="ghost" onClick={onClose} className="min-h-11 px-3 py-2">
            Close
          </Button>
        </div>
        <MissionPreviewPanel draft={draft} currentStep={currentStep} draftResult={draftResult} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — SIGNAL                                                    */
/* ------------------------------------------------------------------ */

function StepSignal({
  draft,
  onSelect,
  error,
}: {
  draft: DraftFormState;
  onSelect: (value: MissionRhythmType) => void;
  error?: string;
}) {
  const step = siteContent.join.steps[0];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
        {step.name}
      </p>
      <h1 className="mt-3 font-display text-2xl text-text-primary sm:text-3xl">
        {step.heading}
      </h1>
      <p className="mt-2 font-body text-base text-text-secondary">
        {step.subheading}
      </p>
      <FieldError message={error} />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Rhythm identity">
        {rhythmOptions.map((option) => {
          const selected = draft.rhythm_type === option.value;
          const Icon = option.icon;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex min-h-[72px] items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-micro",
                selected
                  ? "border-pulse/60 bg-pulse/8 shadow-[0_0_16px_rgba(255,45,85,0.15)]"
                  : "border-token bg-midnight/72 hover:border-pulse/30 hover:bg-midnight/92",
              )}
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
            >
              <Icon className={cn("mt-0.5 h-6 w-6 flex-shrink-0", selected ? "text-pulse" : "text-text-tertiary")} />
              <div>
                <p className="font-display text-lg text-text-primary">{option.label}</p>
                <p className="mt-0.5 font-body text-sm text-text-secondary">{option.evocation}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — ATMOSPHERE                                                */
/* ------------------------------------------------------------------ */

function StepAtmosphere({
  draft,
  onSelect,
  error,
}: {
  draft: DraftFormState;
  onSelect: (value: MissionPaletteKey) => void;
  error?: string;
}) {
  const step = siteContent.join.steps[1];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
        {step.name}
      </p>
      <h1 className="mt-3 font-display text-2xl text-text-primary sm:text-3xl">
        {step.heading}
      </h1>
      <p className="mt-2 font-body text-base text-text-secondary">
        {step.subheading}
      </p>
      <FieldError message={error} />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {paletteOptions.map((option) => {
          const selected = draft.palette_key === option.value;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "group relative min-h-[160px] overflow-hidden rounded-2xl border p-4 text-left transition-all duration-micro",
                selected
                  ? "border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                  : "border-token hover:border-white/30",
              )}
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
              style={{ background: option.accent }}
            >
              <div className="relative z-10 flex h-full flex-col justify-end">
                <p className="font-display text-lg text-white drop-shadow-md">{option.label}</p>
                <p className="mt-1 font-body text-sm text-white/80 drop-shadow-md">{option.evocation}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — PERSONALIZE                                               */
/* ------------------------------------------------------------------ */

function StepPersonalize({
  draft,
  updateDraft,
  countryOptions,
  errors,
}: {
  draft: DraftFormState;
  updateDraft: <Key extends keyof DraftFormState>(key: Key, value: DraftFormState[Key]) => void;
  countryOptions: Array<{ code: string; label: string }>;
  errors: FieldErrors;
}) {
  const step = siteContent.join.steps[2];
  const selectedCountryLabel = formatCountryLabel(draft.country_code || undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
        {step.name}
      </p>
      <h1 className="mt-3 font-display text-2xl text-text-primary sm:text-3xl">
        {step.heading}
      </h1>
      <p className="mt-2 font-body text-base text-text-secondary">
        {step.subheading}
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label
            className="block font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary"
            htmlFor="callsign"
          >
            CALLSIGN
          </label>
          <p className="mt-1 font-body text-sm text-text-secondary">
            {siteContent.join.sections.displayNameDetail}
          </p>
          <Input
            id="callsign"
            maxLength={80}
            onChange={(event) => updateDraft("display_name", event.currentTarget.value)}
            placeholder="Maya, AJ, or whatever feels safe"
            value={draft.display_name}
            className="mt-2"
          />
        </div>

        <div>
          <label
            className="block font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary"
            htmlFor="origin"
          >
            ORIGIN
          </label>
          <p className="mt-1 flex items-center gap-2 font-body text-sm text-text-secondary">
            <Globe2 className="h-4 w-4 text-signal-soft" />
            {siteContent.join.sections.countryDetail}
          </p>
          <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Input
              id="origin"
              inputMode="text"
              maxLength={2}
              onChange={(event) =>
                updateDraft("country_code", event.currentTarget.value.toUpperCase())
              }
              placeholder="US"
              value={draft.country_code}
            />
            <select
              aria-label="Country selector"
              className="min-h-11 w-full rounded-md border border-token bg-void-midnight/92 px-3.5 py-2.5 font-body text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              onChange={(event) => updateDraft("country_code", event.currentTarget.value)}
              value={draft.country_code}
            >
              <option value="">Choose a country</option>
              {countryOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FieldError message={errors.country_code} />
          {selectedCountryLabel ? (
            <p className="mt-2 font-body text-sm text-signal-soft">{selectedCountryLabel}</p>
          ) : null}
        </div>

        <div>
          <label
            className="block font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary"
            htmlFor="transmission"
          >
            TRANSMISSION
          </label>
          <p className="mt-1 font-body text-sm text-text-secondary">
            {siteContent.join.sections.noteDetail}
          </p>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-token bg-void-midnight/92 px-4 py-3 font-body text-base leading-7 text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            id="transmission"
            maxLength={140}
            onChange={(event) => updateDraft("note", event.currentTarget.value)}
            placeholder="Say something. Or don't. Your rhythm speaks."
            value={draft.note}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — BRIEFING                                                  */
/* ------------------------------------------------------------------ */

function StepBriefing({
  draft,
  updateDraft,
  consentChecked,
  onConsentChange,
  errors,
}: {
  draft: DraftFormState;
  updateDraft: <Key extends keyof DraftFormState>(key: Key, value: DraftFormState[Key]) => void;
  consentChecked: boolean;
  onConsentChange: (checked: boolean) => void;
  errors: FieldErrors;
}) {
  const step = siteContent.join.steps[3];
  const narrativeParagraphs = siteContent.join.briefingNarrative;
  const vis = siteContent.join.visibility;
  const preview = siteContent.join.signalPreview;

  const [chainPreview, setChainPreview] = useState<MissionNextChainIndex | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMissionNextChainIndex().then((data) => {
      if (!cancelled) setChainPreview(data);
    }).catch(() => {
      /* non-critical — preview simply stays hidden */
    });
    return () => { cancelled = true; };
  }, []);

  const visibilityOptions = [
    { value: "public" as const, label: vis.publicLabel, description: vis.public },
    { value: "unlisted" as const, label: vis.unlistedLabel, description: vis.unlisted },
    { value: "private" as const, label: vis.privateLabel, description: vis.private },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
        {step.name}
      </p>
      <h1 className="mt-3 font-display text-2xl text-text-primary sm:text-3xl">
        {step.heading}
      </h1>

      {/* Narrative card */}
      <div className="mt-8 rounded-2xl bg-cosmos p-8">
        <div className="space-y-5">
          {narrativeParagraphs.map((paragraph, i) => (
            <p key={i} className="font-body text-base leading-relaxed text-text-secondary">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Signal ID preview */}
      {chainPreview && (
        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            {preview.label}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-signal">
            {chainPreview.next_signal_id}
          </p>
          <p className="mt-1 font-mono text-xs text-text-tertiary">
            {preview.positionPrefix} {chainPreview.next_chain_index.toLocaleString()} {preview.positionSuffix}
          </p>
        </div>
      )}

      {/* Visibility controls — How your signal travels */}
      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
          How your signal travels
        </p>
        <div className="mt-3 grid gap-2" role="radiogroup" aria-label="How your signal travels">
          {visibilityOptions.map((option) => {
            const selected = draft.public_visibility === option.value;
            return (
              <label
                className={cn(
                  "flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border bg-cosmos px-4 transition-all duration-micro",
                  selected
                    ? "border-l-2 border-l-signal border-y-signal/30 border-r-signal/30 shadow-[0_0_8px_rgba(0,212,255,0.1)]"
                    : "border-token",
                )}
                key={option.value}
              >
                <input
                  checked={selected}
                  className="h-4 w-4 accent-[var(--color-signal)]"
                  name="public_visibility"
                  onChange={() => updateDraft("public_visibility", option.value)}
                  type="radio"
                />
                <span className="flex flex-1 items-center justify-between">
                  <span className="font-body text-sm font-medium text-text-primary">
                    {option.label}
                  </span>
                  <span className="hidden font-body text-xs text-text-tertiary sm:inline">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Country visibility — single checkbox */}
      <div className="mt-4">
        <label className={cn(
          "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-cosmos px-4 py-3",
          draft.country_visibility === "public"
            ? "border-signal/30 bg-signal/5"
            : "border-token",
        )}>
          <input
            checked={draft.country_visibility === "public"}
            className="h-4 w-4 accent-[var(--color-signal)]"
            onChange={(event) =>
              updateDraft("country_visibility", event.currentTarget.checked ? "public" : "hidden")
            }
            type="checkbox"
          />
          <span className="font-body text-sm text-text-secondary">
            {vis.countryCheckbox}
          </span>
        </label>
      </div>

      {/* Note visibility — single checkbox */}
      <div className="mt-2">
        <label className={cn(
          "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-cosmos px-4 py-3",
          draft.note_visibility === "public"
            ? "border-signal/30 bg-signal/5"
            : "border-token",
        )}>
          <input
            checked={draft.note_visibility === "public"}
            className="h-4 w-4 accent-[var(--color-signal)]"
            onChange={(event) =>
              updateDraft("note_visibility", event.currentTarget.checked ? "public" : "private")
            }
            type="checkbox"
          />
          <span className="font-body text-sm text-text-secondary">
            {vis.noteCheckbox}
          </span>
        </label>
      </div>

      {/* Consent — single checkbox */}
      <div className="mt-6">
        <label className={cn(
          "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
          consentChecked
            ? "border-pulse/30 bg-pulse/5"
            : "border-token bg-cosmos",
        )}>
          <input
            checked={consentChecked}
            className="mt-1 h-4 w-4 accent-[var(--color-pulse)] transition-transform duration-micro checked:scale-110"
            onChange={(event) => onConsentChange(event.currentTarget.checked)}
            type="checkbox"
          />
          <span className="font-body text-sm leading-6 text-text-secondary">
            {siteContent.join.consentSingle}
          </span>
        </label>
        <FieldError message={errors.consent} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5 — LAUNCH                                                    */
/* ------------------------------------------------------------------ */

function StepLaunch({
  email,
  setEmail,
  code,
  setCode,
  verification,
  draftResult,
  turnstileToken,
  setTurnstileToken,
  botcheckBypassToken,
  turnstileSiteKey,
  isPending,
  statusMessage,
  errors,
  onSendCode,
  onFinalize,
}: {
  email: string;
  setEmail: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  verification: MissionVerificationStartResponse | null;
  draftResult: MissionResultView | null;
  turnstileToken: string;
  setTurnstileToken: (value: string) => void;
  botcheckBypassToken?: string;
  turnstileSiteKey?: string;
  isPending: boolean;
  statusMessage: string | null;
  errors: FieldErrors;
  onSendCode: () => void;
  onFinalize: () => void;
}) {
  const step = siteContent.join.steps[4];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
        {step.name}
      </p>
      <h1 className="mt-3 font-display text-2xl text-text-primary sm:text-3xl">
        {step.heading}
      </h1>
      <p className="mt-2 font-body text-base text-text-secondary">
        {step.subheading}
      </p>

      <div className="mt-8 space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary" htmlFor="mission-email">
            EMAIL
          </label>
          <Input
            autoCapitalize="none"
            autoComplete="email"
            id="mission-email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <FieldError message={errors.email} />
          <Button
            className="w-full"
            disabled={isPending}
            onClick={onSendCode}
            type="button"
            variant="secondary"
          >
            {siteContent.join.launch.sendCode}
          </Button>
        </div>

        {/* Verification sent */}
        {verification ? (
          <div className="space-y-4 rounded-2xl border border-signal/25 bg-signal/8 p-4">
            <div>
              <p className="font-body font-medium text-text-primary">
                {siteContent.join.sections.sentTitle(verification.masked_email)}
              </p>
              <p className="mt-2 font-body text-sm leading-6 text-text-secondary">
                {siteContent.join.sections.sentDetail}
              </p>
            </div>
            {verification.debug_code ? (
              <div className="rounded-xl border border-token bg-black/20 px-4 py-3">
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-text-tertiary">
                  Local/test code
                </p>
                <p className="mt-2 font-mono text-lg tracking-[0.24em] text-text-primary">
                  {verification.debug_code}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Code */}
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary" htmlFor="mission-code">
            VERIFICATION CODE
          </label>
          <Input
            autoComplete="one-time-code"
            id="mission-code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setCode(event.currentTarget.value.replace(/\s+/g, ""))}
            placeholder="123456"
            value={code}
          />
          <FieldError message={errors.code} />
        </div>

        {/* Botcheck */}
        <MissionBotcheckField
          bypassToken={botcheckBypassToken}
          disabled={isPending}
          onChange={setTurnstileToken}
          siteKey={turnstileSiteKey}
          value={turnstileToken}
        />
        <FieldError message={errors.turnstile} />

        {/* Launch button */}
        <Button
          className={cn(
            "w-full px-6 py-4 font-display text-lg",
            verification && code.length >= 6 && turnstileToken
              ? "shadow-[0_0_24px_rgba(255,45,85,0.35)] shadow-glow-pulse"
              : "",
          )}
          disabled={isPending || !verification}
          onClick={onFinalize}
          type="button"
        >
          {siteContent.join.launch.launchButton}
        </Button>

        {/* Status */}
        {isPending ? (
          <GenerationLoading
            signalId={draftResult?.contribution.signal_id}
            contributions={draftResult?.mission_aggregate.total_contributions}
            countries={draftResult?.mission_aggregate.countries_represented}
            distanceKm={draftResult?.mission_aggregate.total_distance_km}
            nextMilestone={draftResult?.milestones.find(
              (m) => m.distance_threshold_m > (draftResult?.mission_aggregate.total_distance_m ?? 0),
            )?.label}
            remainingKm={(draftResult?.mission_aggregate.distance_to_next_milestone_m ?? 0) / 1000}
          />
        ) : statusMessage ? (
          <p aria-live="polite" className="text-center font-body text-sm leading-6 text-text-secondary">
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <MedicalDisclaimer />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Shell                                                         */
/* ------------------------------------------------------------------ */

export function MissionJoinShell({
  botcheckBypassToken,
  referralSource,
  turnstileSiteKey,
}: MissionJoinShellProps) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<DraftFormState>(() => defaultDraftState(referralSource));
  const [draftResult, setDraftResult] = useState<MissionResultView | null>(null);
  const [verification, setVerification] = useState<MissionVerificationStartResponse | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState(botcheckBypassToken ?? "dev-turnstile-pass");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const countryOptions = useMemo(() => buildCountryOptions(), []);

  const updateDraft = useCallback(<Key extends keyof DraftFormState>(
    key: Key,
    value: DraftFormState[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  function validateDraft(nextDraft: DraftFormState): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (!nextDraft.rhythm_type) {
      nextErrors.rhythm_type = siteContent.join.validation.rhythm;
    }
    if (!nextDraft.palette_key) {
      nextErrors.palette_key = siteContent.join.validation.palette;
    }
    if (
      nextDraft.country_code &&
      !/^[A-Z]{2}$/.test(nextDraft.country_code.toUpperCase())
    ) {
      nextErrors.country_code = siteContent.join.validation.countryCode;
    }
    if (
      !nextDraft.consent_flags.terms_accepted ||
      !nextDraft.consent_flags.privacy_accepted ||
      !nextDraft.consent_flags.share_permissions_accepted
    ) {
      nextErrors.consent = siteContent.join.validation.consent;
    }
    return nextErrors;
  }

  const consentChecked =
    draft.consent_flags.terms_accepted &&
    draft.consent_flags.privacy_accepted &&
    draft.consent_flags.share_permissions_accepted;

  function handleConsentChange(checked: boolean) {
    updateDraft("consent_flags", {
      terms_accepted: checked,
      privacy_accepted: checked,
      share_permissions_accepted: checked,
    });
  }

  function canProceedFromStep(step: StepIndex): boolean {
    switch (step) {
      case 0:
        return !!draft.rhythm_type;
      case 1:
        return !!draft.palette_key;
      case 2:
        return true; // all optional
      case 3:
        return true; // validated on click in handleContinue
      case 4:
        return false; // last step, no "continue"
      default:
        return false;
    }
  }

  function goToStep(next: StepIndex) {
    setDirection(next > currentStep ? 1 : -1);
    setErrors({});
    setCurrentStep(next);
  }

  function handleContinue() {
    if (currentStep === 3 && !consentChecked) {
      setErrors({ consent: siteContent.join.validation.consent });
      return;
    }
    if (currentStep === 0 && !draft.rhythm_type) {
      setErrors({ rhythm_type: siteContent.join.validation.rhythm });
      return;
    }
    if (currentStep === 1 && !draft.palette_key) {
      setErrors({ palette_key: siteContent.join.validation.palette });
      return;
    }

    const nextStep = Math.min(currentStep + 1, STEP_COUNT - 1) as StepIndex;

    // When entering step 5 (LAUNCH), create draft immediately
    if (nextStep === 4 && !draftResult) {
      const nextDraft: DraftFormState = {
        ...draft,
        display_name: draft.display_name?.trim() || undefined,
        country_code: draft.country_code?.trim().toUpperCase() || undefined,
        note: draft.note?.trim() || undefined,
        referral_source: referralSource ?? draft.referral_source,
        source: referralSource ? "referral" : draft.source,
      };

      const draftErrors = validateDraft(nextDraft);
      if (Object.keys(draftErrors).length > 0) {
        setErrors(draftErrors);
        return;
      }

      goToStep(nextStep);
      startTransition(async () => {
        try {
          const result = await createMissionContributionDraft(nextDraft);
          setDraftResult(result);
          setVerification(null);
          setCode("");
          setStatusMessage(siteContent.join.statuses.draftReady);
        } catch (error) {
          const message =
            error instanceof MissionApiError
              ? error.message
              : siteContent.join.statuses.draftFailed;
          setStatusMessage(message);
        }
      });
      return;
    }

    goToStep(nextStep);
  }

  function handleBack() {
    const prevStep = Math.max(currentStep - 1, 0) as StepIndex;
    goToStep(prevStep);
  }

  function handleSendCode() {
    if (!draftResult) {
      // If draft hasn't been created yet (edge case), create it first
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrors((current) => ({
        ...current,
        email: siteContent.join.validation.email,
      }));
      setStatusMessage(siteContent.join.validation.sendEmail);
      return;
    }

    setErrors((current) => ({ ...current, email: undefined }));
    startTransition(async () => {
      try {
        const result = await startMissionContributionVerification({
          contribution_id: draftResult.contribution.id,
          email: email.trim(),
          honeypot: "",
        });
        setVerification(result);
        setStatusMessage(siteContent.join.statuses.verificationSent(result.masked_email));
      } catch (error) {
        const message =
          error instanceof MissionApiError
            ? error.message
            : siteContent.join.statuses.verificationFailed;
        setStatusMessage(message);
      }
    });
  }

  function handleFinalize() {
    if (!draftResult) {
      return;
    }
    if (!verification) {
      setStatusMessage(siteContent.join.validation.sendCode);
      return;
    }
    if (!code.trim()) {
      setErrors((current) => ({ ...current, code: siteContent.join.validation.code }));
      setStatusMessage(siteContent.join.validation.finalizeCode);
      return;
    }
    if (!turnstileToken.trim()) {
      setErrors((current) => ({
        ...current,
        turnstile: siteContent.join.validation.turnstile,
      }));
      setStatusMessage(siteContent.join.validation.turnstileStatus);
      return;
    }

    setErrors((current) => ({ ...current, code: undefined, turnstile: undefined }));
    startTransition(async () => {
      try {
        const result = await finalizeMissionContribution({
          contribution_id: draftResult.contribution.id,
          email: email.trim(),
          code: code.trim(),
          turnstile_token: turnstileToken.trim(),
        });
        const destination =
          result.outcome === "already_joined"
            ? `/result/${result.share_slug}?state=already-joined`
            : `/result/${result.share_slug}?state=celebrate`;
        router.push(destination);
      } catch (error) {
        const message =
          error instanceof MissionApiError
            ? error.message
            : siteContent.join.statuses.finalizeFailed;
        setStatusMessage(message);
      }
    });
  }

  const variants = slideVariants(direction, reduced);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void">
      <MissionOnboardingHeader currentStep={currentStep} />

      <div className="flex flex-1 overflow-hidden">
        {/* Step content */}
        <div className="flex-[3] overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              {currentStep === 0 && (
                <StepSignal
                  draft={draft}
                  onSelect={(value) => updateDraft("rhythm_type", value)}
                  error={errors.rhythm_type}
                />
              )}
              {currentStep === 1 && (
                <StepAtmosphere
                  draft={draft}
                  onSelect={(value) => updateDraft("palette_key", value)}
                  error={errors.palette_key}
                />
              )}
              {currentStep === 2 && (
                <StepPersonalize
                  draft={draft}
                  updateDraft={updateDraft}
                  countryOptions={countryOptions}
                  errors={errors}
                />
              )}
              {currentStep === 3 && (
                <StepBriefing
                  draft={draft}
                  updateDraft={updateDraft}
                  consentChecked={consentChecked}
                  onConsentChange={handleConsentChange}
                  errors={errors}
                />
              )}
              {currentStep === 4 && (
                <StepLaunch
                  email={email}
                  setEmail={setEmail}
                  code={code}
                  setCode={setCode}
                  verification={verification}
                  draftResult={draftResult}
                  turnstileToken={turnstileToken}
                  setTurnstileToken={setTurnstileToken}
                  botcheckBypassToken={botcheckBypassToken}
                  turnstileSiteKey={turnstileSiteKey}
                  isPending={isPending}
                  statusMessage={statusMessage}
                  errors={errors}
                  onSendCode={handleSendCode}
                  onFinalize={handleFinalize}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop preview panel */}
        <div className="hidden flex-[2] lg:flex">
          <MissionPreviewPanel
            draft={draft}
            currentStep={currentStep}
            draftResult={draftResult}
          />
        </div>
      </div>

      <StepNavigation
        currentStep={currentStep}
        canContinue={canProceedFromStep(currentStep)}
        isPending={isPending}
        onBack={handleBack}
        onContinue={handleContinue}
      />

      {/* Mobile preview pill */}
      {currentStep < 4 && (
        <button
          className="fixed bottom-20 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-signal/40 bg-cosmos/90 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-signal shadow-panel backdrop-blur-sm lg:hidden"
          onClick={() => setMobilePreviewOpen(true)}
          type="button"
        >
          Preview
        </button>
      )}

      <AnimatePresence>
        {mobilePreviewOpen && (
          <MobilePreviewSheet
            isOpen={mobilePreviewOpen}
            onClose={() => setMobilePreviewOpen(false)}
            draft={draft}
            currentStep={currentStep}
            draftResult={draftResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
