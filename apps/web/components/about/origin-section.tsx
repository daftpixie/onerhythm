"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const timelineNodes = [
  "7 trips to the EP lab at Pepin Heart Institute",
  "4 RF ablations",
  "2 procedures canceled in pre-op",
  "3 ICD shocks",
  "3 million extra heartbeats a year",
  "10 years",
];

const nodeVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: EASE_REVEAL,
    },
  }),
};

export function OriginSection() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[720px] px-6 sm:px-10 lg:px-12">
        {/* Block 1 — The Wiring */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            The Origin
          </p>

          <div className="space-y-6 text-base leading-[1.7] text-text-primary">
            <p>
              I see problems. I fix them. That&rsquo;s not a tagline - it&rsquo;s
              a diagnosis. A brain rewired by adverse childhood experiences into a
              pattern-recognition engine that never fully powers down. When you grow
              up in an environment where safety isn&rsquo;t a given, your nervous
              system learns to scan. Constantly. For threats, for exits, for the
              variable in the equation that doesn&rsquo;t balance.
            </p>

            <p className="font-medium">
              And then arrhythmia entered the equation. And for the first time in
              my life, I had a problem I could not solve.
            </p>
          </div>
        </motion.div>

        {/* Block 2 — The Unsolvable Equation */}
        <motion.div
          className="mt-10 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base leading-[1.7] text-text-primary">
            Arrhythmogenic right ventricular cardiomyopathy does not care how
            smart you are. It does not care how disciplined you are. It sits in
            your chest like a tenant who pays no rent and breaks everything it
            touches, and there is nothing you can do to evict it on your own
            terms.
          </p>

          {/* Timeline */}
          <div className="relative ml-4 border-l border-token pl-8">
            {timelineNodes.map((node, i) => (
              <motion.div
                className="relative pb-6 last:pb-0"
                custom={i}
                initial="hidden"
                key={node}
                variants={nodeVariants}
                viewport={{ once: true, margin: "-20px" }}
                whileInView="visible"
              >
                {/* Dot */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-pulse"
                />
                <p className="font-display text-lg font-semibold text-text-primary">
                  {node}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Block 3 — The Bear Disappears */}
        <motion.div
          className="mt-10 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base leading-[1.7] text-text-primary">
            The bear metaphor was never about the arrhythmia alone. The bear was
            the constant fight-or-flight state that nobody could see. The racing
            heart at 2 AM that looked normal to everyone else. The ICD shocks that permamently change your outlook on time. The adrenaline
            surges that your cardiologist never asked about because they were
            measuring QRS duration, not quality of life.
          </p>

          <p className="font-display text-[1.56rem] font-semibold leading-tight text-text-primary">
            On December 9, 2024, my Farapulse ablation worked. The bear
            disappeared.
          </p>

          <p className="text-base leading-[1.7] text-text-secondary">
            Healing from the physical disease did not erase a decade of
            psychological damage. It gave me the clarity to see it. And the
            obligation to do something about it - not just for myself, but for
            every person still inside those numbers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
