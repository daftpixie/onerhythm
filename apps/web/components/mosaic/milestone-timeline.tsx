"use client";

import type { MilestoneDefinition } from "@onerhythm/types";
import { motion } from "framer-motion";

type MilestoneTimelineProps = {
  milestones: MilestoneDefinition[];
  currentMilestoneKey: string | null;
};

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

export function MilestoneTimeline({
  milestones,
  currentMilestoneKey,
}: MilestoneTimelineProps) {
  let passedCurrent = false;

  return (
    <div className="space-y-1">
      <h3 className="font-display text-lg font-semibold text-text-primary">
        Milestones
      </h3>
      <div className="relative ml-4 border-l border-token pl-6">
        {milestones.map((milestone, i) => {
          const isAchieved =
            !passedCurrent &&
            (milestone.key === currentMilestoneKey || currentMilestoneKey === null
              ? false
              : true);

          if (milestone.key === currentMilestoneKey) {
            passedCurrent = true;
          }
          const achieved = passedCurrent;

          return (
            <motion.div
              key={milestone.key}
              className="relative pb-6 last:pb-0"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.4,
                ease: EASE_REVEAL as unknown as [number, number, number, number],
              }}
            >
              {/* Dot */}
              <div
                className={`absolute -left-[calc(1.5rem+0.3125rem)] top-1 h-2.5 w-2.5 rounded-full ${
                  achieved
                    ? "bg-aurora shadow-[0_0_8px_var(--color-aurora)]"
                    : "bg-cosmos-nebula"
                }`}
              />
              <p
                className={`font-display text-base font-semibold ${
                  achieved ? "text-text-primary" : "text-text-tertiary"
                }`}
              >
                {milestone.label}
              </p>
              <p className="font-mono text-xs text-text-tertiary">
                {milestone.distance_km.toLocaleString()} km
              </p>
              <p
                className={`mt-0.5 text-sm ${
                  achieved ? "text-text-secondary" : "text-text-tertiary/60"
                }`}
              >
                {milestone.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
