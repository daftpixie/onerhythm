"use client";

import type { RhythmDistanceStats } from "@onerhythm/types";
import { motion } from "framer-motion";

type RhythmStatRowProps = {
  stats: RhythmDistanceStats;
};

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

function StatItem({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  return (
    <motion.div
      className="rounded-xl border border-token bg-cosmos p-5 text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: EASE_REVEAL as unknown as [number, number, number, number],
      }}
    >
      <p className="font-display text-2xl font-bold text-pulse sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </motion.div>
  );
}

export function RhythmStatRow({ stats }: RhythmStatRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatItem
        value={`${stats.total_distance_km.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`}
        label="Total distance"
        index={0}
      />
      <StatItem
        value={stats.total_contributions.toLocaleString()}
        label="Contributions"
        index={1}
      />
      <StatItem
        value={stats.current_milestone?.label ?? "Getting started"}
        label="Current milestone"
        index={2}
      />
      <StatItem
        value={
          stats.earth_loops >= 1
            ? `${stats.earth_loops.toFixed(1)}x`
            : `${(stats.earth_loops * 100).toFixed(0)}%`
        }
        label="Earth loops"
        index={3}
      />
    </div>
  );
}
