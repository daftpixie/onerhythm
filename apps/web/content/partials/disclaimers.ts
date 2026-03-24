/**
 * Medical disclaimer and crisis resources — exact text.
 * Source: Content Strategy §Governance and safety, CLAUDE.md, site-copy.ts footer
 *
 * Rules:
 * - Every educational surface must carry persistent medical disclaimer
 * - Any mention of suicidality must include crisis resources
 * - Crisis resources must be easy to find
 */

export const medicalDisclaimer = {
  short:
    "OneRhythm is educational only. It does not diagnose or interpret ECGs.",
  full: "OneRhythm is an educational community platform. It is not a medical device. It does not diagnose, interpret ECGs, characterize waveforms clinically, or make treatment recommendations. Nothing on this platform should be understood as medical advice. Always consult a qualified healthcare provider for medical concerns.",
  boundary:
    "This is not medical advice. This is not diagnostic. This is solidarity and education.",
} as const;

export const crisisResources = {
  intro:
    "If you are in immediate emotional distress or worried about your safety, please reach out:",
  resources: [
    {
      name: "988 Suicide & Crisis Lifeline",
      action: "Call or text 988",
      href: "tel:988",
      region: "US",
    },
    {
      name: "Crisis Text Line",
      action: "Text HOME to 741741",
      href: "sms:741741&body=HOME",
      region: "US",
    },
    {
      name: "Samaritans",
      action: "Call 116 123",
      href: "tel:116123",
      region: "UK",
    },
    {
      name: "Lifeline",
      action: "Call 13 11 14",
      href: "tel:131114",
      region: "AU",
    },
  ] as const,
  footerNote:
    "If you are in immediate emotional distress or worried about your safety, call or text 988 in the U.S. or use your local emergency resources.",
  nonTherapeuticBoundary:
    "OneRhythm is not a crisis service and cannot provide therapy or counseling. If you are experiencing a mental health emergency, please contact one of the resources above.",
} as const;

export type MedicalDisclaimerContent = typeof medicalDisclaimer;
export type CrisisResourcesContent = typeof crisisResources;
