# OneRhythm

> *Every heartbeat has a story. Every story deserves to be heard.*

OneRhythm is a community-powered, open-source platform for people living with cardiac arrhythmias — and for the people who love them.

We exist because the data is devastating and the silence is deafening.

**88.3%** of arrhythmia patients report moderate-to-severe anxiety. **71.1%** report depression. **1 in 5** symptomatic AFib patients has experienced suicidal ideation. An estimated 100 million people worldwide live with a cardiac rhythm disorder. Not one of them should have to fight it alone.

OneRhythm is the platform that should have existed before it needed to.

---

## The Problem We Are Building Against

Arrhythmia is a bidirectional disease. The heart dysregulates the mind. The mind dysregulates the heart. The autonomic nervous system is the shared mechanism — and the healthcare system is treating only half of it.

Mental health screening is not standard practice in most electrophysiology clinics. Psychological distress is not routinely measured alongside heart rhythm. Patients are sent home with medication and monitoring instructions, and the invisible toll — the anxiety, the PTSD, the suicidal ideation — goes unnamed, unscreened, and untreated.

The clinical evidence for this gap is overwhelming. The human cost is measurable. And the treatment gap is unconscionable.

We are losing people who feel isolated and believe that nobody understands. OneRhythm exists to make sure that is no longer true.

---

## What OneRhythm Is

OneRhythm is an educational resource and community platform. It is not a medical device. It does not diagnose, interpret ECGs, or recommend treatment.

What it does:

- **Connects** arrhythmia patients — AFib, PVCs, ARVC, SVT, VT, Long QT, ICD carriers, pacemaker patients — in a community built around shared experience and peer-reviewed truth
- **Educates** through curated, approved, disclaimed content at the intersection of arrhythmia and mental health — arming patients to advocate for themselves in their next cardiology appointment
- **Builds** the Heart Mosaic — a collective, growing visual artwork where de-identified ECG contributions become tiles in a shared artifact, making the invisible burden of arrhythmia visible in a way that no clinical chart ever could
- **Measures** a shared rhythm distance — because if the world's 52.55 million atrial fibrillation patients each contributed a single ECG strip, their combined rhythms would stretch more than 13,000 kilometers. Together, we are circling the Earth

**Privacy is not a feature. It is the architecture.** ECG uploads are de-identified and not retained beyond the processing session. Consent is explicit, granular, and revocable. The platform is open-source and fully auditable because asking vulnerable people to trust you with their most sensitive data is a privilege, not a right.

---

## The Heart Mosaic

The Heart Mosaic is the soul of OneRhythm.

Users contribute de-identified ECG images. Those images are transformed — on device, using non-biometric feature extraction — into unique visual tiles whose color, texture, and luminosity reflect the character of the rhythm, not its clinical content. The raw waveform never leaves the device. What arrives is art.

Those tiles assemble into a collective heart silhouette, visible to everyone, owned by no one, grown by every person who decides their heartbeat is worth sharing.

It is not diagnostic. It is artistic. It is a tangible, visible refusal of the isolation that arrhythmia imposes — proof, rendered in light and color, that no one is fighting this alone.

---

## The Invisible Bears

This platform was built by someone who fought his own invisible bear for ten years.

ARVC. Three million extra heartbeats a year. An ICD. Three shocks. Seven trips to the EP lab. Four RF ablations. A decade of performing normalcy while disintegrating internally. The healthcare system treated the rhythm and ignored the mind.

On December 9, 2024, an off-label Farapulse ablation at Pepin Heart Institute silenced the arrhythmia. The bear disappeared. And the sudden quiet made the obligation undeniable: build what should have existed before it was needed.

The Reddit post that preceded this platform — *"The Consequences of a Broken Heart"* — was shared nearly 150 times across arrhythmia communities. Every share was a hand raised in the dark: *me too*.

That is the founding data point. Not a survey. Not a market analysis. A community saying out loud, for the first time, that they had been carrying something alone that was never meant to be carried alone.

OneRhythm is the answer to every one of those shares.

> *The calculus of fighting invisible bears is simple and brutal: you fight alone, or you find others who see the bear too.*
> — Matty, Bear Fighting Jedi

---

## Repository Status

Early development. The monorepo includes a working FastAPI backend, a Next.js frontend, trust-layer documentation, upload and privacy pipeline code, Research Pulse provenance flows, and account data controls. It is not launch-ready yet — the docs call out remaining partial implementations explicitly.

### What is implemented

- `apps/web` — Next.js app-router frontend: onboarding, educational content, Research Pulse, stories, public content, account data controls
- `apps/api` — FastAPI service: auth, profile, consent, upload sessions, educational guidance, Research Pulse, export, and delete flows
- `packages/ui` — Shared UI primitives including the persistent, non-dismissible medical disclaimer
- `packages/types` — Shared contracts and JSON schemas
- `docs/` — Public PRD, architecture notes, ADRs, evidence policy, privacy policy, and launch/trust checklists

### What is still in progress

- Upload cleanup runs in the request path; a dedicated scheduled worker for stale workspace sweeping is not yet implemented
- Export expiry metadata is recorded; automatic enforcement and artifact purge are not yet implemented
- Authenticated flows should be treated as experimental pending staged live-demo validation
- Research Pulse review is data- and service-complete; a maintainer-facing review UI is not yet built
- JavaScript-package lint coverage is partial; `build`, `typecheck`, and test suites are the stronger release gates
- Content Security Policy tightening is pending staged browser validation
- Third-party dependency license inventory is not yet automated

---

## Repository Layout

```
apps/
  api/        FastAPI backend
  web/        Next.js frontend
packages/
  config/     Shared workspace config
  types/      Shared contracts and schemas
  ui/         Shared components and tokens
docs/
  adr/        Architecture decision records
  architecture/
  brand/
  content/
  evidence/
  launch/
  privacy/
  prd/
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Python 3.11+

### Setup

```bash
git clone https://github.com/daftpixie/onerhythm.git
cd onerhythm
pnpm install
pnpm setup:api
```

### Run Locally

```bash
pnpm --filter @onerhythm/web dev
pnpm --filter @onerhythm/api dev
```

### Environment

- Start from `.env.example` for local development
- Use `.env.staging.example` and `.env.production.example` only as templates
- Local auth/CORS expects both `127.0.0.1:3001` and `localhost:3001`
- Production requires `AUTH_COOKIE_SECURE=true`

### Validation

Run the full repository checks before opening a release PR or pushing a launch candidate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm lint` currently provides full API compile coverage; JavaScript-package lint coverage is not fully scaffolded. Treat `build`, `typecheck`, and the web/API test suites as the stronger gates.

---

## Key Docs

- [Public PRD](docs/prd/README.md)
- [Architecture overview](docs/architecture/README.md)
- [Railway + Supabase first deployment](docs/launch/railway-supabase-first-deployment.md)
- [Privacy policies](docs/privacy/ecg-processing-policy.md)
- [Evidence policies](docs/evidence/approved-source-policy.md)
- [Trust readiness checklist](docs/launch/trust-readiness-checklist.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

---

## Product Boundary

This boundary is non-negotiable and reflected in every layer of the architecture:

- ECG uploads are used only for de-identification, artistic tile generation, contribution accounting, and related audit or transparency workflows
- Educational output must come from self-reported profile data and approved external sources — never from ECG interpretation
- Raw uploads must not persist beyond the processing session
- Educational surfaces must carry the persistent, non-dismissible medical disclaimer
- The platform must remain clearly and unambiguously non-diagnostic

---

## Open-Source Commitment

OneRhythm is MIT-licensed and open-source from day one — not because it is strategically advantageous, but because transparency is a moral obligation when asking vulnerable people to trust a platform with their most sensitive data.

The repository includes:

- MIT license
- Contribution, security, and code of conduct files
- Issue and pull request templates
- GitHub Actions for CI and release-bundle preparation
- ADRs and public architecture documentation

---

## Contributing

OneRhythm is built for the community it serves. Contributions from developers, researchers, clinicians, designers, and patients are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For security disclosures, see [SECURITY.md](SECURITY.md).

If you are contributing code that touches ECG processing, consent flows, or the medical disclaimer component, please review the [Trust Readiness Checklist](docs/launch/trust-readiness-checklist.md) first. This is not bureaucracy. It is how we protect the people who trust this platform.

---

## Crisis Resources

OneRhythm exists because people in this community are sometimes in crisis. If you or someone you know is struggling:

- **988 Suicide & Crisis Lifeline** — Call or text **988**
- **Crisis Text Line** — Text **HOME** to **741741**
- **NAMI Helpline** — 1-800-950-NAMI (6264)

---

## License

MIT. See [LICENSE](LICENSE).

---

*Built by Bear Fighting Jedi. Backed by peer-reviewed data. Open to everyone whose heart has a story to tell.*

*Ad Astra Per Aspera.*

*~80 million rhythms to circle the world. ~769 million to the MOON. To the stars? Ship it.*
