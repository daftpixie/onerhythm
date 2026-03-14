import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@onerhythm/ui";

import { HeartMosaic } from "../../components/heart-mosaic";
import { buildPageMetadata } from "../../lib/metadata";
import { getHomepageMosaicData } from "../../lib/mosaic-api";

export const metadata: Metadata = buildPageMetadata({
  title: "Community",
  description:
    "The public Heart Mosaic and the community principles behind OneRhythm's visibility and privacy model.",
  path: "/community",
});

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const mosaicData = await getHomepageMosaicData();

  return (
    <main className="page-shell mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <section className="page-header">
        <p className="page-eyebrow">Community and Heart Mosaic</p>
        <h1 className="page-title mt-4">
          You are not alone in this.
        </h1>
        <p className="page-intro mt-4">
          The Heart Mosaic is the public centerpiece of OneRhythm. Every
          de-identified contribution becomes part of a collective visual
          artifact: not diagnostic, but tangible proof that isolation is not
          the whole story.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Community principles
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "Participation is consent-based and revocable.",
              "Public tile metadata stays anonymous.",
              "Original uploads are processed ephemerally and not retained.",
              "The mosaic is artistic and collective, never diagnostic.",
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
            Contribute carefully
          </p>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            Contribution is optional. The first step is a self-reported profile
            and explicit consent. From there, a supported upload can move
            through the privacy-preserving processing path into an anonymized
            public tile. The act of contributing is meant to feel like
            solidarity, not extraction.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="action-link action-link-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/sign-up"
            >
              Join OneRhythm
            </Link>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/community/stories"
            >
              Read community stories
            </Link>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/account/stories"
            >
              Share your story
            </Link>
            <Link
              className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              href="/onboarding"
            >
              Start your profile
            </Link>
          </div>
        </Card>
      </section>

      <HeartMosaic
        fetchState={mosaicData.fetch_state}
        stats={mosaicData.stats}
        tiles={mosaicData.tiles}
      />
    </main>
  );
}
