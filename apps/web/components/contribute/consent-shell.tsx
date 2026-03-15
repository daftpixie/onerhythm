"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { createConsent, getSession, listConsents } from "../../lib/auth-api";

const consentItems = [
  {
    id: "de_identification",
    label:
      "I understand my ECG will be stripped of metadata and visible identifiers before downstream use.",
  },
  {
    id: "artistic_transform",
    label:
      "I understand my ECG will be transformed into an abstract artistic tile and the original file will be destroyed after processing.",
  },
  {
    id: "public_mosaic",
    label:
      "I consent to my anonymized artistic tile being displayed in the public Heart Mosaic.",
  },
  {
    id: "distance_measurement",
    label:
      "I understand the shared rhythm distance is counted from a documented ECG page-layout policy, not from diagnostic interpretation of my ECG.",
  },
];

export function ConsentShell() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allChecked = consentItems.every((item) => checked[item.id]);

  async function handleContinue() {
    if (!allChecked || isPending) {
      return;
    }

    setIsPending(true);
    setMessage(null);

    try {
      const session = await getSession();

      if (!session.authenticated || !session.user) {
        router.push("/sign-in?next=%2Fcontribute%2Fconsent");
        return;
      }

      if (!session.user.profile_id) {
        router.push("/onboarding");
        return;
      }

      const consents = await listConsents(session.user.profile_id);
      const existing = consents.find(
        (record) =>
          record.consent_type === "mosaic_contribution" &&
          record.status === "granted" &&
          !record.revoked_at,
      );

      if (!existing) {
        await createConsent({
          profile_id: session.user.profile_id,
          consent_type: "mosaic_contribution",
          status: "granted",
          policy_version: "launch-v1",
          locale: "en-US",
          effective_at: new Date().toISOString(),
        });
      }

      router.push("/contribute/upload");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Your consent choices could not be recorded right now.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="relative flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-token bg-cosmos/85 p-8 shadow-surface backdrop-blur-sm">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">
          Consent
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-text-primary sm:text-4xl">
          Before you contribute
        </h1>
        <p className="mt-4 text-base leading-7 text-text-secondary">
          OneRhythm treats ECG uploads as sensitive. Review each statement
          before the system opens a processing session.
        </p>

        {message ? (
          <p
            aria-live="polite"
            className="mt-6 rounded-2xl border border-pulse/35 bg-pulse/10 px-4 py-3 text-sm leading-6 text-pulse"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {consentItems.map((item) => (
            <label
              key={item.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[1.25rem] border border-token bg-cosmos-nebula/60 p-4 transition-colors hover:bg-cosmos-nebula"
            >
              <input
                checked={checked[item.id] ?? false}
                className="mt-1 h-5 w-5 shrink-0 rounded border-token accent-signal"
                onChange={(event) =>
                  setChecked((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="text-sm leading-6 text-text-secondary">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-8">
          <MedicalDisclaimer />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Link
            className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
            href="/contribute"
          >
            Back
          </Link>
          <button
            className={`action-link px-6 py-3 text-base ${
              allChecked
                ? "action-link-primary"
                : "cursor-not-allowed border border-token bg-cosmos-nebula/70 text-text-tertiary"
            }`}
            disabled={!allChecked || isPending}
            onClick={() => {
              void handleContinue();
            }}
            type="button"
          >
            {isPending ? "Recording consent..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
