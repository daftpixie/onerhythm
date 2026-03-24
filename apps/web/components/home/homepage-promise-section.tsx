import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

import { SectionWrapper } from "../ui/section-wrapper";
import { Heading } from "../typography/heading";
import { homepage } from "../../content/pages/homepage";

export function HomepagePromiseSection() {
  const { promise } = homepage;

  return (
    <SectionWrapper bg="void" className="relative">
      {/* Subtle heartbeat gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-pulse-red)_0%,_transparent_70%)] opacity-[0.05]"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Heading as="h2" size="display-lg">
          {promise.headline}
        </Heading>

        <div className="mt-6 space-y-4 text-body-lg leading-relaxed text-text-secondary">
          {promise.body.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href={promise.ctaHref}
            className="inline-flex h-12 min-w-[44px] items-center justify-center rounded-lg bg-pulse px-6 font-body text-body-lg font-medium text-white shadow-glow-pulse transition-all duration-200 ease-out hover:bg-pulse-dark"
          >
            {promise.cta}
          </Link>
        </div>

      </div>

      <div className="relative z-10 mx-auto mt-16 max-w-4xl">
        <MedicalDisclaimer />
      </div>
    </SectionWrapper>
  );
}
