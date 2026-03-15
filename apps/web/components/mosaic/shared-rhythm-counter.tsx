"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

type SharedRhythmCounterProps = {
  distanceKm: number;
  totalContributions: number;
};

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const motionValue = useMotionValue(0);
  const displayed = useTransform(motionValue, (v) =>
    v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{displayed}</motion.span>;
}

export function SharedRhythmCounter({
  distanceKm,
  totalContributions,
}: SharedRhythmCounterProps) {
  return (
    <div className="text-center" aria-live="polite">
      <motion.p
        className="font-display text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-pulse">
          <AnimatedNumber value={distanceKm} />
        </span>
        <span className="ml-2 text-3xl text-text-secondary sm:text-4xl">km</span>
      </motion.p>
      <motion.p
        className="mt-2 font-mono text-sm text-signal sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Our shared rhythm has traveled {distanceKm.toLocaleString(undefined, { maximumFractionDigits: 2 })} km
      </motion.p>
      <motion.p
        className="mt-1 text-sm text-text-tertiary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        from {totalContributions.toLocaleString()} contributions
      </motion.p>
    </div>
  );
}
