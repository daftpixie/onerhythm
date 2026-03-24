import Image from "next/image";
import Link from "next/link";

import { Badge } from "../ui/badge";
import { Heading } from "../typography/heading";
import { homepage } from "../../content/pages/homepage";

export function NarrativeHero() {
  const { hero } = homepage;

  return (
    <section className="relative overflow-hidden bg-void px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_34%,rgba(102,229,255,0.14),transparent_22%),radial-gradient(circle_at_74%_18%,rgba(167,139,250,0.16),transparent_20%),radial-gradient(circle_at_78%_72%,rgba(255,107,138,0.1),transparent_24%)]"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] md:items-center md:gap-10 lg:grid-cols-[25rem_minmax(0,1fr)] lg:gap-14">
        <div className="md:self-start">
          <div className="relative w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[22rem] lg:max-w-[25rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent_68%)] blur-2xl"
            />
            <Image
              alt={hero.imageAlt}
              className="relative block h-auto w-full object-cover drop-shadow-[0_20px_42px_rgba(255,255,255,0.08)]"
              height={2000}
              priority
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 352px, 288px"
              src="/brand/Heart_Main.png"
              width={2000}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center md:pt-2">
          <Badge className="w-fit" variant="pulse">
            {hero.eyebrow}
          </Badge>

          <Heading as="h1" className="mt-6 max-w-none text-left lg:whitespace-nowrap" size="display-xl">
            {hero.headline}
          </Heading>

          <p className="mt-6 max-w-[42rem] text-body-lg leading-relaxed text-text-secondary">
            {hero.subhead}
          </p>

          <div className="mt-8">
            <Link
              href={hero.ctaHref}
              className="inline-flex h-12 min-w-[44px] items-center justify-center rounded-lg bg-pulse px-6 font-body text-body-lg font-medium text-white shadow-glow-pulse transition-all duration-200 ease-out hover:bg-pulse-dark"
            >
              {hero.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
