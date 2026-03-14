"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside" | "figure" | "header";
};

export function Reveal({ children, className, as = "div" }: RevealProps) {
  const Component = motion.create(as);
  return (
    <Component
      className={className}
      initial="hidden"
      variants={sectionRevealVariants}
      viewport={{ once: true, margin: "-60px" }}
      whileInView="visible"
    >
      {children}
    </Component>
  );
}

type StaggerListProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={staggerContainerVariants}
      viewport={{ once: true, margin: "-40px" }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerListProps) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

type PulseProps = {
  children: ReactNode;
  className?: string;
};

export function HeartbeatPulse({ children, className }: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.005, 1],
      }}
      className={className}
      transition={{
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1],
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}
