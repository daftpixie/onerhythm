"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
              a diagnosis. A brain rewired by adverse experiences into a
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

        <motion.div
          className="mt-10 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base leading-[1.7] text-text-primary">
            Arrhythmia does not care how smart you are. It does not care how
            disciplined you are. It sits in your chest like a tenant who pays
            no rent and breaks everything it touches, and there is nothing you
            can do to evict it on your own terms.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base leading-[1.7] text-text-primary">
            The bear metaphor was never about the arrhythmia alone. It was
            the constant fight-or-flight state that nobody could see. The racing
            heart at 2 AM that looked normal to everyone else. The ICD shocks
            that permanently change your relationship with time. The adrenaline
            surges that often had no clear place to go in routine care because the
            system was built to measure rhythm first and emotional wellbeing later, if at all.
          </p>

          <p className="font-display text-[1.56rem] font-semibold leading-tight text-text-primary">
            On December 9, 2024, my Farapulse ablation worked. The bear
            disappeared.
          </p>

          <p className="text-base leading-[1.7] text-text-secondary">
            Healing from the physical condition did not erase a decade of
            emotional impact. It gave me the clarity to see it. And the
            responsibility to build something useful from it, not just for myself,
            but for every person still battling their own invisible bear.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
