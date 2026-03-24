/**
 * Homepage content module — 10-section scrollable narrative page.
 * Source: Content Strategy §Homepage, Content Library §Homepage,
 *         Brand Guidelines v3, PRD v3 §Homepage
 *
 * All copy on the homepage MUST come from this module.
 */

export const homepage = {
  // ━━━ SECTION 1: HERO ━━━
  hero: {
    eyebrow: "Nobody should fight an invisible bear alone",
    headline: "When rhythms connect, the bears become invisible.",
    subhead:
      "OneRhythm is a platform designed to provide education and support to individuals who suffer from arrhythmia and those who love them. No data collection. No diagnosis. Human first.",
    imageAlt:
      "Luminous heart globe showing connected rhythms becoming visible around the world.",
    cta: "Join the Mission",
    ctaHref: "/join",
  },

  // ━━━ SECTION 2: THE NUMBERS ━━━
  crisisStats: {
    heading: "The invisible weight of arrhythmia",
    subhead:
      "These are not OneRhythm statistics. These are peer-reviewed findings from independent research teams. Every number below has a source. Every source is accessible.",
    // Card keys reference content/partials/stat-cards.ts
    cardKeys: [
      "anxiety_prevalence",
      "depression_prevalence",
      "stress_prevalence",
      "severe_distress",
      "suicidal_ideation",
      "social_isolation_af",
    ] as const,
  },

  // ━━━ SECTION 3: THE GAP ━━━
  treatmentGap: {
    heading: "The treatment gap is real",
    subhead:
      "The clinical world treats the rhythm. It rarely treats the person carrying it.",
    body: "Arrhythmia care has made extraordinary progress in ablation, devices, and pharmacology. But psychological screening remains rare. Referral pathways are fragmented. And the emotional burden, anxiety, depression, PTSD, and suicidal ideation, goes mostly unmeasured and unaddressed.",
    cta: "This is why OneRhythm exists.",
    metrics: [
      {
        value: "<5%",
        label: "of EP clinics routinely screen for psychological distress",
        source: "Expert estimate based on current practice patterns",
      },
      {
        value: "0",
        label: "validated psycho-cardiology referral pathways in most health systems",
        source: "ESC 2025 consensus statement gap analysis",
      },
      {
        value: "Fragmented",
        label: "integration between rhythm management and mental health support",
        source: "ESC 2025 ACTIVE framework implementation review",
      },
    ] as const,
  },

  // ━━━ SECTION 4: ESC CONSENSUS ━━━
  escConsensus: {
    heading: "The clinical world is catching up",
    subhead:
      "In 2025, the European Society of Cardiology published a landmark consensus statement calling for integrated psycho-cardiology care.",
    badge: "ESC 2025 Clinical Consensus",
    cardHeadline: "The ACTIVE Framework",
    cardBody:
      "The ESC's 2025 consensus statement introduced the ACTIVE framework — a structured approach to integrating mental health into cardiovascular care. OneRhythm is aligned with this direction.",
    activeFramework: [
      { letter: "A", title: "Assess", description: "Screen for psychological distress using validated tools" },
      { letter: "C", title: "Communicate", description: "Discuss emotional impact openly as part of routine care" },
      { letter: "T", title: "Treat", description: "Provide evidence-based psychological interventions" },
      { letter: "I", title: "Integrate", description: "Embed mental health in multidisciplinary heart teams" },
      { letter: "V", title: "Validate", description: "Acknowledge patient experience as clinically relevant" },
      { letter: "E", title: "Evaluate", description: "Monitor psychological outcomes alongside cardiac metrics" },
    ] as const,
    source: "ESC 2025 clinical consensus statement on psychological aspects of cardiovascular disease",
    cta: "Read in ResearchPulse",
    ctaHref: "/research/pulse",
  },

  // ━━━ SECTION 5: SHARED RHYTHM DISTANCE ━━━
  missionDistance: {
    heading: "The mission is moving",
    subhead: "Shared Rhythm Distance",
    body: "Every person who joins adds exactly 0.75 meters to a shared symbolic waveform. That waveform is tracing a route from Tampa, around the Earth, and toward the Moon. It is not a metaphor. It is a measured, cumulative, public signal that this community exists and is growing.",
    narrative:
      "If every person living with atrial fibrillation alone joined OneRhythm and added their 0.75 m, the shared rhythm would travel 98.3% of the way around the Earth.\n\nThis is not a data collection. This is a collective artifact — owned by no one, grown by everyone.",
    cta: "Join the Mission",
    ctaHref: "/join",
    secondaryCta: "See the Mission",
    secondaryCtaHref: "/mission",
  },

  // Milestone ladder for section 5
  milestones: [
    { distance: "34 km", label: "Across the English Channel" },
    { distance: "7,100 km", label: "Tampa to London" },
    { distance: "13,138 km", label: "Every AF patient, one rhythm each" },
    { distance: "40,075 km", label: "Around the Earth" },
    { distance: "384,400 km", label: "To the Moon" },
  ] as const,

  // ━━━ SECTION 6: RESEARCHPULSE ━━━
  researchPulse: {
    heading: "ResearchPulse: research, translated for humans",
    subhead:
      "ResearchPulse is OneRhythm's evidence translation engine. It takes peer-reviewed clinical research and makes it accessible, not dumbed down, democratized. Evidence you can bring to your next appointment.",
    features: [
      {
        icon: "BookOpen" as const,
        title: "Condition-Specific Education",
        body: "Condition-specific education built around the realities of living with arrhythmia. Verified sources. Peer-reviewed. Cited.",
      },
      {
        icon: "MessageCircleQuestion" as const,
        title: "Questions for Your Clinician",
        body: "Suggested conversation starters for your next appointment. 'Ask your EP about mental health screening alongside arrhythmia monitoring.'",
      },
      {
        icon: "TrendingUp" as const,
        title: "Supportive Environment Information",
        body: "Designed to make the world of managing arrhythmia more digestable.",
      },
    ] as const,
    comingSoon: "Coming soon",
  },

  // ━━━ SECTION 7: ARTICLES ━━━
  articles: {
    heading: "A journey and a request",
    subhead:
      "One piece begins inside the lived reality of arrhythmia. The other asks the people shaping care to help make that invisible burden easier to see, name, and support.",
  },

  // ━━━ SECTION 8: OPEN SOURCE ━━━
  openSource: {
    heading: "Built in the open",
    body: "OneRhythm is open-source from day one. MIT license. The tech community sees the architecture. The patient community sees the mission. Both find reasons to care.\n\nA solo architect who survived ARVC built this platform using AI-augmented development. The code is transparent because transparency is not a feature — it's a moral obligation when you're asking vulnerable people to trust you.",
    repo: {
      name: "onerhythm/onerhythm",
      description:
        "Community-powered movement platform for arrhythmia patients. Next.js · TypeScript · Three.js · Supabase · FastAPI",
      href: "https://github.com/daftpixie/onerhythm",
    },
    contributorInvite:
      "We're looking for contributors. If you build, design, write, or care — there's a place for you.",
    cta: "View on GitHub",
  },

  // ━━━ SECTION 9: THE PROMISE ━━━
  promise: {
    headline:
      "Arrhythmia is a global problem. It deserves a global response.",
    body: "Millions of people across every continent live with arrhythmia — and carry its emotional weight in silence. The clinical world is beginning to acknowledge this. OneRhythm exists to make sure no one has to wait for that acknowledgment alone.",
    cta: "Join the Mission",
    ctaHref: "/join",
  },

  // Legacy fields kept for backward compatibility
  ideology:
    "In a world often divided, OneRhythm brings people together to help fight the invisible bears of arrhythmia.",
  counters: {
    distance: {
      label: "Shared distance",
      detail: "Public proof that what people carry deserves to be seen.",
    },
    joins: {
      label: "Rhythms joined",
      detail: "Each verified person joins the route once, with dignity.",
    },
    recent: {
      label: "Showing up today",
      detail: "The near-live pulse of people showing up for each other.",
    },
    countries: {
      label: "Countries represented",
      detail: "Where the mission is becoming visible.",
    },
    delta: {
      label: "0.75 m per rhythm",
      detail: "One honest symbolic move forward, never a clinical measure.",
    },
    belonging: {
      label: "Who can join",
      detail:
        "Patients, caregivers, supporters, and clinicians can all help turn silence into visibility.",
    },
  },
  finalCta: {
    headline: "The mission moves because people keep showing up for one another.",
    cta: "Join the mission",
    secondaryCta: "Explore ResearchPulse",
    supportLine:
      "Educational only. We do not diagnose or interpret ECGs. No one fights alone.",
  },
} as const;

export type HomepageContent = typeof homepage;
