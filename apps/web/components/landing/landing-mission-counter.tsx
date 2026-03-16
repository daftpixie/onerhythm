"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import type { LandingMissionMetrics } from "@onerhythm/types";

import {
  LANDING_MISSION_MILESTONES,
  formatCompactDistance,
  formatDistanceDisplay,
  projectFoundingMemberDistanceKm,
  resolveLandingMilestone,
} from "../../lib/landing";

type LandingMissionCounterProps = {
  initialMetrics: LandingMissionMetrics;
};

function formatFoundingCount(value: number): string {
  return value.toLocaleString();
}

function LadderStatus({
  reached,
  active,
}: {
  reached: boolean;
  active: boolean;
}) {
  if (reached) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-signal-soft">
        <CheckCircle2 className="h-4 w-4" />
        Reached
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-aurora-glow">
        <Sparkles className="h-4 w-4" />
        In progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary">
      <LockKeyhole className="h-4 w-4" />
      Locked
    </span>
  );
}

export function LandingMissionCounter({
  initialMetrics,
}: LandingMissionCounterProps) {
  const [metrics, setMetrics] = useState(initialMetrics);

  useEffect(() => {
    let cancelled = false;

    async function refreshMetrics() {
      try {
        const response = await fetch("/api/landing/metrics", {
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as LandingMissionMetrics;
        if (!cancelled) {
          setMetrics(payload);
        }
      } catch {
        // Keep the last known counters visible when polling fails.
      }
    }

    const interval = window.setInterval(() => {
      void refreshMetrics();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const foundingDistanceKm = useMemo(
    () => projectFoundingMemberDistanceKm(metrics.waitlist.total_signups),
    [metrics.waitlist.total_signups],
  );
  const displayedDistance = formatDistanceDisplay(foundingDistanceKm);
  const milestoneState = resolveLandingMilestone(foundingDistanceKm);

  return (
    <section
      aria-labelledby="mission-counter-heading"
      className="surface-panel space-y-8 p-6 sm:p-8"
    >
      <div className="space-y-3">
        <p className="page-eyebrow">Mission Counter</p>
        <h2 className="section-title" id="mission-counter-heading">
          The space race is on. Here&apos;s where we stand.
        </h2>
        <p className="max-w-3xl text-base leading-8 text-text-secondary">
          Founding-member distance is projected from one standard 10-second strip per
          person at 25 centimeters each. Public contribution distance below uses the
          live rhythm pipeline and remains separate from the waitlist projection.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="landing-counter-card">
          <p className="landing-counter-value text-pulse landing-counter-enter">
            {formatFoundingCount(metrics.waitlist.total_signups)}
          </p>
          <p className="landing-counter-label">Founding members aboard</p>
        </article>
        <article className="landing-counter-card">
          <p className="landing-counter-value text-signal landing-counter-enter">
            {displayedDistance.value}
            <span className="ml-2 text-[0.42em] uppercase tracking-[0.18em] text-text-secondary">
              {displayedDistance.unit}
            </span>
          </p>
          <p className="landing-counter-label">Projected shared rhythm</p>
        </article>
        <article className="landing-counter-card">
          <p className="landing-counter-value text-aurora-glow landing-counter-enter text-[clamp(1.85rem,4vw,3rem)]">
            {milestoneState.next?.label ?? "Milestone complete"}
          </p>
          <p className="landing-counter-label">
            {milestoneState.next
              ? `${formatCompactDistance(milestoneState.remainingKm)} remaining`
              : "Onward"}
          </p>
        </article>
      </div>

      <div className="rounded-[1.35rem] border border-token bg-midnight/70 px-5 py-4 text-sm leading-7 text-text-secondary">
        Current public mosaic distance:{" "}
        <span className="font-medium text-text-primary">
          {formatCompactDistance(metrics.rhythm.total_distance_km)}
        </span>
        {" from "}
        <span className="font-medium text-text-primary">
          {metrics.rhythm.total_contributions.toLocaleString()}
        </span>
        {" retained contributions."}
      </div>

      <div className="hidden gap-3 lg:grid">
        {LANDING_MISSION_MILESTONES.map((milestone) => {
          const reached = foundingDistanceKm >= milestone.distanceKm;
          const active = milestoneState.next?.key === milestone.key;

          return (
            <div
              className={[
                "grid grid-cols-[minmax(0,1.2fr)_auto_auto] items-center gap-4 rounded-[1.15rem] border px-4 py-3",
                reached
                  ? "border-signal/35 bg-signal/8"
                  : active
                    ? "border-aurora/40 bg-aurora/10 shadow-aurora"
                    : "border-token bg-midnight/55",
              ].join(" ")}
              key={milestone.key}
            >
              <p className="font-medium text-text-primary">{milestone.label}</p>
              <p className="font-mono text-sm text-text-secondary">
                {milestone.distanceKm.toLocaleString()} km
              </p>
              <LadderStatus active={active} reached={reached} />
            </div>
          );
        })}
      </div>

      <details className="surface-panel-soft overflow-hidden lg:hidden">
        <summary className="cursor-pointer list-none px-5 py-4 font-body text-sm font-medium text-text-primary">
          View milestone ladder
        </summary>
        <div className="space-y-3 px-5 pb-5">
          {LANDING_MISSION_MILESTONES.map((milestone) => {
            const reached = foundingDistanceKm >= milestone.distanceKm;
            const active = milestoneState.next?.key === milestone.key;

            return (
              <div
                className={[
                  "rounded-[1rem] border px-4 py-3",
                  reached
                    ? "border-signal/35 bg-signal/8"
                    : active
                      ? "border-aurora/40 bg-aurora/10"
                      : "border-token bg-midnight/55",
                ].join(" ")}
                key={milestone.key}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text-primary">{milestone.label}</p>
                  <p className="font-mono text-xs text-text-secondary">
                    {milestone.distanceKm.toLocaleString()} km
                  </p>
                </div>
                <div className="mt-2">
                  <LadderStatus active={active} reached={reached} />
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
