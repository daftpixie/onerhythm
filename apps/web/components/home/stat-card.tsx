"use client";

import { motion } from "framer-motion";

type StatCardProps = {
  value: string;
  description: string;
  source: string;
  /** "pulse" for alarming stats, "signal" for clinical/comparative */
  accent?: "pulse" | "signal";
  index?: number;
};

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: EASE_REVEAL as unknown as [number, number, number, number],
    },
  }),
};

export function StatCard({
  value,
  description,
  source,
  accent = "pulse",
  index = 0,
}: StatCardProps) {
  const valueColor = accent === "pulse" ? "text-pulse" : "text-signal";

  return (
    <motion.div
      className="group rounded-xl border border-token bg-cosmos p-6 transition-[background-color,box-shadow,transform] duration-normal ease-out hover:scale-[1.02] hover:bg-nebula hover:shadow-subtle"
      custom={index}
      initial="hidden"
      variants={cardVariants}
      viewport={{ once: true, margin: "-40px" }}
      whileInView="visible"
    >
      <p className={`font-display text-[2.5rem] font-bold leading-none tracking-tight ${valueColor}`}>
        {value}
      </p>
      <p className="mt-3 text-base font-medium leading-6 text-text-primary">
        {description}
      </p>
      <p className="mt-2 font-mono text-xs leading-5 text-text-tertiary">
        {source}
      </p>
    </motion.div>
  );
}
