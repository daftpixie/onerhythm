"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { UploadSession } from "@onerhythm/types";

import { ArtReveal } from "./art-reveal";
import { getUploadSession } from "../../lib/auth-api";

type RevealState =
  | {
      status: "loading";
      session: null;
      message: string;
    }
  | {
      status: "ready" | "fallback";
      session: UploadSession | null;
      message: string;
    };

const INITIAL_STATE: RevealState = {
  status: "loading",
  session: null,
  message: "Preparing your contribution segment.",
};

export function RevealShell() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<RevealState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    const uploadSessionId = searchParams?.get("session") ?? null;

    if (!uploadSessionId) {
      setState({
        status: "fallback",
        session: null,
        message:
          "We could not find a completed upload session, so a fallback segment is shown instead.",
      });
      return;
    }

    async function loadSession() {
      const sessionId = uploadSessionId;

      if (!sessionId) {
        return;
      }

      try {
        const session = await getUploadSession(sessionId);

        if (cancelled) {
          return;
        }

        if (
          session.processing_status === "completed" &&
          session.result_tile &&
          session.contribution_distance
        ) {
          setState({
            status: "ready",
            session,
            message: "Your contribution segment is ready to join the shared line.",
          });
          return;
        }

        setState({
          status: "fallback",
          session,
          message:
            session.user_message ||
            "The artistic transform did not return a finished segment, so a fallback is shown here instead.",
        });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "fallback",
            session: null,
            message:
              error instanceof Error
                ? error.message
                : "The upload result could not be loaded, so a fallback segment is shown instead.",
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const contributionDistance = state.session?.contribution_distance;
  const distanceCm =
    contributionDistance?.distance_cm ?? state.session?.rhythm_distance_cm ?? 6.25;
  const policyLabel =
    contributionDistance?.label ?? "1 Rhythm Unit fallback";
  const provenance =
    contributionDistance?.provenance ??
    "This fallback tile keeps the reveal state visible even when a completed artistic tile is unavailable.";

  return (
    <main className="relative flex min-h-[80dvh] flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
        <div className="flex justify-center">
          <ArtReveal
            tile={state.session?.result_tile}
            variant={state.status === "ready" ? "ready" : state.status}
          />
        </div>

        <div className="space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">
            Contribution reveal
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary sm:text-4xl lg:text-5xl">
            Your rhythm now extends the shared line.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-text-secondary">
            {state.message}
          </p>

          <div className="rounded-[1.75rem] border border-token bg-cosmos/80 p-6 shadow-surface backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
              Contribution distance
            </p>
            <p className="mt-3 font-display text-4xl text-text-primary sm:text-5xl">
              {distanceCm.toFixed(2)}{" "}
              <span className="text-xl text-text-secondary sm:text-2xl">cm</span>
            </p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              {policyLabel}
            </p>
            <p className="mt-3 text-sm leading-7 text-text-tertiary">
              {provenance}
            </p>
          </div>

          <div
            className={`rounded-[1.5rem] border px-5 py-4 text-sm leading-7 ${
              state.status === "ready"
                ? "border-signal/35 bg-signal/10 text-text-secondary"
                : "border-pulse/35 bg-pulse/10 text-text-secondary"
            }`}
          >
            OneRhythm never diagnoses or interprets the ECG itself. The tile is
            abstract, and the distance metric reflects a documented page-layout
            policy rather than a clinical waveform analysis.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="action-link action-link-primary px-6 py-3 text-base"
              href={state.status === "ready" ? "/contribute/joined" : "/contribute/upload"}
            >
              {state.status === "ready" ? "Join the Mosaic" : "Try another upload"}
            </Link>
            <Link
              className="action-link action-link-quiet px-6 py-3 text-base"
              href="/contribute"
            >
              Return to contribute
            </Link>
          </div>

          <MedicalDisclaimer />
        </div>
      </div>
    </main>
  );
}
