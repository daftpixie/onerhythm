"use client";

import { MedicalDisclaimer } from "@onerhythm/ui";

export default function ResearchPulseError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main>
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-12">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research Pulse
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[2.44rem] font-bold text-text-primary sm:text-5xl">
            The research feed could not be loaded right now.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            The published summaries and source trail are still expected here,
            but this request did not complete cleanly. Try the request again.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 rounded-xl border border-token bg-cosmos p-6">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
              Request state
            </p>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              {error.message}
            </p>
            <button
              className="action-link action-link-primary mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
