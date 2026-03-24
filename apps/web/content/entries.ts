import type { ContentEntry } from "@onerhythm/types";

import { livingInsideTheNumbers } from "./articles/living-inside-the-numbers";
import { openLetterToElectrophysiologyLeaders } from "./articles/open-letter-to-electrophysiology-leaders";

export const contentEntries: ContentEntry[] = [
  {
    content_id: "essay-why-onerhythm-exists",
    slug: "why-onerhythm-exists",
    kind: "essay",
    locale: "en-US",
    translation_key: "essay.why_onerhythm_exists",
    title: "Why OneRhythm exists",
    kicker: "Project origin",
    summary:
      "A public explanation of the platform's origin: arrhythmias can carry an invisible emotional burden, and OneRhythm exists to make that reality less isolating.",
    seo: {
      title: "Why OneRhythm exists",
      description:
        "The origin story and purpose behind OneRhythm, grounded in lived experience, community visibility, and non-diagnostic educational support.",
    },
    author_ids: ["matthew-adams"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: false,
    disclaimer_required: false,
    sections: [
      {
        section_id: "problem",
        heading: "The problem is larger than the waveform",
        body: [
          "Many people living with arrhythmias carry a second burden that is harder to show in public: fear, hypervigilance, isolation, identity disruption, and the sense that everyday life has become fragile.",
          "OneRhythm was built to respond to that reality without pretending to replace clinical care. The platform is designed to make shared presence visible, help people find grounded educational context, and make privacy boundaries explicit.",
        ],
      },
      {
        section_id: "promise",
        heading: "What the platform is trying to offer",
        body: [
          "The public heart mosaic is meant to show that these experiences are communal, not solitary. The educational side of the platform is meant to help people prepare, learn, and ask better questions, not to diagnose or recommend treatment.",
          "The open-source posture is part of that promise. Transparency is not decorative here. It is how the product stays understandable and reviewable.",
        ],
      },
    ],
    source_links: [{ source_id: "founder-origin-public-v1" }],
  },
  livingInsideTheNumbers,
  openLetterToElectrophysiologyLeaders,
  {
    content_id: "research-mental-health-burden",
    slug: "arrhythmia-mental-health-burden",
    kind: "research_translation",
    locale: "en-US",
    translation_key: "research.arrhythmia_mental_health_burden",
    title: "What the literature says about the mental health burden around arrhythmias",
    kicker: "Research translation",
    summary:
      "A reviewed translation of the evidence base around anxiety, distress, and quality-of-life burden in arrhythmia populations.",
    seo: {
      title: "Arrhythmias and mental health burden",
      description:
        "A non-diagnostic research translation article about the emotional and mental health burden reported around arrhythmias.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    research_translation: {
      key_finding:
        "The literature does not treat anxiety, depression, hypervigilance, and distress around arrhythmias as edge cases. It shows them as recurring features of the lived burden.",
      plain_language_meaning: [
        "This does not mean every person will feel the same level of fear, grief, or disruption. It means those reactions are common enough that a responsible product should not pretend the experience is only technical.",
        "For OneRhythm, the practical implication is to build with calm language, visible support pathways, and clear limits around what educational software can and cannot say.",
      ],
      questions_for_doctor: [
        "How should I talk about the emotional impact this is having on my day-to-day life?",
        "What changes or patterns would be useful for me to bring up at my next visit?",
        "If I am feeling overwhelmed, what kinds of support do you want me to consider alongside my medical care?",
      ],
      stat_highlights: [
        {
          stat_id: "emotional-burden",
          value: "88.3%",
          label: "reported moderate to extremely severe anxiety",
          context:
            "Nature Scientific Reports (2025), N=222, as cited in the campaign strategy.",
        },
        {
          stat_id: "distress-signal",
          value: "20%",
          label: "of symptomatic AFib patients reported suicidal thoughts",
          context:
            "American Heart Association / Royal Melbourne Hospital study, cited in the campaign strategy.",
        },
        {
          stat_id: "ptsd-mortality",
          value: "3.2x",
          label: "greater five-year mortality linked to elevated PTSD scores in ICD patients",
          context:
            "Circulation: Arrhythmia & Electrophysiology, cited in the campaign strategy.",
        },
      ],
    },
    sections: [
      {
        section_id: "overview",
        heading: "Why this matters for public product design",
        body: [
          "A responsible public platform should not reduce arrhythmia experiences to a waveform, a chart, or a glossary. If the lived experience includes uncertainty and emotional strain, the product has to acknowledge that with care rather than leave it invisible.",
          "That is why OneRhythm pairs its educational work with support pathways, a visible disclaimer boundary, and a communal visual surface instead of trying to impersonate a medical authority.",
        ],
      },
      {
        section_id: "certainty",
        heading: "What this article is not claiming",
        body: [
          "This translation is not saying every person with an arrhythmia will have the same emotional experience. It is not claiming that emotional burden can be measured from an ECG. It is not offering a treatment plan.",
          "It is saying that a launch-ready educational platform should make room for the emotional truth people report, while staying firmly outside diagnosis and treatment recommendation territory.",
        ],
        bullets: [
          "Stay plain-language and non-alarmist.",
          "Keep support resources easy to find.",
          "Make source provenance visible.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Frames the public mental-health and visibility problem that this article translates into product-safe language.",
      },
      {
        source_id: "founder-origin-public-v1",
        relevance_note:
          "Provides the lived context behind why emotional burden and isolation are treated as core public themes.",
      },
    ],
  },
  {
    content_id: "campaign-invisible-crisis",
    slug: "the-invisible-crisis",
    kind: "campaign_page",
    locale: "en-US",
    translation_key: "campaign.the_invisible_crisis",
    title: "The Invisible Crisis",
    kicker: "Campaign",
    summary:
      "A launch-facing explanation of the hidden emotional and mental health burden around arrhythmias, and why OneRhythm treats that burden as a public issue.",
    seo: {
      title: "The Invisible Crisis",
      description:
        "A OneRhythm campaign page about the invisible emotional burden around arrhythmias and why that burden belongs in public view.",
    },
    author_ids: ["matthew-adams", "onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: false,
    disclaimer_required: false,
    campaign_key: "invisible-crisis",
    sections: [
      {
        section_id: "problem",
        heading: "What often goes unseen",
        body: [
          "Rhythm conditions can bring fear, isolation, hypervigilance, and a lasting disruption to daily life that is hard to explain to people who have never lived near that uncertainty.",
          "OneRhythm uses the phrase invisible crisis to name that under-recognized burden carefully. The goal is not to sensationalize it. The goal is to make public room for it.",
        ],
      },
      {
        section_id: "response",
        heading: "What a responsible response looks like",
        body: [
          "For OneRhythm, the response is communal visibility, educational support, and privacy-preserving contribution. It is not diagnosis, triage, or clinical interpretation.",
          "This page exists as part of the launch narrative so people understand the human problem before they encounter the product surfaces built to address it.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Defines the visibility pillar and the need to speak clearly about the burden without turning it into spectacle.",
      },
      {
        source_id: "founder-origin-public-v1",
        relevance_note:
          "Grounds the page in founder narrative rather than presenting it as a research claim.",
      },
    ],
  },
  {
    content_id: "research-what-the-research-shows",
    slug: "what-the-research-shows",
    kind: "research_translation",
    locale: "en-US",
    translation_key: "research.what_the_research_shows",
    title: "What the Research Shows",
    kicker: "Research translation",
    summary:
      "A first launch translation page that explains how OneRhythm handles reviewed research themes in plain language and without overclaiming certainty.",
    seo: {
      title: "What the Research Shows",
      description:
        "A plain-language OneRhythm research translation page explaining what reviewed sources suggest and what they do not justify claiming.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    research_translation: {
      key_finding:
        "At launch, OneRhythm uses research translation to carry reviewed findings into plain language without stripping away their seriousness or their limits.",
      plain_language_meaning: [
        "This page is a launch-ready research pattern, not an attempt to turn a public website into a clinic. It exists to make reviewed material easier to read and easier to carry into a real care conversation.",
        "As the public evidence registry grows, future translations can become more specific while preserving the same boundary: explain clearly, never overstate certainty.",
      ],
      questions_for_doctor: [
        "What questions would help me make sense of the information I am reading?",
        "How should I talk about the emotional and day-to-day impact this is having on me?",
        "Which sources or explanations do you want me to rely on between visits?",
      ],
      stat_highlights: [
        {
          stat_id: "launch-pattern",
          value: "~33%",
          label: "of AF patients meet clinical thresholds for depression and anxiety in a cited systematic review",
          context:
            "Frontiers in Cardiovascular Medicine (2023), cited in the campaign strategy.",
        },
        {
          stat_id: "icd-burden",
          value: "22.6%",
          label: "clinically relevant anxiety prevalence reported across ICD patients",
          context:
            "EP Europace (2023), meta-analysis of 39,954 ICD patients, cited in the campaign strategy.",
        },
      ],
    },
    sections: [
      {
        section_id: "launch-approach",
        heading: "How OneRhythm translates research at launch",
        body: [
          "The first launch set keeps the research layer modest and auditable. It uses reviewed source metadata, plain-language summaries, and visible provenance rather than a dense editorial stack or inflated evidence claims.",
          "That means some early pages explain the translation method itself while the external evidence registry grows. This is a safer launch posture than pretending broader evidence coverage already exists.",
        ],
      },
      {
        section_id: "boundary",
        heading: "What this page will not do",
        body: [
          "It will not diagnose anyone, rank risk, recommend treatment, or speak as if the platform has clinical authority. It is here to help readers understand how reviewed sources are handled and how uncertainty is preserved.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "education-architecture-v1",
        relevance_note:
          "Defines the educational response boundary, source traceability, and fail-closed behavior for missing or stale content.",
      },
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Frames the requirement to lead with data, land with humanity, and avoid hype or false certainty.",
      },
    ],
  },
  {
    content_id: "condition-afib-basics",
    slug: "afib",
    kind: "condition_module",
    locale: "en-US",
    translation_key: "condition.afib",
    title: "Understanding atrial fibrillation in plain language",
    kicker: "Condition education",
    summary:
      "A calm, reviewed overview of atrial fibrillation that helps people orient themselves, prepare questions, and find credible next steps for learning.",
    seo: {
      title: "Atrial fibrillation education",
      description:
        "A non-diagnostic atrial fibrillation education module with plain-language context, visit-question prompts, and source references.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    condition_code: "afib",
    sections: [
      {
        section_id: "plain-language",
        heading: "What people often need first",
        body: [
          "People often need a stable explanation before they need more detail. This module focuses on plain-language orientation, not diagnosis or treatment recommendations.",
          "The goal is to help someone understand the vocabulary around atrial fibrillation, notice what questions they want answered, and move into a clinical conversation more prepared.",
        ],
      },
      {
        section_id: "question-prompts",
        heading: "Questions worth bringing to a visit",
        body: [
          "The most useful next step is often a clearer conversation rather than more guesswork.",
        ],
        bullets: [
          "What does my care team want me to understand about my specific situation?",
          "What symptoms or changes should I bring up promptly?",
          "What follow-up plan makes sense for me?",
        ],
      },
    ],
    source_links: [
      {
        source_id: "prd-public-v1",
        relevance_note:
          "Defines the public educational boundary and condition-education goals for launch.",
      },
      {
        source_id: "education-architecture-v1",
        relevance_note:
          "Documents the API educational engine and its curated-source guardrails.",
      },
    ],
  },
  {
    content_id: "support-questions-for-your-doctor",
    slug: "questions-for-your-doctor",
    kind: "support_resource",
    locale: "en-US",
    translation_key: "support.questions_for_your_doctor",
    title: "Questions for Your Doctor",
    kicker: "Support resources",
    summary:
      "A calm launch page with neutral, reusable prompts people can bring into a clinical conversation without implying diagnosis or treatment advice.",
    seo: {
      title: "Questions for Your Doctor",
      description:
        "A OneRhythm support page with plain-language prompts to help people prepare for a doctor visit.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    sections: [
      {
        section_id: "purpose",
        heading: "A steady place to begin",
        body: [
          "When people feel overwhelmed, it can be hard to know where to start. A short list of grounded questions can make a conversation feel more manageable without pretending the page knows what a clinician will say.",
        ],
      },
      {
        section_id: "question-set",
        heading: "Useful prompts to carry with you",
        body: [
          "Use these as conversation starters, not as a script you have to perform perfectly.",
        ],
        bullets: [
          "What do you most want me to understand about my specific situation right now?",
          "What symptoms, changes, or patterns would be most useful for me to mention?",
          "How should I talk about the emotional impact this is having on my daily life?",
          "What would make it important to contact a clinician sooner?",
        ],
      },
    ],
    source_links: [
      {
        source_id: "product-docs-public-v1",
        relevance_note:
          "Supports the educational goal of helping people prepare better questions instead of offering diagnosis.",
      },
      {
        source_id: "education-architecture-v1",
        relevance_note:
          "Defines the allowed response shape for doctor-question prompts in the educational system.",
      },
    ],
  },
  {
    content_id: "support-starting-points",
    slug: "starting-points",
    kind: "support_resource",
    locale: "en-US",
    translation_key: "support.starting_points",
    title: "Support starting points when the emotional weight feels heavy",
    kicker: "Support resources",
    summary:
      "A first-pass support page that acknowledges overwhelm, points to credible starting places, and keeps the platform's educational boundary clear.",
    seo: {
      title: "Arrhythmia support starting points",
      description:
        "Support resources and care-navigation starting points for people carrying the emotional weight of arrhythmia experiences.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    sections: [
      {
        section_id: "acknowledgement",
        heading: "It is reasonable to need support",
        body: [
          "Fear, isolation, and hypervigilance can become part of the day-to-day experience around rhythm conditions. Needing support is not a sign that you are failing to cope correctly.",
        ],
      },
      {
        section_id: "starting-places",
        heading: "Grounded next steps",
        body: [
          "The best starting place depends on urgency and context, but the general principle is to move toward credible support rather than staying alone with the burden.",
        ],
        bullets: [
          "Bring the emotional impact into your next care conversation.",
          "Use peer or caregiver support spaces with clear moderation and privacy expectations.",
          "If you feel unsafe or in crisis, contact local emergency or crisis services immediately.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "product-docs-public-v1",
        relevance_note:
          "Anchors the support-resource posture in the public product documentation.",
      },
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Explains why emotional burden and support pathways belong in the platform at launch.",
      },
    ],
  },
  {
    content_id: "support-mental-health-resources",
    slug: "mental-health-support-resources",
    kind: "support_resource",
    locale: "en-US",
    translation_key: "support.mental_health_support_resources",
    title: "Mental Health & Support Resources",
    kicker: "Support resources",
    summary:
      "A first launch support page that acknowledges the emotional burden around arrhythmias and points people toward grounded next steps without drifting into clinical advice.",
    seo: {
      title: "Mental Health & Support Resources",
      description:
        "A OneRhythm support page about emotional burden, peer support, and grounded next steps for people who feel overwhelmed.",
    },
    author_ids: ["onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: true,
    disclaimer_required: true,
    sections: [
      {
        section_id: "acknowledgement",
        heading: "The emotional burden is real",
        body: [
          "An arrhythmia experience can affect calm, sleep, relationships, and a sense of safety. Naming that burden does not make it dramatic. It makes it easier to respond to honestly.",
        ],
      },
      {
        section_id: "resource-paths",
        heading: "Support paths worth considering",
        body: [
          "The right next step depends on urgency and context. This page exists to offer grounded directions, not to replace professional support.",
        ],
        bullets: [
          "Bring the emotional impact into your next care conversation.",
          "Look for moderated peer or caregiver support spaces with clear privacy expectations.",
          "If you feel unsafe or in crisis, contact local emergency or crisis services immediately.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Explains why support pathways and emotional burden belong in the launch product rather than being treated as secondary.",
      },
      {
        source_id: "product-docs-public-v1",
        relevance_note:
          "Anchors the support-resource posture in the public product framing and safety boundary.",
      },
    ],
  },
  {
    content_id: "campaign-community-heart-mosaic",
    slug: "community-heart-mosaic",
    kind: "campaign_page",
    locale: "en-US",
    translation_key: "campaign.community_heart_mosaic",
    title: "Community / Heart Mosaic",
    kicker: "Campaign",
    summary:
      "A launch-facing page explaining the Heart Mosaic as a public symbol of shared presence, privacy-preserving contribution, and solidarity.",
    seo: {
      title: "Community / Heart Mosaic",
      description:
        "A OneRhythm campaign page about the Heart Mosaic, collective visibility, anonymous contribution, and public solidarity.",
    },
    author_ids: ["matthew-adams", "onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: false,
    disclaimer_required: false,
    campaign_key: "community-heart-mosaic",
    sections: [
      {
        section_id: "symbol",
        heading: "What the Heart Mosaic is for",
        body: [
          "The Heart Mosaic exists to turn private burden into visible shared presence without exposing personal identity. It is not a diagnostic display. It is a communal artifact.",
          "That distinction matters. The value of the mosaic is emotional and civic as much as visual: it says these experiences are here, they count, and they are not isolated events happening in silence.",
        ],
      },
      {
        section_id: "privacy",
        heading: "How solidarity stays privacy-preserving",
        body: [
          "Contribution is optional and consent-based. Public tiles are anonymous. Original uploads are handled ephemerally. The public artifact is meant to embody care, not extraction.",
        ],
      },
    ],
    source_links: [
      {
        source_id: "public-mosaic-architecture-v1",
        relevance_note:
          "Documents the anonymous public metadata surface, accessibility behavior, and launch rendering boundary.",
      },
      {
        source_id: "campaign-strategy-public-v1",
        relevance_note:
          "Defines the Heart Mosaic as the communal centerpiece of the launch experience.",
      },
      {
        source_id: "community-stories-architecture-v1",
        relevance_note:
          "Supports the larger community posture around consent, moderation, and public participation.",
      },
    ],
  },
  {
    content_id: "campaign-invisible-weight",
    slug: "the-weight-you-cant-see",
    kind: "campaign_page",
    locale: "en-US",
    translation_key: "campaign.the_weight_you_cant_see",
    title: "The weight you can't see",
    kicker: "Campaign",
    summary:
      "A public campaign landing page framing the invisible emotional burden around rhythm disorders and the role OneRhythm is trying to play.",
    seo: {
      title: "The weight you can't see",
      description:
        "A OneRhythm campaign page about the invisible emotional burden around arrhythmias, shared presence, and public understanding.",
    },
    author_ids: ["matthew-adams", "onerhythm-editorial"],
    publish_date: "2026-03-12",
    updated_date: "2026-03-12",
    review_state: "published",
    educational_surface: false,
    disclaimer_required: false,
    campaign_key: "invisible-weight",
    sections: [
      {
        section_id: "framing",
        heading: "Why this campaign exists",
        body: [
          "Many people can recognize a visible injury. Fewer know how to recognize the private psychological burden that can follow rhythm disruption, procedures, devices, and ongoing uncertainty.",
          "This campaign exists to make that reality easier to name in public without collapsing the platform into fear-based storytelling.",
        ],
      },
      {
        section_id: "invitation",
        heading: "What OneRhythm is inviting people into",
        body: [
          "Shared visibility. Better language. Educational context. A public heart mosaic that says these lives are present and these experiences matter.",
        ],
      },
    ],
    source_links: [
      { source_id: "campaign-strategy-public-v1" },
      { source_id: "founder-origin-public-v1" },
    ],
  },
];
