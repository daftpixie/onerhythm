/**
 * About page content module.
 * Source: Content Strategy §Open letter, Content Library §About, site-copy.ts
 */

export const about = {
  heroTitle: "No one should fight an invisible bear alone.",
  heroBody:
    "Arrhythmia is an invisible bear. It sits on your chest, seeks rent with no option to evict, and the world cannot see it. OneRhythm was built because that invisibility is the problem and shared visibility is the beginning of a constructive response.",
  founder: {
    eyebrow: "The Origin",
    narrative: [
      "I see problems. I fix them. That's not a tagline. It's a diagnosis. A brain rewired by adverse experiences into a pattern-recognition engine that never fully powers down.",
      "And then arrhythmia entered the equation. And for the first time in my life, I had a problem I could not solve.",
    ] as const,
    timeline: [
      "7 trips to the EP lab at Pepin Heart Institute",
      "4 RF ablations",
      "2 procedures canceled in pre-op",
      "3 ICD shocks",
      "3 million extra heartbeats a year",
      "10 years",
    ] as const,
    bearDisappears:
      "On December 9, 2024, my Farapulse ablation worked. The bear disappeared.",
    aftermath:
      "Healing from the physical condition did not erase a decade of emotional impact. It gave me the clarity to see it. And the responsibility to build something useful from it, not just for myself, but for every person still battling their own invisible bear.",
    signature: "Ad Astra Per Aspera",
    signatureMeaning: "Through hardship to the stars",
  },
  missionStatement:
    "OneRhythm turns the invisible burden of arrhythmia into shared visibility, evidence people can use, and a mission that proves no one has to carry this quietly.",
  features: [
    {
      title: "Shared stories",
      body: "Real experiences from real people. Your story could be the one that helps someone feel less alone at their hardest moment.",
    },
    {
      title: "Medically-reviewed education",
      body: "ResearchPulse turns peer-reviewed evidence into calm, accessible language that people can carry into appointments and conversations.",
    },
      {
        title: "A community that understands",
        body: "Connect with people who get it, because they've lived it too. Patients, caregivers, and advocates, all in one place.",
      },
  ] as const,
  faq: [
    {
      question: "Is OneRhythm a medical device?",
      answer:
        "No. OneRhythm is educational only. It does not diagnose, interpret ECGs, or make treatment recommendations.",
    },
    {
      question: "Do I need to upload an ECG?",
      answer:
        "No. OneRhythm uses symbolic participation only. You choose a rhythm identity and receive generated artwork, and no medical data is needed.",
    },
    {
      question: "What does 0.75 m mean?",
      answer:
        "Each verified contribution advances the mission by 0.75 meters of symbolic distance. This represents a symbolic 30-second rhythm strip, not an actual ECG measurement.",
    },
    {
      question: "Who can join?",
      answer:
        "Anyone: patients, caregivers, supporters, clinicians, and advocates. The mission is broadest when participation is not limited to patient identity.",
    },
    {
      question: "How is my privacy protected?",
      answer:
        "You control your visibility settings. Your display name, country, and note are all optional. Private contributions still count toward the mission without being publicly visible.",
    },
  ] as const,
  cta: {
    primary: "Join the mission",
    secondary: "Explore ResearchPulse",
  },
  painIsNotACompetition: "Pain is not a competition.",
  promiseIntro:
    "OneRhythm is a constructive response to an invisible problem. Arrhythmia affects millions, but the emotional burden it carries is routinely unscreened, underfunded, and invisible to the people closest to it. This mission exists to change that.",
} as const;

export type AboutContent = typeof about;
