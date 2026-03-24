/**
 * 12 evidence-backed stat cards.
 * Source: Content Strategy §Evidence and data strategy, Content Library §stat cards
 *
 * Rules (from Content Strategy):
 * - One hero stat per page maximum
 * - Every stat must link to ResearchPulse
 * - Every stat must include "what this means" and "what helps"
 * - Never stack multiple distress/suicide/PTSD numbers on a single screen
 * - Always contextualize suicidality with crisis resources
 */

export type StatCard = {
  key: string;
  value: string;
  description: string;
  meaning: string;
  action: string;
  source: string;
  researchPulseHref: string;
  requiresCrisisResources: boolean;
};

export const statCards: StatCard[] = [
  // --- Arrhythmia clinic distress prevalence (n=222, DASS-21) ---
  {
    key: "anxiety_prevalence",
    value: "88.3%",
    description:
      "In one arrhythmia clinic cohort, moderate-to-extremely severe anxiety was reported on screening.",
    meaning:
      "What this means: the emotional burden is real enough to deserve routine attention.",
    action:
      "What helps: screening, conversation, referral pathways, and evidence people can actually use.",
    source: "Scientific Reports (2025) · DASS-21 screening, n=222",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },
  {
    key: "depression_prevalence",
    value: "71.1%",
    description:
      "In the same arrhythmia clinic cohort, moderate-to-extremely severe depression was common on DASS-21 screening.",
    meaning:
      "What this means: depression often accompanies arrhythmia but is frequently unscreened in routine care.",
    action:
      "What helps: integrating mental-health assessment into arrhythmia follow-up appointments.",
    source: "Scientific Reports (2025) · DASS-21 screening, n=222",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },
  {
    key: "stress_prevalence",
    value: "51%",
    description:
      "Moderate-to-extremely severe stress was reported by over half of arrhythmia clinic patients in the same cohort.",
    meaning:
      "What this means: stress is common in arrhythmia populations and deserves acknowledgment.",
    action:
      "What helps: normalizing conversations about stress and supporting integrated care pathways.",
    source: "Scientific Reports (2025) · DASS-21 screening, n=222",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },

  // --- Symptomatic AF in tertiary care (n=78) ---
  {
    key: "severe_distress",
    value: "35%",
    description:
      "In a tertiary AF cohort, severe psychological distress was present in over a third of patients.",
    meaning:
      "What this means: even in specialized care settings, psychological distress is common and often not formally addressed.",
    action:
      "What helps: routine distress screening and warm referral pathways as part of AF management.",
    source: "Europace (2023) · tertiary AF cohort, n=78",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },
  {
    key: "suicidal_ideation",
    value: "20%",
    description:
      "In the same tertiary AF cohort, one in five reported suicidal ideation.",
    meaning:
      "What this means: suicidal ideation in arrhythmia populations is more common than many clinicians realize.",
    action:
      "What helps: integrated mental-health pathways, crisis resources, and destigmatizing the conversation.",
    source: "Europace (2023) · tertiary AF cohort, n=78",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: true,
  },
  {
    key: "ablation_distress_reduction",
    value: "Significant",
    description:
      "Effective AF ablation was associated with reductions in psychological distress and suicidal ideation prevalence.",
    meaning:
      "What this means: treating the rhythm can also ease the emotional burden, reinforcing the case for whole-person care.",
    action:
      "What helps: ensuring patients have emotional support before, during, and after rhythm interventions.",
    source: "Europace (2023) · tertiary AF cohort, n=78",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },

  // --- ICD populations (meta-analysis, 39,954 patients) ---
  {
    key: "icd_anxiety",
    value: "22.58%",
    description:
      "A systematic review of nearly 40,000 ICD patients estimated clinically relevant anxiety at this level.",
    meaning:
      "What this means: anxiety is the most common psychological effect after ICD implantation.",
    action:
      "What helps: post-implant psychological screening and trauma-informed support pathways.",
    source: "Systematic review/meta-analysis · ICD populations, n=39,954",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },
  {
    key: "icd_depression",
    value: "15.42%",
    description:
      "Depression was estimated at this level across ICD patient populations in the same large meta-analysis.",
    meaning:
      "What this means: depression is a common companion to device-based rhythm management.",
    action:
      "What helps: routine mood screening at ICD follow-up and referral to psychological support.",
    source: "Systematic review/meta-analysis · ICD populations, n=39,954",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },
  {
    key: "icd_ptsd",
    value: "12.43%",
    description:
      "PTSD was estimated in approximately one in eight ICD patients, with shocks associated with higher odds.",
    meaning:
      "What this means: ICD shocks can be a traumatic event that persists long after the shock itself.",
    action:
      "What helps: trauma-informed post-shock support, validated screening, and peer connection.",
    source: "Systematic review/meta-analysis · ICD populations, n=39,954",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },

  // --- Social connection (UK Biobank) ---
  {
    key: "social_isolation_af",
    value: "Elevated risk",
    description:
      "A large UK Biobank analysis found loneliness and social isolation associated with higher incidence and worse prognosis of AF.",
    meaning:
      "What this means: connection is not just emotional comfort — it may be relevant to cardiovascular trajectories.",
    action:
      "What helps: community, peer support, and reducing isolation as a health-relevant intervention.",
    source: "UK Biobank prospective multistate analysis (PubMed 40281650)",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },

  // --- ESC 2025 consensus ---
  {
    key: "esc_consensus",
    value: "2025 ESC",
    description:
      "The European Society of Cardiology now explicitly advocates integrating mental health into person-centered cardiovascular care.",
    meaning:
      "What this means: the clinical world is moving toward treating the whole person — heart and mind together.",
    action:
      "What helps: multidisciplinary Psycho-Cardio collaboration and practical implementation using ACTIVE principles.",
    source: "ESC 2025 clinical consensus statement",
    researchPulseHref: "/research/pulse",
    requiresCrisisResources: false,
  },

  // --- Privacy / de-identification ---
  {
    key: "privacy_posture",
    value: "Synthetic only",
    description:
      "OneRhythm uses symbolic participation only. No real ECG data is uploaded, stored, or interpreted.",
    meaning:
      "What this means: privacy is structural, not just promised. The platform never holds identifiable health data.",
    action:
      "What helps: transparent communication about what the platform does and does not do.",
    source: "HHS OCR de-identification guidance (Safe Harbor / Expert Determination)",
    researchPulseHref: "/about",
    requiresCrisisResources: false,
  },
];

export function getStatCardByKey(key: string): StatCard | undefined {
  return statCards.find((card) => card.key === key);
}
