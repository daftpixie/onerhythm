"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const activeFramework = [
  {
    letter: "A",
    label: "Acknowledge",
    description:
      "Recognize the multidirectional link between mental health and cardiovascular disease",
    color: "text-pulse",
    bg: "bg-pulse/10",
    border: "border-pulse/30",
  },
  {
    letter: "C",
    label: "Check",
    description:
      "Screen for mental health symptoms during cardiovascular care",
    color: "text-pulse-glow",
    bg: "bg-pulse/10",
    border: "border-pulse/30",
  },
  {
    letter: "T",
    label: "Tools",
    description: "Use validated screening instruments",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/30",
  },
  {
    letter: "I",
    label: "Implement",
    description:
      "Shared decision-making between patient and care team",
    color: "text-signal",
    bg: "bg-signal/10",
    border: "border-signal/30",
  },
  {
    letter: "V",
    label: "Venture",
    description: "Change the culture of cardiovascular care",
    color: "text-aurora",
    bg: "bg-aurora/10",
    border: "border-aurora/30",
  },
  {
    letter: "E",
    label: "Evaluate",
    description: "Audit current practice against the standard",
    color: "text-aurora-glow",
    bg: "bg-aurora/10",
    border: "border-aurora/30",
  },
];

const nodeVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: EASE_REVEAL,
    },
  }),
};

export function ESCValidation() {
  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-success">
            Institutional Validation
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            The ESC Is Leading the Way
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
            The 2025 European Society of Cardiology Clinical Consensus
            Statement on Mental Health and Cardiovascular Disease.
          </p>
        </motion.div>

        {/* ACTIVE framework card */}
        <motion.div
          className="mt-8 rounded-xl border border-token border-t-2 border-t-success bg-cosmos p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-display text-lg font-semibold text-text-primary">
            The ACTIVE Framework
          </h3>

          {/* Desktop: horizontal flow, Mobile: vertical */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {activeFramework.map((node, i) => (
              <motion.div
                className={`relative rounded-lg border ${node.border} ${node.bg} p-4`}
                custom={i}
                initial="hidden"
                key={node.letter}
                variants={nodeVariants}
                viewport={{ once: true, margin: "-20px" }}
                whileInView="visible"
              >
                <p
                  className={`font-display text-2xl font-bold ${node.color}`}
                >
                  {node.letter}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-text-primary">
                  {node.label}
                </p>
                <p className="mt-1 text-xs leading-4 text-text-secondary">
                  {node.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Connecting line — desktop only */}
          <div
            aria-hidden="true"
            className="mx-auto mt-4 hidden h-px w-3/4 rounded-full lg:block"
            style={{ background: "var(--gradient-signal)" }}
          />
        </motion.div>

        <motion.p
          className="mt-8 max-w-3xl text-base leading-[1.7] text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Every pillar of the ACTIVE framework maps directly to what OneRhythm
          already does. Acknowledge: the Heart Mosaic makes the burden visible.
          Check and Tools: the educational engine arms patients with screening
          vocabulary. Implement and Venture: Research Pulse translates the
          literature into conversations patients can have with their
          cardiologists. Evaluate: the platform is open-source and auditable.
        </motion.p>
      </div>
    </section>
  );
}
