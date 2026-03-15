"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

type CollectiveMomentProps = {
  totalDistanceKm: number;
  totalContributions: number;
};

function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const displayed = useTransform(motionValue, (v) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{displayed}</motion.span>;
}

export function CollectiveMoment({
  totalDistanceKm,
  totalContributions,
}: CollectiveMomentProps) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="font-mono text-sm text-signal">Together the shared line has traveled</p>
      <p className="mt-2 font-display text-4xl font-bold text-text-primary sm:text-5xl">
        <span className="text-pulse">
          <AnimatedCounter value={totalDistanceKm} />
        </span>
        <span className="ml-2 text-2xl text-text-secondary">km</span>
      </p>
      <p className="mt-3 text-sm text-text-tertiary">
        across {totalContributions.toLocaleString()} joined contributions
      </p>
    </motion.div>
  );
}
