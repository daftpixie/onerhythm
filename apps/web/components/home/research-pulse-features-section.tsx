import { BookOpen, MessageCircleQuestion, TrendingUp } from "lucide-react";

import { SectionWrapper } from "../ui/section-wrapper";
import { Heading } from "../typography/heading";
import { GlowCard } from "../ui/glow-card";
import { homepage } from "../../content/pages/homepage";

const iconMap = {
  BookOpen,
  MessageCircleQuestion,
  TrendingUp,
} as const;

export function ResearchPulseFeaturesSection() {
  const { researchPulse } = homepage;

  return (
    <SectionWrapper bg="void">
      <Heading as="h2" size="display">
        {researchPulse.heading}
      </Heading>
      <p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-text-secondary">
        {researchPulse.subhead}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {researchPulse.features.map((feature) => {
          const Icon = iconMap[feature.icon];
          return (
            <GlowCard key={feature.title} glowColor="cyan" hoverable={false}>
              <Icon className="h-6 w-6 text-signal" aria-hidden="true" />
              <Heading as="h3" size="heading-sm" className="mt-3">
                {feature.title}
              </Heading>
              <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                {feature.body}
              </p>
            </GlowCard>
          );
        })}
      </div>

      <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
        {researchPulse.comingSoon}
      </p>
    </SectionWrapper>
  );
}
