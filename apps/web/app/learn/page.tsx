import type { Metadata } from "next";
import Link from "next/link";

import { Card, MedicalDisclaimer } from "@onerhythm/ui";

import { buildPageMetadata } from "../../lib/metadata";
import { listConditionModules, listContentByKind } from "../../lib/content";

export const metadata: Metadata = buildPageMetadata({
  title: "Educational Hub",
  description:
    "A public landing page for OneRhythm's educational surfaces, condition modules, support resources, and profile-based guidance boundary.",
  path: "/learn",
});

export default function LearnPage() {
  const conditionModules = listConditionModules();
  const supportPages = listContentByKind("support_resource");

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="page-header">
        <p className="page-eyebrow">Educational hub</p>
        <h1 className="page-title mt-4">
          Arm yourself with knowledge, not noise.
        </h1>
        <p className="page-intro mt-4">
          OneRhythm's educational surfaces are designed to help people feel more
          informed and less alone. They are clinically grounded, measured, and
          never diagnostic. They do not interpret ECGs, diagnose conditions, or
          recommend treatment.
        </p>
      </section>

      <MedicalDisclaimer />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            What exists here
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "Plain-language condition modules",
              "Research translation articles",
              "Support-resource pages",
              "Profile-based guidance for signed-in users with consent",
            ].map((point) => (
              <li
                className="surface-3 rounded-[1.1rem] border border-token px-4 py-4 text-sm leading-6 text-text-secondary"
                key={point}
              >
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="surface-panel-accent">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Boundary
          </p>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            Educational output is limited to self-reported profile data plus
            approved sources. It is intentionally separated from ECG uploads,
            OCR output, and public mosaic metadata. The philosophy is not dumbed
            down. It is democratized.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/education"
            >
              Open profile-based guidance
            </Link>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/onboarding"
            >
              Build your profile
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Condition modules
          </p>
          <div className="mt-4 space-y-4">
            {conditionModules.map((entry) => (
              <article className="surface-panel-soft p-4" key={entry.content_id}>
                <h2 className="text-xl text-text-primary">{entry.title}</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{entry.summary}</p>
                <Link className="mt-3 inline-flex text-sm text-signal" href={`/conditions/${entry.slug}`}>
                  Open module
                </Link>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Support resources
          </p>
          <div className="mt-4 space-y-4">
            {supportPages.map((entry) => (
              <article className="surface-panel-soft p-4" key={entry.content_id}>
                <h2 className="text-xl text-text-primary">{entry.title}</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{entry.summary}</p>
                <Link className="mt-3 inline-flex text-sm text-signal" href={`/support/${entry.slug}`}>
                  Open support page
                </Link>
              </article>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
