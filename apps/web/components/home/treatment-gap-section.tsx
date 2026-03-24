import { SectionWrapper } from "../ui/section-wrapper";
import { Heading } from "../typography/heading";
import { DataText } from "../typography/data-text";
import { GlowCard } from "../ui/glow-card";
import { homepage } from "../../content/pages/homepage";

export function TreatmentGapSection() {
  const { treatmentGap } = homepage;

  return (
    <SectionWrapper bg="void">
      <div className="mx-auto max-w-4xl">
        <Heading as="h2" size="display">
          {treatmentGap.heading}
        </Heading>
        <p className="mt-3 font-display text-heading-sm font-semibold text-pulse">
          {treatmentGap.subhead}
        </p>
        <p className="mt-6 max-w-3xl text-body-lg leading-relaxed text-text-secondary">
          {treatmentGap.body}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {treatmentGap.metrics.map((metric) => (
          <GlowCard key={metric.label} glowColor="pulse" hoverable={false}>
            <DataText size="lg" className="text-pulse font-bold text-[2rem]">
              {metric.value}
            </DataText>
            <p className="mt-3 text-body font-medium text-text-primary">
              {metric.label}
            </p>
            <p className="mt-2 font-mono text-xs text-text-tertiary">
              {metric.source}
            </p>
          </GlowCard>
        ))}
      </div>

      <p className="mt-10 max-w-3xl font-display text-heading-sm font-semibold text-signal">
        {treatmentGap.cta}
      </p>
    </SectionWrapper>
  );
}
