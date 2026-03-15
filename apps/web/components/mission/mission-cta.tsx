"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Heart, Search, Share2 } from "lucide-react";
import Link from "next/link";

import { MedicalDisclaimer } from "@onerhythm/ui";

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

type CTACard = {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  description: string;
  href: string;
  buttonLabel: string;
  buttonStyle: string;
};

const cards: CTACard[] = [
  {
    icon: Heart,
    iconColor: "text-pulse",
    label: "Join the Mosaic",
    description:
      "Contribute your ECG. Add your heartbeat to the collective.",
    href: "/onboarding",
    buttonLabel: "Contribute",
    buttonStyle: "action-link action-link-primary",
  },
  {
    icon: Search,
    iconColor: "text-signal",
    label: "Read the Research",
    description:
      "Explore the peer-reviewed evidence behind every claim.",
    href: "/research/pulse",
    buttonLabel: "Research Pulse",
    buttonStyle: "action-link action-link-quiet",
  },
  {
    icon: Share2,
    iconColor: "text-aurora",
    label: "Spread the Word",
    description:
      "Share the mission. The more visible the numbers are, the harder they are to ignore.",
    href: "/about",
    buttonLabel: "Learn More",
    buttonStyle: "action-link action-link-quiet",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function MissionCTA() {
  return (
    <section className="bg-midnight py-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              className="rounded-xl border border-token bg-cosmos p-6 transition-[background-color,box-shadow] duration-normal ease-out hover:bg-nebula hover:shadow-subtle"
              custom={i}
              initial="hidden"
              key={card.label}
              variants={cardVariants}
              viewport={{ once: true, margin: "-40px" }}
              whileInView="visible"
            >
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              <h3 className="mt-3 font-display text-xl font-semibold text-text-primary">
                {card.label}
              </h3>
              <p className="mt-2 text-xs leading-5 text-text-secondary">
                {card.description}
              </p>
              <Link
                className={`${card.buttonStyle} mt-4 inline-flex px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void`}
                href={card.href}
              >
                {card.buttonLabel}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Crisis resources */}
        <motion.p
          className="mx-auto mt-10 max-w-xl text-center text-sm leading-7 text-text-secondary"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: EASE_REVEAL }}
          viewport={{ once: true, margin: "-40px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          If you or someone you know is struggling with mental health, please
          reach out to the{" "}
          <a
            className="text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            href="tel:988"
          >
            988 Suicide &amp; Crisis Lifeline
          </a>{" "}
          (call or text 988) or the{" "}
          <a
            className="text-signal transition-colors duration-micro hover:text-signal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            href="sms:741741&body=HOME"
          >
            Crisis Text Line
          </a>{" "}
          (text HOME to 741741).
        </motion.p>

        <div className="mt-8">
          <MedicalDisclaimer />
        </div>
      </div>
    </section>
  );
}
