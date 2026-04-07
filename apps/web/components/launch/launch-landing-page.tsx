import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Download, ExternalLink, Github } from "lucide-react";

import {
  launchContent,
  type LaunchAccentTone,
  type LaunchBrief,
  type LaunchMetric,
  type LaunchNavItem,
} from "../../content/launch";
import { cn } from "../../lib/cn";
import { buildLaunchUrl, getLaunchModeConfig } from "../../lib/launch-mode";
import { StructuredData } from "../structured-data";

const actionClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-token px-5 py-3 text-sm font-medium text-text-primary transition-colors duration-micro ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void";

const primaryActionClassName = cn(
  actionClassName,
  "bg-pulse shadow-pulse hover:bg-pulse-dark hover:text-text-primary",
);

const secondaryActionClassName = cn(
  actionClassName,
  "surface-panel-soft hover:border-cyan/40 hover:text-cyan-soft",
);

const accentClassNames: Record<
  LaunchAccentTone,
  {
    chip: string;
    ring: string;
    glow: string;
    button: string;
  }
> = {
  pulse: {
    chip: "border-pulse/30 bg-pulse/10 text-pulse-glow",
    ring: "border-pulse/30 shadow-[0_0_40px_rgba(255,45,85,0.18)]",
    glow: "from-pulse/18 via-pulse/0",
    button: "hover:border-pulse/40 hover:text-pulse-glow",
  },
  signal: {
    chip: "border-cyan/30 bg-cyan/10 text-cyan-soft",
    ring: "border-cyan/30 shadow-[0_0_40px_rgba(0,212,255,0.16)]",
    glow: "from-cyan/18 via-cyan/0",
    button: "hover:border-cyan/40 hover:text-cyan-soft",
  },
  aurora: {
    chip: "border-aurora/30 bg-aurora/10 text-aurora-glow",
    ring: "border-aurora/30 shadow-[0_0_40px_rgba(124,58,237,0.16)]",
    glow: "from-aurora/18 via-aurora/0",
    button: "hover:border-aurora/40 hover:text-aurora-glow",
  },
};

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-text-secondary">
      {children}
    </p>
  );
}

function ProjectLogo({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-[1.4rem] border border-token bg-midnight/90",
        className,
      )}
    >
      <Image
        alt={alt}
        className={cn("h-auto w-full object-contain", imageClassName)}
        height={2000}
        src={src}
        width={2000}
      />
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18.901 1.153H22.58l-8.036 9.183L24 22.847h-7.406l-5.8-7.584-6.636 7.584H.478l8.595-9.823L0 1.153h7.594l5.243 6.932zm-1.29 19.494h2.039L6.486 3.24H4.298z" />
    </svg>
  );
}

function LaunchNavLink({ item }: { item: LaunchNavItem }) {
  return (
    <a
      className="inline-flex min-h-11 items-center rounded-full border border-token px-4 py-2 text-sm text-text-secondary transition-colors duration-micro ease-out hover:border-cyan/35 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      href={item.href}
      rel={item.external ? "noreferrer" : undefined}
      target={item.external ? "_blank" : undefined}
    >
      {item.label}
    </a>
  );
}

function LaunchShellTopBar() {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-6 sm:px-10 lg:px-12">
      <div className="surface-panel flex flex-col gap-5 rounded-[1.8rem] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <a
          className="inline-flex items-center gap-4 rounded-[1.2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
          href="#top"
        >
          <ProjectLogo
            alt="OneRhythm logo"
            className="h-14 w-14 rounded-[1rem]"
            imageClassName="h-9 w-9"
            src="/launch/logos/onerhythm-logo.png"
          />
          <div className="min-w-0">
            <p className="font-display text-[1.15rem] tracking-[-0.02em] text-text-primary">
              OneRhythm
            </p>
            <p className="text-sm text-text-secondary">Launch briefs</p>
          </div>
        </a>

        <nav aria-label="Launch sections" className="flex flex-wrap gap-2">
          {launchContent.nav.map((item) => (
            <LaunchNavLink item={item} key={`${item.label}-${item.href}`} />
          ))}
        </nav>
      </div>
    </header>
  );
}

function HeroMetric({ value, label }: LaunchMetric) {
  return (
    <div className="rounded-full border border-token bg-midnight/75 px-4 py-3">
      <p className="font-mono text-sm tracking-[-0.03em] text-text-primary">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-secondary">{label}</p>
    </div>
  );
}

function HeroBriefRow({ brief }: { brief: LaunchBrief }) {
  const accent = accentClassNames[brief.accent];

  return (
    <div className="surface-panel-soft flex items-center gap-4 rounded-[1.55rem] p-4 sm:p-5">
      <ProjectLogo
        alt={brief.logoAlt}
        className={cn("h-[5.5rem] w-[5.5rem] shrink-0 rounded-[1.25rem] p-3", accent.ring)}
        imageClassName="h-full w-full"
        src={brief.logoSrc}
      />
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "inline-flex rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.24em]",
            accent.chip,
          )}
        >
          {brief.badge}
        </span>
        <h2 className="mt-3 text-[1.2rem] leading-tight text-text-primary">{brief.name}</h2>
      </div>
      <span className="hidden font-mono text-[0.66rem] uppercase tracking-[0.28em] text-text-secondary sm:inline">
        PDF
      </span>
    </div>
  );
}

function LaunchHeroStage() {
  return (
    <div className="surface-panel relative overflow-hidden rounded-[2.35rem] p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,212,255,0.12),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(255,45,85,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(124,58,237,0.12),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between gap-3">
          <SectionEyebrow>Three connected briefs</SectionEyebrow>
          <span className="rounded-full border border-token bg-midnight/75 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-text-secondary">
            2026
          </span>
        </div>

        <div className="surface-panel-soft rounded-[1.85rem] p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] sm:items-center">
            <ProjectLogo
              alt="OneRhythm launch mark"
              className="mx-auto aspect-square w-full max-w-[10rem] rounded-[1.7rem] border-white/10 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.12),rgba(17,24,39,0.92)_68%)] p-4"
              imageClassName="h-full w-full"
              src="/launch/logos/onerhythm-logo.png"
            />
            <div className="space-y-3">
              <p className="font-display text-[1.45rem] leading-tight text-text-primary sm:text-[1.7rem]">
                Three briefs. One narrow, serious beginning.
              </p>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-text-secondary">
                Start here.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {launchContent.briefs.map((brief) => (
            <HeroBriefRow brief={brief} key={brief.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FounderSection() {
  const founder = launchContent.founder;

  return (
    <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-12 lg:py-20" id="story">
      <div className="surface-panel grid gap-10 rounded-[2.35rem] p-6 sm:p-8 lg:grid-cols-[minmax(21rem,0.78fr)_minmax(0,1.22fr)] lg:items-center lg:gap-12 lg:p-10">
        <div className="surface-panel-soft mx-auto w-full max-w-[25rem] rounded-[2rem] p-6">
          <div className="overflow-hidden rounded-[1.7rem] border border-token bg-midnight">
            <Image
              alt={founder.imageAlt}
              className="h-auto w-full object-cover"
              height={500}
              src={founder.imageSrc}
              width={500}
            />
          </div>
          <div className="mt-5 space-y-1">
            <p className="font-display text-[1.15rem] text-text-primary">{founder.attribution}</p>
            <p className="text-sm text-text-secondary">{founder.role}</p>
          </div>
        </div>

        <div className="space-y-6">
          <SectionEyebrow>{founder.label}</SectionEyebrow>
          <h2 className="max-w-[14ch] text-[clamp(2.1rem,3.9vw,3.45rem)] leading-[1.04] text-text-primary">
            {founder.title}
          </h2>
          {founder.paragraphs.map((paragraph) => (
            <p
              className="max-w-3xl text-base leading-8 text-text-secondary sm:text-[1.03rem]"
              key={paragraph}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function BriefCard({ brief }: { brief: LaunchBrief }) {
  const accent = accentClassNames[brief.accent];

  return (
    <article className="surface-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
      <div
        aria-hidden="true"
        className={cn("absolute inset-x-0 top-0 h-28 bg-gradient-to-b", accent.glow)}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.24em]",
              accent.chip,
            )}
          >
            {brief.badge}
          </span>
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-text-secondary">
            Project brief
          </span>
        </div>

        <ProjectLogo
          alt={brief.logoAlt}
          className={cn(
            "mt-6 aspect-square w-full max-w-[9.5rem] rounded-[1.5rem] p-3",
            accent.ring,
          )}
          imageClassName="h-full w-full"
          src={brief.logoSrc}
        />

        <div className="mt-6 flex flex-1 flex-col">
          <h3 className="text-[1.6rem] leading-tight text-text-primary">{brief.name}</h3>
          <p className="mt-4 flex-1 text-base leading-7 text-text-secondary">{brief.summary}</p>

          <a
            className={cn(
              secondaryActionClassName,
              "mt-6 w-fit bg-transparent",
              accent.button,
            )}
            download
            href={brief.briefHref}
          >
            Download brief
            <Download aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

function ContactLabel({ label }: { label: string }) {
  if (label === "X") {
    return (
      <span className="inline-flex items-center text-text-secondary">
        <XIcon className="h-4 w-4" />
        <span className="sr-only">X</span>
      </span>
    );
  }

  if (label === "Git") {
    return (
      <span className="inline-flex items-center text-text-secondary">
        <Github aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">GitHub</span>
      </span>
    );
  }

  return <>{label}</>;
}

function ContactSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-12" id="contact">
      <div className="surface-panel grid gap-6 rounded-[2rem] p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="space-y-4">
          <SectionEyebrow>Contact</SectionEyebrow>
          <h2 className="max-w-[10ch] text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.06] text-text-primary">
            {launchContent.contact.titleLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h2>
          <p className="text-base leading-7 text-text-secondary">{launchContent.contact.body}</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          {launchContent.contact.items.map((item) => (
            <div className="surface-panel-soft rounded-[1.35rem] p-5" key={item.label}>
              <dt className="font-mono text-[0.64rem] uppercase tracking-[0.28em] text-text-secondary">
                <ContactLabel label={item.label} />
              </dt>
              <dd className="mt-3">
                <a
                  className="inline-flex min-h-11 items-center gap-2 text-base text-text-primary transition-colors duration-micro ease-out hover:text-cyan-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
                  href={item.href}
                  rel={item.external ? "noreferrer" : undefined}
                  target={item.external ? "_blank" : undefined}
                >
                  {item.value}
                  {item.external && item.label !== "X" && item.label !== "Git" ? (
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  ) : null}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function LaunchLandingPage() {
  const launchConfig = getLaunchModeConfig();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "OneRhythm Public Launch",
      url: launchConfig.launchUrl,
      description: launchContent.hero.body,
      about: launchContent.briefs.map((brief) => brief.name),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "OneRhythm launch briefs",
      itemListElement: launchContent.briefs.map((brief, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: brief.name,
        url: buildLaunchUrl(brief.briefHref, launchConfig),
      })),
    },
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <main className="page-shell relative overflow-hidden pb-16" id="top">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_18%_10%,rgba(0,212,255,0.14),transparent_24%),radial-gradient(circle_at_88%_8%,rgba(255,45,85,0.15),transparent_22%),radial-gradient(circle_at_52%_100%,rgba(124,58,237,0.12),transparent_28%)]"
        />

        <LaunchShellTopBar />

        <section className="mx-auto max-w-7xl px-6 pb-12 pt-12 sm:px-10 lg:px-12 lg:pt-16">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(35rem,0.92fr)] xl:items-center xl:gap-12">
            <div className="space-y-7">
              <SectionEyebrow>{launchContent.hero.label}</SectionEyebrow>
              <div className="space-y-5">
                <h1 className="max-w-[11ch] text-[clamp(3rem,6.7vw,5.6rem)] leading-[0.93] tracking-[-0.04em] text-text-primary">
                  {launchContent.hero.title}
                </h1>
                <p className="max-w-2xl text-[1.06rem] leading-8 text-text-secondary sm:text-[1.14rem]">
                  {launchContent.hero.body}
                </p>
                <p className="max-w-2xl text-base leading-7 text-text-secondary/90">
                  {launchContent.hero.supportingBody}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a className={primaryActionClassName} href={launchContent.hero.primaryAction.href}>
                  {launchContent.hero.primaryAction.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
                <a
                  className={secondaryActionClassName}
                  href={launchContent.hero.secondaryAction.href}
                  rel="noreferrer"
                  target={launchContent.hero.secondaryAction.external ? "_blank" : undefined}
                >
                  {launchContent.hero.secondaryAction.label}
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                {launchContent.hero.metrics.map((metric) => (
                  <HeroMetric key={`${metric.value}-${metric.label}`} label={metric.label} value={metric.value} />
                ))}
              </div>
            </div>

            <LaunchHeroStage />
          </div>
        </section>

        <FounderSection />

        <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16" id="briefs">
          <div className="space-y-8">
            <div className="space-y-4">
              <SectionEyebrow>{launchContent.briefsSection.label}</SectionEyebrow>
              <h2 className="max-w-[12ch] text-[clamp(2rem,3.6vw,3.4rem)] leading-[1.04] text-text-primary">
                {launchContent.briefsSection.title}
              </h2>
              <p className="max-w-3xl text-base leading-8 text-text-secondary">
                {launchContent.briefsSection.intro}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {launchContent.briefs.map((brief) => (
                <BriefCard brief={brief} key={brief.id} />
              ))}
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
    </>
  );
}
