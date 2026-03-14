"use client";

import { motion } from "framer-motion";
import { BookOpen, Eye, Heart } from "lucide-react";
import type { ReactNode } from "react";

type PillarCardProps = {
  pillar: "visibility" | "community" | "education";
  title: string;
  subtitle: string;
  description: string;
  href: string;
  index?: number;
};

const pillarConfig: Record<
  PillarCardProps["pillar"],
  { borderColor: string; iconColor: string; icon: ReactNode }
> = {
  visibility: {
    borderColor: "border-t-pulse",
    iconColor: "text-pulse",
    icon: <Eye className="h-6 w-6" />,
  },
  community: {
    borderColor: "border-t-signal",
    iconColor: "text-signal",
    icon: <Heart className="h-6 w-6" />,
  },
  education: {
    borderColor: "border-t-aurora",
    iconColor: "text-aurora",
    icon: <BookOpen className="h-6 w-6" />,
  },
};

const linkColors: Record<PillarCardProps["pillar"], string> = {
  visibility: "text-pulse hover:text-pulse-glow",
  community: "text-signal hover:text-signal-soft",
  education: "text-aurora hover:text-aurora-glow",
};

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function PillarCard({
  pillar,
  title,
  subtitle,
  description,
  href,
  index = 0,
}: PillarCardProps) {
  const config = pillarConfig[pillar];

  return (
    <motion.div
      className={`rounded-xl border border-token border-t-[3px] bg-cosmos p-6 ${config.borderColor}`}
      custom={index}
      initial="hidden"
      variants={cardVariants}
      viewport={{ once: true, margin: "-40px" }}
      whileInView="visible"
    >
      <div className={`mb-4 ${config.iconColor}`}>{config.icon}</div>
      <h3 className="font-display text-xl font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-text-tertiary">
        {subtitle}
      </p>
      <p className="mt-3 text-base leading-7 text-text-secondary">
        {description}
      </p>
      <a
        className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-micro ${linkColors[pillar]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void`}
        href={href}
      >
        Learn more
        <span aria-hidden="true">→</span>
      </a>
    </motion.div>
  );
}
