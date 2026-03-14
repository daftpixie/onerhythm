"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { listContentByKind } from "../../lib/content";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function EvidenceResearchTranslations() {
  const entries = listContentByKind("research_translation");

  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
            Research Translations
          </p>
          <h2 className="mt-3 font-display text-[1.95rem] font-semibold text-text-primary sm:text-4xl">
            Evidence in Plain Language
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">
            These translations start with the evidence and carry it into
            language anyone can carry with them. Each article is source-backed,
            reviewed, and explicitly non-diagnostic.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {entries.map((entry, i) => (
            <motion.article
              className="group rounded-xl border border-token bg-cosmos p-6 transition-[background-color,box-shadow] duration-normal ease-out hover:bg-nebula hover:shadow-subtle"
              custom={i}
              initial="hidden"
              key={entry.content_id}
              variants={cardVariants}
              viewport={{ once: true, margin: "-40px" }}
              whileInView="visible"
            >
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-signal">
                {entry.kicker}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold text-text-primary">
                {entry.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {entry.summary}
              </p>

              {entry.research_translation?.key_finding ? (
                <div className="mt-4 rounded-lg border border-token bg-midnight/50 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    Key finding
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-primary">
                    {entry.research_translation.key_finding}
                  </p>
                </div>
              ) : null}

              <div className="mt-4">
                <Link
                  className="text-sm font-medium text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  href={`/research/${entry.slug}`}
                >
                  Read translation &rarr;
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link
            className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/research"
          >
            Browse all research articles
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
