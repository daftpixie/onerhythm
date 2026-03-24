import type { Metadata } from "next";

import { Card, MedicalDisclaimer } from "@onerhythm/ui";

import { WaitlistForm } from "../../components/landing/waitlist-form";
import { learn } from "../../content/pages/learn";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "ResearchPulse Beta | OneRhythm",
  description:
    "ResearchPulse is in development. Preview condition-specific education features, supportive information, and request beta access.",
  path: "/learn",
});

export default function LearnPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="overflow-hidden rounded-[2rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.96),rgba(17,24,39,0.94)),radial-gradient(circle_at_top_right,rgba(102,229,255,0.1),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,45,85,0.08),transparent_28%)] p-6 shadow-panel sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal-soft">
              {learn.hero.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,4.8rem)] leading-[0.94] text-text-primary">
              {learn.hero.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
              {learn.hero.body}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {learn.hero.highlights.map((highlight) => (
                <div
                  className="rounded-full border border-token bg-midnight/68 px-4 py-2 text-sm text-text-secondary shadow-panel"
                  key={highlight}
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-signal/22 bg-midnight/78 p-5 shadow-panel backdrop-blur-sm sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
              {learn.betaAccess.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-tight text-text-primary">
              {learn.betaAccess.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
              {learn.betaAccess.body}
            </p>
            <ul className="mt-5 space-y-3">
              {learn.betaAccess.checklist.map((item) => (
                <li
                  className="rounded-[1.15rem] border border-token bg-cosmos/72 px-4 py-3 text-sm leading-6 text-text-secondary"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
            <WaitlistForm
              buttonLabel={learn.betaAccess.buttonLabel}
              className="mt-6"
              idPrefix="researchpulse-beta"
              source="researchpulse-beta"
              variant="researchPulseBeta"
            />
          </div>
        </div>
      </section>

      <MedicalDisclaimer />

      <section>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
          {learn.featureIntro.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,3.8vw,3rem)] leading-tight text-text-primary">
          {learn.featureIntro.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">
          {learn.featureIntro.body}
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {learn.featurePreviews.map((feature) => (
            <Card className="rounded-[1.5rem] bg-cosmos/82" key={feature.title}>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
                {feature.label}
              </p>
              <h3 className="mt-3 font-display text-2xl leading-tight text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary sm:text-base">
                {feature.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="rounded-[1.6rem] bg-cosmos/78">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            {learn.process.eyebrow}
          </p>
          <div className="mt-5 space-y-4">
            {learn.process.steps.map((step, index) => (
              <div
                className="rounded-[1.25rem] border border-token bg-midnight/72 px-4 py-4"
                key={step.title}
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-aurora-glow">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-xl text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.6rem] bg-cosmos/78">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            {learn.principles.eyebrow}
          </p>
          <div className="mt-5 space-y-3">
            {learn.principles.items.map((item) => (
              <div
                className="rounded-[1.25rem] border border-token bg-midnight/72 px-4 py-4 text-sm leading-7 text-text-secondary sm:text-base"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
