export type LaunchAccentTone = "pulse" | "signal" | "aurora";

export type LaunchMetric = {
  value: string;
  label: string;
};

export type LaunchHeroAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type LaunchNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type LaunchBrief = {
  id: "onerhythm" | "mirmade" | "de-novo";
  name: string;
  badge: string;
  summary: string;
  briefHref: string;
  logoSrc: string;
  logoAlt: string;
  accent: LaunchAccentTone;
};

export type LaunchContactItem = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

const briefs: LaunchBrief[] = [
  {
    id: "onerhythm",
    name: "OneRhythm",
    badge: "Visibility Initiative",
    summary:
      "A public-facing platform for making the invisible burden of arrhythmia harder to miss and easier to name. Built to reduce isolation, create recognition, and turn private experience into collective visibility.",
    briefHref: "/launch/pdfs/onerhythm-project-brief-2026.pdf",
    logoSrc: "/launch/logos/onerhythm-logo.png",
    logoAlt: "OneRhythm logo",
    accent: "pulse",
  },
  {
    id: "mirmade",
    name: "Project MIRmade",
    badge: "Research Initiative",
    summary:
      "An open research initiative exploring how modern AI/ML tools may help close the psychological-distress treatment gap in arrhythmia populations. Built with evidence discipline, regulatory awareness, and respect for what has not yet been built.",
    briefHref: "/launch/pdfs/mirmade-project-brief-2026.pdf",
    logoSrc: "/launch/logos/mirmade-logo.png",
    logoAlt: "Project MIRmade logo",
    accent: "signal",
  },
  {
    id: "de-novo",
    name: "Project De Novo",
    badge: "Operating Architecture",
    summary:
      "The operating architecture behind the work: a disciplined system for pursuing a problem too large for one person to carry loosely. Built around scope control, context retention, drift mitigation, and execution that stays honest under scale.",
    briefHref: "/launch/pdfs/de-novo-project-brief-2026.pdf",
    logoSrc: "/launch/logos/de-novo-logo.png",
    logoAlt: "Project De Novo logo",
    accent: "aurora",
  },
];

export const launchContent = {
  hero: {
    label: "Public launch",
    title: "A private decade became a public mission.",
    body:
      "For ten years, arrhythmia narrowed life into vigilance, procedures, fatigue, and the work of appearing fine from the outside. OneRhythm is what happened when that silence stopped being acceptable.",
    supportingBody:
      "This launch introduces three connected briefs: the public platform, the research initiative, and the operating architecture behind the work.",
    primaryAction: {
      label: "Download the briefs",
      href: "#briefs",
    } satisfies LaunchHeroAction,
    secondaryAction: {
      label: "View GitHub",
      href: "https://github.com/daftpixie/mirmade",
      external: true,
    } satisfies LaunchHeroAction,
    metrics: [
      {
        value: "10 years",
        label: "of lived experience",
      },
      {
        value: "3",
        label: "project briefs",
      },
      {
        value: "1",
        label: "shared mission",
      },
    ] satisfies LaunchMetric[],
  },
  founder: {
    label: "Founder story",
    title: "No more quiet.",
    paragraphs: [
      "For years, arrhythmia made life smaller than it looked from the outside. The burden was not only the episodes themselves. It was the constant negotiation around fear, isolation, uncertainty, and the work of making an invisible load look manageable.",
      "OneRhythm begins from a simple refusal to leave that experience in private any longer. What started as one person's long fight is being turned outward into visibility, open research, and infrastructure built to serve more than one story.",
      "This is not a triumph narrative. It is a first public marker - built for people who know what it means to live inside the numbers and carry an invisible burden in silence.",
    ],
    attribution: "Matthew J. Adams",
    role: "Founder, OneRhythm",
    imageSrc: "/launch/images/matthew-j-adams-headshot.png",
    imageAlt: "Matthew J. Adams, founder of OneRhythm",
  },
  briefsSection: {
    label: "Three project briefs",
    title: "One mission, explained three ways.",
    intro:
      "These briefs introduce the public platform, the research initiative, and the operating architecture behind the work.",
  },
  nav: [
    { label: "Story", href: "#story" },
    { label: "Briefs", href: "#briefs" },
    { label: "Contact", href: "#contact" },
    {
      label: "GitHub",
      href: "https://github.com/daftpixie/mirmade",
      external: true,
    },
  ] satisfies LaunchNavItem[],
  briefs,
  contact: {
    titleLines: ["Heart.", "Mind.", "Hands."],
    body: "All that's needed to solve big problems.",
    items: [
      {
        label: "Author",
        value: "Matthew J. Adams",
        href: "mailto:matthew@vt-infinite.com",
      },
      {
        label: "E-Mail",
        value: "matthew@vt-infinite.com",
        href: "mailto:matthew@vt-infinite.com",
      },
      {
        label: "X",
        value: "@OneRhythmOrg",
        href: "https://x.com/OneRhythmOrg",
        external: true,
      },
      {
        label: "Git",
        value: "github.com/daftpixie/mirmade",
        href: "https://github.com/daftpixie/mirmade",
        external: true,
      },
    ] satisfies LaunchContactItem[],
  },
} as const;
