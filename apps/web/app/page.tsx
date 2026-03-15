import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { WaitlistForm } from "../components/landing/waitlist-form";
import { StructuredData } from "../components/structured-data";
import { buildPageMetadata } from "../lib/metadata";
import { absoluteUrl } from "../lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Closed beta waitlist",
  description:
    "Join the OneRhythm closed beta waitlist. OneRhythm is a privacy-first, non-diagnostic community platform for people living with arrhythmias.",
  path: "/",
  keywords: [
    "OneRhythm",
    "arrhythmia community",
    "closed beta waitlist",
    "heart mosaic",
    "non-diagnostic",
  ],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OneRhythm",
  url: absoluteUrl("/"),
  description:
    "A privacy-first, non-diagnostic community platform making the invisible emotional weight of arrhythmia more visible through solidarity, education, and the Heart Mosaic.",
  publisher: {
    "@type": "Organization",
    name: "OneRhythm",
    url: absoluteUrl("/"),
  },
};

export default function HomePage() {
  return (
    <main className="page-shell overflow-hidden">
      <StructuredData data={structuredData} />
      <section className="relative isolate overflow-hidden px-6 pb-14 pt-10 sm:px-10 lg:px-12 lg:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-8rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-signal/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10rem] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-pulse/12 blur-3xl"
        />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:items-start">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3 text-[0.78rem] uppercase tracking-[0.18em] text-text-secondary">
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-signal-soft">
                Closed beta
              </span>
              <span className="rounded-full border border-token bg-midnight/70 px-3 py-1">
                Privacy-first
              </span>
              <span className="rounded-full border border-token bg-midnight/70 px-3 py-1">
                Non-diagnostic
              </span>
            </div>

            <div className="space-y-5">
              <p className="max-w-2xl text-sm uppercase tracking-[0.2em] text-text-secondary">
                Invisible suffering made visible
              </p>
              <h1 className="max-w-4xl font-display text-[clamp(3.6rem,9vw,7.6rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-text-primary">
                A shared rhythm can become a public act of solidarity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">
                OneRhythm is building a humane, privacy-first platform for people living
                with arrhythmias. The public experience starts here: a mission-led landing
                page, a careful closed beta, and a waitlist that asks for only one thing.
                Your email.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-token bg-midnight/78 p-5 shadow-panel">
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-signal-soft">
                  Movement
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-text-primary">
                  80 million
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  rhythms to circle the world. The scale is not a slogan. It is the size
                  of the community we refuse to leave invisible.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-token bg-midnight/78 p-5 shadow-panel">
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-pulse-glow">
                  Horizon
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-text-primary">
                  769 million
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  rhythms to the Moon. The metaphor is collective distance, not clinical
                  measurement.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-token bg-midnight/78 p-5 shadow-panel">
                <p className="font-mono text-sm uppercase tracking-[0.14em] text-text-secondary">
                  Boundary
                </p>
                <p className="mt-3 font-display text-4xl leading-none text-text-primary">
                  Zero diagnosis
                </p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  OneRhythm is an educational resource and community platform. It is not
                  a medical device, and it does not interpret ECGs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <Link
                className="rounded-[0.9rem] border border-token px-4 py-2.5 transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/mission"
              >
                Read the mission
              </Link>
              <Link
                className="rounded-[0.9rem] border border-token px-4 py-2.5 transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/about"
              >
                Review trust and privacy
              </Link>
              <Link
                className="rounded-[0.9rem] border border-token px-4 py-2.5 transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/sign-in"
              >
                Invited already? Sign in
              </Link>
            </div>
          </div>

          <aside
            className="relative rounded-[2rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.94),rgba(17,24,39,0.98))] p-6 shadow-panel sm:p-7"
            id="waitlist"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(102,229,255,0.9),transparent)]"
            />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
              Beta waitlist
            </p>
            <h2 className="mt-4 max-w-sm font-display text-3xl leading-tight text-text-primary">
              Help build the first careful release of OneRhythm.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-text-secondary">
              Join the list for invite waves, deployment updates, and launch notes for
              <span className="font-mono text-text-primary"> onerhythm.org </span>
              . We are opening slowly so the platform stays trustworthy from day one.
            </p>

            <div className="mt-8">
              <WaitlistForm />
            </div>

            <div className="mt-8 grid gap-3 text-sm text-text-secondary">
              <div className="rounded-[1.25rem] border border-token/80 bg-deep-void/55 px-4 py-3">
                Public visitors can explore the mission now.
              </div>
              <div className="rounded-[1.25rem] border border-token/80 bg-deep-void/55 px-4 py-3">
                Invite-only access gates account, education, and contribution flows.
              </div>
              <div className="rounded-[1.25rem] border border-token/80 bg-deep-void/55 px-4 py-3">
                Secrets stay server-side. Waitlist storage stays separate from user data.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <div className="space-y-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
            Collective solidarity
          </p>
          <h2 className="max-w-xl font-display text-4xl leading-tight text-text-primary sm:text-5xl">
            Shared rhythm means more than individual coping. It means public proof.
          </h2>
          <p className="max-w-xl text-base leading-8 text-text-secondary">
            The Heart Mosaic is artistic, not diagnostic. It exists to turn isolated
            experience into something visible, shared, and impossible to dismiss as a
            private weakness. OneRhythm is building that visibility with careful
            boundaries around privacy, consent, and educational use.
          </p>
          <p className="max-w-xl text-base leading-8 text-text-secondary">
            Public pages stay open so people can understand the mission, review the
            evidence, and decide whether to trust the work. Closed-beta routes stay
            gated until the allowlist says yes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-[2rem] border border-token bg-midnight/70 shadow-panel">
            <Image
              alt="Illustration of 80 million rhythms circling the world."
              className="h-full w-full object-cover"
              height={768}
              src="/brand/OneRhythmWorld.jpeg"
              width={1365}
            />
            <figcaption className="border-t border-token px-5 py-4 text-sm leading-6 text-text-secondary">
              80 million rhythms to circle the world: a way to see scale, shared burden,
              and the possibility of collective visibility.
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-[2rem] border border-token bg-midnight/70 shadow-panel">
            <Image
              alt="Illustration of 769 million rhythms reaching the Moon."
              className="h-full w-full object-cover"
              height={768}
              src="/brand/OneRhythmMoon.jpeg"
              width={1365}
            />
            <figcaption className="border-t border-token px-5 py-4 text-sm leading-6 text-text-secondary">
              769 million rhythms to the Moon: hopeful, but still grounded in the idea
              that distance only matters when people move together.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-token bg-midnight/78 p-6 shadow-panel">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
              Trust before scale
            </p>
            <h2 className="mt-4 font-display text-3xl text-text-primary">
              The first deployment stack is simple on purpose.
            </h2>
            <div className="mt-6 grid gap-4 text-sm leading-7 text-text-secondary">
              <p>
                Railway for the web and API. Supabase Postgres for the database.
                OneRhythm.org as the primary domain.
              </p>
              <p>
                The waitlist stores only email addresses in a separate table. Invite
                approval happens by allowlist, not by client-side guesswork.
              </p>
              <p>
                Public trust pages remain open. Account, contribution, and personalized
                education stay behind beta access.
              </p>
            </div>
          </div>

          <div className="space-y-5 rounded-[2rem] border border-token bg-midnight/78 p-6 shadow-panel">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  Public now
                </p>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Landing page, mission, stories, evidence, research, and sign-in.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  Invite-only
                </p>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Onboarding, contribution, account controls, and personalized education.
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  Open source
                </p>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Architecture, trust notes, and privacy boundaries stay reviewable in
                  the public repository.
                </p>
              </div>
            </div>
            <MedicalDisclaimer />
          </div>
        </div>
      </section>
    </main>
  );
}
