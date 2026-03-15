"use client";

import { motion } from "framer-motion";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PromiseSection() {
  return (
    <section className="relative py-12">
      {/* Subtle heartbeat gradient overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{ background: "var(--gradient-heartbeat)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-void)" }}
      />

      <div className="mx-auto max-w-[720px] px-6 sm:px-10 lg:px-12">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base leading-[1.7] text-text-secondary">
            I see people everywhere seeking hope in their battle with
            arrhythmia. It is not easy to find it alone.
          </p>

          <p className="text-lg font-medium leading-8 text-text-primary">
            If you are reading this and you are in the thick of it - if the
            bear is on your chest and nobody around you can see it - I want you
            to hear this:
          </p>
        </motion.div>

        {/* The core promise */}
        <motion.blockquote
          className="my-8 text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <p className="font-display text-[1.56rem] font-semibold leading-snug text-text-primary sm:text-[1.75rem]">
            You are not defective. You are not broken beyond repair. You are a
            human being carrying a weight that was never meant to be carried
            alone, battling an enemy that the world cannot see, in a body that
            is fighting a war it didn&rsquo;t choose.
          </p>
        </motion.blockquote>

        {/* Decorative gradient rule */}
        <div className="flex justify-center">
          <span
            aria-hidden="true"
            className="block h-px w-[120px] rounded-full"
            style={{ background: "var(--gradient-heartbeat)" }}
          />
        </div>

        <motion.div
          className="mt-8 space-y-6"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="mx-auto max-w-md text-center text-sm leading-7 text-text-secondary">
            Pain is not a competition. The person with one PVC an hour who is
            terrified deserves the same compassion as the person with three
            million a year who has gone numb. OneRhythm will never rank
            suffering. It will always validate it.
          </p>

          {/* Signature block */}
          <div className="flex flex-col items-center gap-1">
            <p className="font-display text-xl font-semibold text-text-primary">
              Matthew Adams
            </p>
            <p className="text-sm text-text-secondary">
              Founder, OneRhythm
            </p>
            <p className="text-xs text-text-tertiary">
              Bear Fighting Jedi.
            </p>
            <p className="text-xs italic text-text-tertiary">
              Builder. Loud When Needed.
            </p>
            <p className="mt-1 font-mono text-xs italic text-signal">
              Ad Astra Per Aspera
            </p>
          </div>

          {/* Breathing heart */}
          <div className="flex justify-center pt-4">
            <svg
              aria-hidden="true"
              className="h-8 w-8 animate-[heartbeatIcon_1.2s_ease-in-out_infinite]"
              viewBox="0 0 24 24"
            >
              <defs>
                <linearGradient id="heart-grad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-pulse)" />
                  <stop offset="50%" stopColor="var(--color-pulse-dark)" />
                  <stop offset="100%" stopColor="var(--color-aurora)" />
                </linearGradient>
              </defs>
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="url(#heart-grad)"
              />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
