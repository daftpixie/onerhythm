import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BatteryCharging,
  BookOpen,
  HeartHandshake,
  HeartPulse,
  MessageSquare,
  Microscope,
  ShieldPlus,
  Sparkles,
  Star,
  Stethoscope,
  Unlock,
} from "lucide-react";

import { MedicalDisclaimer } from "@onerhythm/ui";
import type { LandingMissionMetrics } from "@onerhythm/types";

import { LandingMissionCounter } from "../components/landing/landing-mission-counter";
import { LandingMosaicPreview } from "../components/landing/landing-mosaic-preview";
import { WaitlistForm } from "../components/landing/waitlist-form";
import { StructuredData } from "../components/structured-data";
import { buildPageMetadata } from "../lib/metadata";
import { getHomepageMosaicData } from "../lib/mosaic-api";
import { getRhythmDistanceStats } from "../lib/rhythm-api";
import { absoluteUrl } from "../lib/site";
import { buildLandingMissionMetrics, formatCompactDistance } from "../lib/landing";
import { getWaitlistStats } from "../lib/waitlist-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Nobody should fight an invisible bear alone",
  description:
    "Join the OneRhythm beta waitlist. OneRhythm is building an arrhythmia community, education platform, and a path for humans to reach the Moon",
  path: "/",
  keywords: [
    "OneRhythm",
    "arrhythmia community",
    "beta waitlist",
    "heart mosaic",
    "mental health and arrhythmia",
    "non-diagnostic",
  ],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OneRhythm",
  url: absoluteUrl("/"),
  description:
    "OneRhythm is an educational arrhythmia platform and community building a public Heart Mosaic and translating peer-reviewed research into language that patients can understand",
  publisher: {
    "@type": "Organization",
    name: "OneRhythm",
    url: absoluteUrl("/"),
  },
};

const crisisStats = [
  {
    value: "88.3%",
    context: "That is nearly 9 in 10 people in your cardiologist's waiting room.",
    source: "Nature Scientific Reports, 2025",
    title: "of arrhythmia patients report moderate-to-severe anxiety",
  },
  {
    value: "1 in 5",
    context: "The disease itself is the cause - not a pre-existing condition.",
    source: "Kalman et al., JAHA",
    title: "symptomatic AFib patients has experienced suicidal ideation",
  },
  {
    value: "3.2x",
    context: "Even after controlling for disease severity.",
    source: "EP Europace, 2023, N=39,954",
    title: "greater likelihood of dying within 5 years for ICD patients with untreated PTSD",
  },
] as const;

const distanceRows: Array<{
  label: string;
  distance: string;
  contributors: string;
  accent?: boolean;
}> = [
  {
    label: "Across the English Channel",
    distance: "34 km",
    contributors: "136,000",
  },
  {
    label: "London to Paris",
    distance: "340 km",
    contributors: "1.36 million",
  },
  {
    label: "Tampa to London",
    distance: "7,100 km",
    contributors: "28.4 million",
  },
  {
    label: "Every AF patient on Earth, one strip",
    distance: "13,138 km",
    contributors: "52.55 million",
    accent: true,
  },
  {
    label: "Once around the Earth",
    distance: "40,075 km",
    contributors: "160.3 million",
    accent: true,
  },
  {
    label: "To the Moon",
    distance: "384,400 km",
    contributors: "1.54 billion",
    accent: true,
  },
] as const;

const audienceItems = [
  { icon: HeartPulse, label: "AFib and atrial flutter patients" },
  { icon: Activity, label: "PVC and ectopic beat fighters" },
  { icon: BatteryCharging, label: "ICD and pacemaker carriers" },
  { icon: ShieldPlus, label: "ARVC, VT and complex arrhythmia" },
  { icon: Sparkles, label: "SVT, Long QT, Brugada and WPW" },
  { icon: HeartHandshake, label: "Caregivers, partners and families" },
  { icon: Stethoscope, label: "Cardiologists, EPs and cardiac nurses" },
  { icon: Microscope, label: "Researchers and mental health clinicians" },
] as const;

const benefitCards = [
  {
    icon: Star,
    tone: "text-aurora-glow",
    title: "Founding Member Badge",
    copy:
      "Your tile in the Heart Mosaic will carry a permanent founding member marker. The earliest contributors form the emotional core of the mosaic, center-out.",
  },
  {
    icon: Unlock,
    tone: "text-signal-soft",
    title: "First Through the Door",
    copy:
      "Beta testers get early access to ECG contribution, the Heart Mosaic, personalized educational content, Research Pulse, and the shared rhythm counter before public launch.",
  },
  {
    icon: MessageSquare,
    tone: "text-pulse-glow",
    title: "Your Feedback Shapes the Platform",
    copy:
      "OneRhythm is open source and built for the community it serves. Beta testers get a direct path from feedback to roadmap discussion.",
  },
  {
    icon: BookOpen,
    tone: "text-signal-soft",
    title: "Research Pulse - First Access",
    copy:
      "Peer-reviewed electrophysiology and cardiac psychology research, translated into plain language with suggested questions for your next EP appointment.",
  },
] as const;

const previewCards = [
  {
    title: "Your Heartbeat, Visualized",
    copy:
      "Contribute a de-identified ECG. Watch it become a tile in a collective heart - a growing artwork where every rhythm, no matter how irregular, is part of the bigger mission. Not diagnostic. Artistic. Yours.",
  },
  {
    title: "Research Pulse",
    copy:
      "Peer-reviewed electrophysiology and cardiac psychology research, summarized in plain language. What it says. Why it matters. What it does not prove. Questions to bring to your next EP appointment.",
  },
  {
    title: "A Community That Gets It",
    copy:
      "AFib, PVCs, ARVC, ICD, SVT - every rhythm has a place here. Patients, caregivers, clinicians, and researchers in the same space because the invisible bears do not discriminate.",
  },
] as const;

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseReferralCode(
  params: Record<string, string | string[] | undefined>,
): string | null {
  const raw = params.ref;
  const ref = Array.isArray(raw) ? raw[0] : raw;
  return ref ? ref.toLowerCase() : null;
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="landing-hero-metric">
      <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">{label}</p>
      <p className="mt-2 font-display text-[clamp(1.6rem,4vw,2.35rem)] leading-none tracking-[-0.04em] text-text-primary">
        {value}
      </p>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const referralCode = parseReferralCode(resolvedSearchParams);

  const [waitlist, rhythm, mosaic] = await Promise.all([
    getWaitlistStats(),
    getRhythmDistanceStats(),
    getHomepageMosaicData(),
  ]);

  const missionMetrics: LandingMissionMetrics = buildLandingMissionMetrics({
    waitlist,
    rhythm,
  });

  return (
    <main className="page-shell landing-page overflow-x-hidden">
      <StructuredData data={structuredData} />

      <section className="landing-hero-section px-6 pb-16 pt-10 sm:px-10 lg:px-12 lg:pb-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-start">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3 text-[0.78rem] uppercase tracking-[0.18em] text-text-secondary">
              <span className="rounded-full border border-pulse/25 bg-pulse/8 px-3 py-1 text-pulse-glow">
                Closed beta
              </span>
              <span className="rounded-full border border-signal/20 bg-signal/8 px-3 py-1 text-signal-soft">
                Non-diagnostic
              </span>
              <span className="rounded-full border border-token bg-midnight/72 px-3 py-1">
                Privacy-first
              </span>
            </div>

            <div className="max-w-4xl space-y-5">
              <h1 className="font-display text-[clamp(3.6rem,8vw,7.2rem)] leading-[0.9] tracking-[-0.05em] text-text-primary">
                Nobody should fight an invisible bear alone.
              </h1>
              <div className="landing-crisis-band max-w-3xl">
                <p className="text-lg leading-8 text-text-secondary sm:text-xl">
                  88.3% of arrhythmia patients report severe anxiety. 1 in 5 has
                  experienced suicidal ideation. Nobody is screening for it.
                  OneRhythm is here to change that.
                </p>
              </div>
              <p className="max-w-3xl text-base leading-8 text-signal-soft sm:text-lg">
                A community. An education platform. A collective heart that is circling
                the Earth - 25 centimeters at a time.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <HeroMetric
                label="Founding members"
                value={waitlist.total_signups.toLocaleString()}
              />
              <HeroMetric
                label="Public mosaic tiles"
                value={mosaic.stats.public_tiles.toLocaleString()}
              />
              <HeroMetric
                label="Live shared distance"
                value={formatCompactDistance(rhythm.total_distance_km)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <Link
                className="inline-flex items-center gap-2 rounded-[0.95rem] bg-pulse px-4 py-3 font-medium text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="#waitlist"
              >
                Join the Mission
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="rounded-[0.95rem] border border-token px-4 py-3 transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/mission"
              >
                Read the mission
              </Link>
              <Link
                className="rounded-[0.95rem] border border-token px-4 py-3 transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                href="/sign-in"
              >
                Invited already? Sign in
              </Link>
            </div>
          </div>

          <aside
            className="landing-waitlist-panel relative overflow-hidden rounded-[2rem] border border-token p-6 shadow-surface sm:p-7"
            id="waitlist"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(102,229,255,0.85),transparent)]"
            />
            <p className="page-eyebrow">Founding member signup</p>
            <h2 className="mt-4 max-w-md font-display text-3xl leading-tight text-text-primary">
              Join the beta before the silence gets another decade.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">
              One field. One email. That is all we ask for the waitlist.
            </p>

            <div className="mt-7">
              <WaitlistForm
                buttonLabel="Join the Mission"
                idPrefix="hero-waitlist"
                initialReferralCode={referralCode}
              />
            </div>
          </aside>
        </div>

        <div aria-hidden="true" className="landing-waveform mt-10">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1440 140">
            <path
              className="landing-waveform-path"
              d="M0 86h168l26-2 10-16 8 38 10-70 12 92 12-44 28 2h146l26-2 10-16 8 38 10-70 12 92 12-44 28 2h146l26-2 10-16 8 38 10-70 12 92 12-44 28 2h146l26-2 10-16 8 38 10-70 12 92 12-44 28 2h146l26-2 10-16 8 38 10-70 12 92 12-44 28 2h144"
              fill="none"
              pathLength="1"
            />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <MedicalDisclaimer className="landing-disclaimer-card" />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="space-y-5">
          <p className="page-eyebrow">The Crisis in Numbers</p>
          <h2 className="section-title">The numbers nobody is acting on.</h2>
          <p className="max-w-3xl text-base leading-8 text-text-secondary">
            Peer-reviewed research is social proof here. It tells people living this
            reality that they are not imagining the weight, and it tells clinicians and
            researchers that the silence is measurable.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {crisisStats.map((stat) => (
            <article
              className="rounded-[1.5rem] border border-token bg-cosmos/92 p-6 shadow-panel"
              key={stat.value}
            >
              <div className="mb-5 h-1 w-16 rounded-full bg-pulse" />
              <p className="font-display text-[clamp(2.5rem,5vw,3.6rem)] leading-none tracking-[-0.04em] text-text-primary">
                {stat.value}
              </p>
              <p className="mt-4 text-base leading-7 text-text-primary">{stat.title}</p>
              <p className="mt-5 text-sm leading-7 text-text-secondary">{stat.context}</p>
              <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
                {stat.source}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-3xl text-base leading-8 text-text-primary">
            The European Society of Cardiology published a full framework in 2025
            calling for systematic mental health screening alongside cardiac care.
            Almost nobody is implementing it.
          </p>
          <Link
            className="inline-flex items-center gap-2 rounded-[0.95rem] border border-signal/35 px-4 py-3 text-sm font-medium text-signal-soft transition-colors duration-micro ease-out hover:bg-signal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="#waitlist"
          >
            I want to be part of the solution
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="page-eyebrow">Heart Mosaic</p>
              <h2 className="section-title">80 million rhythms. Around the Earth. To the Moon.</h2>
              <p className="text-base leading-8 text-text-secondary">
                A standard 10-second ECG strip measures exactly 25 centimeters. One
                rhythm. One contribution. There are 52.55 million people living with
                atrial fibrillation worldwide. If every one of them contributed a single
                strip, their combined rhythms would stretch 13,138 kilometers - more than
                a third of the way around the Earth.
              </p>
              <p className="text-base leading-8 text-text-secondary">
                Today, the public mosaic already holds{" "}
                <span className="font-medium text-text-primary">
                  {mosaic.stats.public_tiles.toLocaleString()}
                </span>{" "}
                visible tiles and{" "}
                <span className="font-medium text-text-primary">
                  {formatCompactDistance(rhythm.total_distance_km)}
                </span>{" "}
                of live shared distance counted through the retained contribution pipeline.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.7rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.96),rgba(17,24,39,0.9))] shadow-panel">
              <div className="grid grid-cols-[minmax(0,1.15fr)_auto_auto] gap-4 border-b border-token px-5 py-4 text-xs uppercase tracking-[0.16em] text-text-tertiary">
                <p>Milestone</p>
                <p>Distance</p>
                <p>Contributors needed</p>
              </div>
              {distanceRows.map((row) => (
                <div
                  className={[
                    "grid grid-cols-[minmax(0,1.15fr)_auto_auto] gap-4 border-b border-token/70 px-5 py-4 text-sm leading-7 last:border-b-0",
                    row.accent ? "bg-signal/6" : "",
                  ].join(" ")}
                  key={row.label}
                >
                  <p className={row.accent ? "text-signal-soft" : "text-text-primary"}>{row.label}</p>
                  <p className="font-mono text-text-secondary">{row.distance}</p>
                  <p className="font-mono text-text-secondary">{row.contributors}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.45rem] border border-aurora/28 bg-aurora/10 px-5 py-4">
              <p className="text-sm leading-7 text-text-primary">
                With 30-second wearable ECG recordings - Apple Watch, Samsung, and
                AliveCor KardiaMobile - each contribution is 75 cm. At that length, the
                world&apos;s 52.55 million AF patients contributing once would reach 98.3%
                of the way around the Earth. The race is almost already won. We just
                have not started yet.
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                Shared Rhythm Distance Executive Brief - verified math from GBD 2021 data
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <LandingMosaicPreview />
            <Link
              className="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-pulse px-5 py-3.5 text-sm font-medium text-text-primary shadow-pulse transition-colors duration-micro ease-out hover:bg-pulse-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void sm:w-auto"
              href="#waitlist"
            >
              Add my rhythm to the mosaic
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="space-y-5 text-center">
          <p className="page-eyebrow">Who This Is For</p>
          <h2 className="section-title max-w-4xl mx-auto">
            If your heart has ever fought against you, you belong here.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {audienceItems.map((item) => (
            <div
              className="rounded-[1.35rem] border border-token bg-midnight/70 p-5 text-left shadow-panel"
              key={item.label}
            >
              <item.icon className="h-6 w-6 text-signal-soft" />
              <p className="mt-4 text-base leading-7 text-text-primary">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-center text-base leading-8 text-text-primary">
          Pain is not a competition here. One PVC an hour or millions -
          your experience is valid and your voice matters.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="space-y-4">
            <p className="page-eyebrow">Why OneRhythm Exists</p>
            <h2 className="section-title">Built by someone who was inside the numbers.</h2>
            <p className="text-base leading-8 text-text-secondary">
              For OneRhythm, the founding story is not marketing garnish. It is the lived
              reason the mission exists at all.
            </p>
          </div>

          <blockquote className="rounded-[1.8rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.96),rgba(17,24,39,0.92))] p-7 shadow-surface">
            <div className="mb-6 h-1.5 w-28 rounded-full bg-heartbeat" />
            <div className="space-y-5 text-base leading-8 text-text-primary">
              <p>
                "I had dinner with Gene Cernan when I was 19. The last man to walk on
                the Moon. He signed his book: 'Aim for the Moon. If you miss - you're in
                the stars.'
              </p>
              <p>
                I did not know what I was aiming at then. A decade of ARVC, three ICD
                shocks, seven EP lab visits, and a Farapulse ablation that finally
                silenced the arrhythmia on December 9, 2024 taught me exactly what it was
                for.
              </p>
              <p>
                Pain into purpose. Move statistics in the opposite direction.
              </p>
              <p>
                OneRhythm is built to ensure that nobody ever feels alone in their fight against the #InvisibleBears.
              </p>
            </div>
            <footer className="mt-6 border-t border-token/70 pt-5">
              <p className="font-display text-lg text-text-primary">
                Matt | OneRhythm Founder
              </p>
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="space-y-5">
          <p className="page-eyebrow">Founding Member Exchange</p>
          <h2 className="section-title">What you get as a founding member.</h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {benefitCards.map((card) => (
            <article
              className="rounded-[1.55rem] border border-token bg-cosmos/92 p-6 shadow-panel"
              key={card.title}
            >
              <card.icon className={["h-6 w-6", card.tone].join(" ")} />
              <h3 className="mt-5 font-display text-2xl text-text-primary">{card.title}</h3>
              <p className="mt-4 text-base leading-8 text-text-secondary">{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <LandingMissionCounter initialMetrics={missionMetrics} />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="space-y-5">
          <p className="page-eyebrow">Beta Preview</p>
          <h2 className="section-title">What OneRhythm is building.</h2>
          <div className="rounded-[1.25rem] border border-warning/30 bg-warning/10 px-5 py-4 text-sm leading-7 text-text-secondary">
            <p className="inline-flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                OneRhythm is in active development. Beta testers are shaping the
                product. This is what is coming - not what is fully live yet.
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {previewCards.map((card, index) => (
            <article
              className="rounded-[1.55rem] border border-token bg-midnight/75 p-6 shadow-panel"
              key={card.title}
            >
              <div className="landing-preview-art" data-variant={index + 1} />
              <h3 className="mt-6 font-display text-2xl text-text-primary">{card.title}</h3>
              <p className="mt-4 text-base leading-8 text-text-secondary">{card.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <MedicalDisclaimer />
        </div>
      </section>

      <section className="landing-final-cta px-6 py-24 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <p className="page-eyebrow">Final Call</p>
            <blockquote className="max-w-3xl font-display text-[clamp(2.7rem,6vw,5rem)] leading-[0.96] tracking-[-0.04em] text-text-primary">
              "Aim for the Moon. If you miss - you're in the stars."
            </blockquote>
          </div>

          <div className="rounded-[2rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.96),rgba(17,24,39,0.94))] p-6 shadow-surface sm:p-7">
            <WaitlistForm
              buttonLabel="I'm in. To the Moon."
              className="max-w-none"
              idPrefix="footer-waitlist"
              initialReferralCode={referralCode}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
