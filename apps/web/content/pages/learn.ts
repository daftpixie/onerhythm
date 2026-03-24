/**
 * Learn / ResearchPulse beta landing content module.
 * Source: Brand v3, PRD v3, and current product direction for in-development ResearchPulse surfaces.
 */

export const learn = {
  hero: {
    eyebrow: "ResearchPulse",
    title: "ResearchPulse is in development.",
    body:
      "Condition-specific education and supportive information for people living with arrhythmia is being built now. The goal is a calmer, more human way to understand what you are carrying, what the evidence says, and what questions are worth bringing into care.",
    highlights: [
      "Condition-specific education",
      "Supportive environment information",
      "Beta testing access",
    ] as const,
  },
  featureIntro: {
    eyebrow: "What is coming",
    title: "Early features are being shaped around readability, dignity, and practical use.",
    body:
      "ResearchPulse is meant to make the world of managing arrhythmia more digestible without pretending to diagnose, interpret, or replace care.",
  },
  featurePreviews: [
    {
      label: "Education lane",
      title: "Condition-specific education",
      body:
        "Plain-language guidance for arrhythmia realities people actually live with, including condition context, questions for appointments, and support pathways worth knowing.",
    },
    {
      label: "Support lane",
      title: "Supportive environment information",
      body:
        "Human-centered information designed to make the world of managing arrhythmia more digestible for patients, caregivers, and the people trying to show up well.",
    },
    {
      label: "Evidence lane",
      title: "Source-backed translation",
      body:
        "Peer-reviewed evidence translated into clear language with uncertainty kept visible, so the material is useful without becoming overclaimed.",
    },
  ] as const,
  betaAccess: {
    eyebrow: "Beta access",
    title: "Help shape the first release.",
    body:
      "Join the beta list to preview features in development, test early educational surfaces, and help us build something that feels more useful than overwhelming.",
    checklist: [
      "Preview new ResearchPulse surfaces before wider launch",
      "Offer practical feedback on clarity, tone, and usefulness",
      "Help pressure-test the non-diagnostic educational boundary",
    ] as const,
    buttonLabel: "Request beta access",
  },
  process: {
    eyebrow: "How it works",
    steps: [
      {
        title: "Join the beta list",
        body:
          "Add your email so we can reach you when new testing windows and feature previews open.",
      },
      {
        title: "Review what is in development",
        body:
          "We will share the current feature set, what is ready for feedback, and what is still being refined.",
      },
      {
        title: "Shape the release",
        body:
          "Beta feedback should make the product clearer, calmer, and more useful for people living inside this experience.",
      },
    ] as const,
  },
  principles: {
    eyebrow: "What will stay true",
    items: [
      "Educational only. ResearchPulse will not diagnose, interpret ECGs, or recommend treatment.",
      "Readability outranks feature noise. The point is clarity people can actually use.",
      "Human stakes stay visible. The work is meant to support people, not flatten them into abstractions.",
    ] as const,
  },
} as const;

export type LearnContent = typeof learn;
