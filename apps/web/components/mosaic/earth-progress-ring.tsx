"use client";

import { motion } from "framer-motion";

type EarthProgressRingProps = {
  progress: number;
  earthLoops: number;
  label: string;
};

const RING_SIZE = 200;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function EarthProgressRing({ progress, earthLoops, label }: EarthProgressRingProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const dashOffset = CIRCUMFERENCE * (1 - clampedProgress);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-signal)" />
              <stop offset="100%" stopColor="var(--color-pulse)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-cosmos)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress */}
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-text-primary">
            {earthLoops >= 1 ? `${earthLoops.toFixed(1)}x` : `${(clampedProgress * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-text-secondary">{label}</p>
    </div>
  );
}
