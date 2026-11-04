# OneRhythm — Text-Based Wireframes
### Web experience + App (iOS/Android) experience

**Companion to:** OneRhythm PRD v1.0

> **Read with later decisions (4 November 2026).** These wireframes predate ADR 0016 (landing copy, no open-books page) and ADR 0017 (the layered architecture and the two floors). Where they differ, the ADRs win. Member support is not open, nothing asks for money, and contributions are not tax-deductible. The wording below says "member support", never "donation".
**Legend:** `[ Button ]` · `( ) radio` · `[ ] checkbox` · `▸` expandable · `♥ Upbeat` (upvote-only) · `⚑` report · `✔ Verified` · `⟳` realtime-updating · `≡` menu · `🆘` always-on crisis/help affordance

> **Design constants applied on every screen (from PRD §9):** white background, body text ≥16–18px, legible humanist sans, contrast ≥4.5:1, primary tap/click targets 44px, visible focus ring, plain language (~8th-grade), no autoplay, no carousels, icon **+** text labels (never icon-only), 🆘 reachable from everywhere.

---

# PART A — Shared information architecture

```
                         ┌─────────────────────────┐
                         │       OneRhythm          │
                         └─────────────────────────┘
                                    │
   ┌───────────────┬───────────────┼───────────────┬───────────────┐
   │               │               │               │               │
 Home          Communities      Post/Share      Governance       Profile
 (feed)        (by diagnosis +   (compose)       (proposals,      (you, your
               caregiver +                        treasury,        journey page,
               general)                           ballots)         settings)
                                    │
                         ┌──────────┴──────────┐
                         │  Always present:    │
                         │  🆘 Help / Crisis    │
                         │  Search             │
                         └─────────────────────┘

WEB-ONLY surface:  Member support  (Stripe)
APP behavior:      NO in-app member-support UI — "Support us on the web" link opens browser
```

---

# PART B — WEB EXPERIENCE

Layout model: persistent **top bar** + **left sidebar nav** + **main column** (+ optional **right rail** for context). Responsive: below ~900px the sidebar collapses into the `≡` menu and the layout becomes single-column (approaching the app layout).

---

### B1. Logged-out landing

```
┌──────────────────────────────────────────────────────────────────────┐
│  OneRhythm                                  [ Log in ]  [ Join free ]  │  top bar
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│        You are not alone with your heart.                              │
│                                                                        │
│        A community for people living with arrhythmia —                 │
│        and the people who care for them.                               │
│                                                                        │
│        [  Join free — takes one minute  ]   ← 44px primary button      │
│                                                                        │
│        Already a member?  [ Log in ]                                   │
│                                                                        │
│   ──────────────────────────────────────────────────────────────      │
│                                                                        │
│   What this is:           What this is NOT:                            │
│   • Peer support          • Not medical advice                         │
│   • Diagnosis-based        • Not a place for diagnosis or ECG reading   │
│     communities           • Not affiliated with any provider           │
│   • Share your journey    • In an emergency, call your local           │
│   • Positive-only            emergency number                          │
│     ("upbeats")                                                        │
│                                                                        │
│   ──────────────────────────────────────────────────────────────      │
│   About · Privacy · Our promise on your data · Open source · 🆘 Help    │
└──────────────────────────────────────────────────────────────────────┘
```
**Notes:** No health claims, no fear-based copy. Crisis/help in footer AND as 🆘. Plain promise-on-data link is prominent (MHMDA standalone policy). No tracking pixels (PRD §11).

---

### B2. Sign-up / Log in (passwordless)

```
┌──────────────────────────────────────────────────────────────────────┐
│  OneRhythm                                                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│        Welcome. Let's get you in.                                      │
│                                                                        │
│        Email address                                                   │
│        ┌────────────────────────────────────────────┐                 │
│        │                                            │                 │
│        └────────────────────────────────────────────┘                 │
│                                                                        │
│        [  Send me a magic link  ]   ← no password to remember          │
│                                                                        │
│        We'll email you a link. Click it and you're in.                 │
│                                                                        │
│        ─────────────────  or  ─────────────────                        │
│        [  Continue with Apple  ]   [  Continue with Google  ]          │
│        (optional — your choice)                                        │
│                                                                        │
│        Prefer Face ID / fingerprint next time? You can set up a        │
│        passkey after you log in.                                       │
└──────────────────────────────────────────────────────────────────────┘

   After "Send magic link":
   ┌──────────────────────────────────────────────┐
   │  Check your email                             │
   │  We sent a link to  d•••@•••.com              │
   │  Click it on this device to continue.         │
   │  Didn't get it?  [ Resend ]  (enabled in 30s) │
   └──────────────────────────────────────────────┘
```
**Notes:** Satisfies WCAG 2.2 SC 3.3.8 (no memory/transcription test). Field allows paste + autofill; never `autocomplete=off`. Social login optional, never required.

---

### B3. Onboarding — role + optional health self-ID (explicit consent)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1 of 2 — Who are you here as?                                    │
├──────────────────────────────────────────────────────────────────────┤
│   ( ) I have an arrhythmia                                             │
│   ( ) I care for someone who does (caregiver)                          │
│   ( ) Both                                                             │
│   ( ) I'm a healthcare professional who wants to contribute            │
│       general educational content   ▸ (extra verification later)       │
│                                                                        │
│   [ Continue ]        [ Skip for now ]                                 │
├──────────────────────────────────────────────────────────────────────┤
│  Step 2 of 2 — Optional: tell us what you're dealing with              │
│                                                                        │
│   This is OPTIONAL and PRIVATE. It only helps us suggest               │
│   communities you might find useful. We never sell or share it.        │
│                                                                        │
│   [ ] Yes, I want to add this and join relevant communities            │
│       └─ (unchecked by default — explicit opt-in consent)              │
│                                                                        │
│      Diagnosis (choose any):                                           │
│        [ ] AFib   [ ] SVT   [ ] ARVC   [ ] Long QT                     │
│        [ ] VT     [ ] PVCs  [ ] Post-ablation  [ ] ICD recipient       │
│                                                                        │
│      How it affects you — physical (optional):                         │
│        [ ] Palpitations [ ] Fatigue [ ] Shortness of breath ...        │
│      How it affects you — emotional (optional):                        │
│        [ ] Anxiety [ ] Low mood [ ] Fear of episodes ...               │
│                                                                        │
│   [ Save & continue ]      [ Skip — I'll just browse ]                 │
│                                                                        │
│   🔒 Your promise-on-data, in plain words.  [ Read it ]                 │
└──────────────────────────────────────────────────────────────────────┘
```
**Notes:** Health self-ID is the single sensitive data category — separate, unchecked, explicit opt-in (PRD §7.1, research §1). User can fully participate without disclosing anything.

---

### B4. Home feed (logged in)

```
┌──────────────────────────────────────────────────────────────────────┐
│ OneRhythm   [ 🔍 Search                    ]        🆘 Help   ◯ You ▾   │ top bar
├───────────────┬────────────────────────────────────────────────────────┤
│ ≡ NAV         │  Your feed                                   ⟳ live     │
│               │                                                          │
│ ⌂ Home        │  ┌────────────────────────────────────────────────────┐ │
│ ◇ Communities │  │ in r/AFib · by Marcus · 2h                          │ │
│   • AFib      │  │ "First week with my new pacemaker — what I wish     │ │
│   • ARVC      │  │  I'd known"                                         │ │
│   • Caregivers│  │  ♥ 34 Upbeats   💬 12 replies     ⚑                  │ │
│   • General   │  └────────────────────────────────────────────────────┘ │
│ ◷ Governance  │  ┌────────────────────────────────────────────────────┐ │
│ ☆ Discover    │  │ in r/Caregivers · by Rosa · 5h                      │ │
│ ⓘ About       │  │ "How do you handle the fear when they sleep?"       │ │
│               │  │  ♥ 51 Upbeats   💬 28 replies     ⚑                  │ │
│ ───────────   │  └────────────────────────────────────────────────────┘ │
│ [ ♥ Support ] │  ┌────────────────────────────────────────────────────┐ │
│ (web only)    │  │ ✔ Dr. Lee (verified) · educational · 1d             │ │
│               │  │ "What an ablation actually is — general overview"   │ │
│               │  │  ⓘ General education. Not medical advice.           │ │
│               │  │  ♥ 88 Upbeats   💬 9 replies      ⚑                  │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │                                                          │
│               │  [ + Share something ]                                   │
└───────────────┴────────────────────────────────────────────────────────┘
```
**Notes:** One upbeat control per item, count only, **no downvote exists**. Professional posts carry a persistent disclaimer band. `⟳` = Supabase Realtime Broadcast. Member-support button is sidebar, **web only**.

---

### B5. Community view (thread list)

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ≡ NAV         │  r/AFib  ·  4,210 members                  [ Join ]      │
│  ...          │  Atrial fibrillation — living with it, together.         │
│               │  Guidelines ▸   Moderators: Sam, Priya ▸                  │
│               │ ─────────────────────────────────────────────────────    │
│               │  Sort: ( ) Newest  (•) Most upbeats  ( ) Active           │
│               │                                                          │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ "Caffeine and AFib — your real experiences?"        │ │
│               │  │  by Dana · 3h · ♥ 22 · 💬 40                  ⚑      │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ "Anyone else terrified before a cardioversion?"     │ │
│               │  │  by Marcus · 6h · ♥ 47 · 💬 19               ⚑      │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  [ + New post in r/AFib ]                                │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

### B6. Thread detail (post + threaded comments + upbeats)

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ≡ NAV         │  ← r/AFib                                                │
│               │  "Anyone else terrified before a cardioversion?"         │
│               │  by Marcus · 6h                                ⚑ report  │
│               │                                                          │
│               │  I have mine scheduled Thursday and I can't stop...      │
│               │                                                          │
│               │   [ ♥ Upbeat · 47 ]      [ 💬 Reply ]                     │
│               │ ─────────────────────────────────────────────────────    │
│               │  ▸ Rosa · 5h                                             │
│               │     "The waiting is the hardest part. What helped me..." │
│               │      [ ♥ Upbeat · 12 ]   [ Reply ]              ⚑        │
│               │        ▸ Marcus · 4h (reply)                             │
│               │           "Thank you. I needed to hear that."            │
│               │            [ ♥ Upbeat · 5 ]  [ Reply ]         ⚑        │
│               │  ▸ ✔ Dr. Lee (verified) · 3h                             │
│               │     "Speaking generally, not about your case: ..."       │
│               │      ⓘ General education. Not medical advice.            │
│               │      [ ♥ Upbeat · 20 ]   [ Reply ]              ⚑        │
│               │                                                          │
│               │  ┌──── Write a reply ──────────────────────────────┐    │
│               │  │                                                  │    │
│               │  └──────────────────────────────────────────────────┘   │
│               │  [ Post reply ]                                          │
└───────────────┴────────────────────────────────────────────────────────┘
```
**Notes:** Threading via self-referential comments. Every node has its own upbeat + report. Verified-professional replies always wear the disclaimer.

---

### B7. Journey page (member profile blog)

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ≡ NAV         │  Marcus's Journey                          [ Follow ]    │
│               │  Member since 2025 · r/AFib, r/ICD                       │
│               │ ─────────────────────────────────────────────────────    │
│               │  ▌ "Five years, three ablations, one steady heart"       │
│               │  ▌ Published Apr 2026 · ♥ 210                            │
│               │  ▌ When I was first diagnosed I thought my life was...    │
│               │  ▌ [ Read full entry ]                                    │
│               │                                                          │
│               │  ▌ "What my ICD taught me about fear"                     │
│               │  ▌ Published Mar 2026 · ♥ 156                            │
│               │ ─────────────────────────────────────────────────────    │
│               │  (Your own page) [ + Write a journey entry ]             │
│               │                  [ Manage / delete entries ]             │
└───────────────┴────────────────────────────────────────────────────────┘
```
**Notes:** Member-owned, fully deletable. Public pages are shareable but never expose private health-gated content (research §8).

---

### B8. Governance hub (proposals + tiers)

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ≡ NAV         │  Governance — you have a real say here.                  │
│ ◷ Governance  │  How this works ▸ (3 tiers, plain-language explainer)    │
│               │                                                          │
│               │  Open for your vote:                                     │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ FEATURE · "Add a 'panic/anxiety' quick-support     │ │
│               │  │ button to every screen"                            │ │
│               │  │ Closes in 3 days · 312 of 900 eligible voted       │ │
│               │  │ Quorum: ✔ reached     [ Read & vote ]              │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ FUNDS · "Spend $1,200 of the community budget to   │ │
│               │  │ translate caregiver resources into Spanish"        │ │
│               │  │ Closes in 6 days · 88 of 900 voted                 │ │
│               │  │ Quorum: ◔ not yet     [ Read & vote ]              │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────────────────┐ │
│               │  │ MODERATOR ELECTION · r/ARVC needs a steward        │ │
│               │  │ 2 candidates · [ Read & vote ]                     │ │
│               │  └────────────────────────────────────────────────────┘ │
│               │                                                          │
│               │  [ + Propose something ]   [ View treasury ]            │
│               │  [ See past results ]      [ The safety floor ▸ ]       │
│               │                                                          │
│               │  ⓘ Some things are never put to a vote — see the        │
│               │     Safety Floor (e.g., dangerous medical claims).       │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

### B9. Proposal detail + ballot

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ◷ Governance  │  ← Governance                                            │
│               │  FUNDS (Tier 2 · participatory budget)                   │
│               │  "Translate caregiver resources into Spanish — $1,200"   │
│               │                                                          │
│               │  Plain summary: Pay a translator from the community      │
│               │  budget so Spanish-speaking caregivers can use our       │
│               │  guides. Cost: $1,200 of the $4,000 discretionary pool.  │
│               │                                                          │
│               │  Discussion (24) ▸                                       │
│               │ ─────────────────────────────────────────────────────    │
│               │  Your vote (one equal vote · you're eligible ✔):         │
│               │     ( ) Yes, fund it                                     │
│               │     ( ) No                                               │
│               │     ( ) Abstain                                          │
│               │     [ Cast my vote ]                                     │
│               │                                                          │
│               │  Live tally ⟳:  Yes 71% · No 22% · Abstain 7%           │
│               │  Quorum: 88/900 — needs 90 to be binding                 │
│               │  Closes: 6 days                                          │
│               │                                                          │
│               │  ⓘ If passed, the entity executes it unless it's         │
│               │     illegal/unsafe/reckless — and any override is        │
│               │     posted here with a reason.                           │
└───────────────┴────────────────────────────────────────────────────────┘
```
**Notes:** One-equal-vote enforced at DB (`unique(proposal_id, voter_id)`). Eligibility gate shown. Conflict-of-interest proposals hide the vote control for the conflicted member. Plain-language summary required.

---

### B10. Treasury / transparency dashboard

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ◷ Governance  │  Treasury — every dollar, in the open.                   │
│               │                                                          │
│               │  This month        In: $3,410   Out: $980   Net: $2,430 │
│               │                                                          │
│               │  Where it goes:                                          │
│               │   Infrastructure (required) ........ $190                │
│               │   Legal / compliance (required) .... $400                │
│               │   Moderator stipends ............... $390                │
│               │   ─────────────────────────────────                      │
│               │   Community-directed budget ........ $4,000  ← you vote   │
│               │                                                          │
│               │  Funded by your votes (history):                         │
│               │   ✔ Spanish caregiver guides ....... $1,200 (Apr)        │
│               │   ✔ Anxiety-resource sponsorship ... $600  (Mar)         │
│               │                                                          │
│               │  Entity overrides: none this quarter.                    │
│               │  [ Download full ledger ]  [ Latest transparency report ]│
└───────────────┴────────────────────────────────────────────────────────┘
```

---

### B11. Member support  — **WEB ONLY**

```
┌───────────────┬────────────────────────────────────────────────────────┐
│ ≡ NAV         │  Support OneRhythm                                     │
│ [ ♥ Support ] │  We're supported by members, not advertisers. Your     │
│               │  money keeps this place free, private, and ad-free.    │
│               │                                                        │
│               │  ( ) $5/mo   (•) $10/mo   ( ) $25/mo   ( ) Other       │
│               │  [ ] Make it a one-time contribution instead           │
│               │                                                        │
│               │  [  Continue to secure checkout (Stripe)  ]            │
│               │                                                        │
│               │  • Members vote on part of the budget. Giving buys no  │
│               │    vote, and every member has one equal vote.          │
│               │  • We never connect your support to your health info.  │
│               │  • Cancel anytime in your member-support settings.     │
└───────────────┴────────────────────────────────────────────────────────┘
```
**Notes:** Stripe Checkout (PCI handled by Stripe). **This screen does not exist in the mobile apps** (Apple/Google policy, PRD §10).

---

### B12. Crisis / Help overlay (reachable from 🆘 everywhere)

```
   ┌──────────────────────────────────────────────┐
   │  🆘  Need help right now?                       │
   │                                                │
   │  If this is a medical emergency, call your     │
   │  local emergency number now.                   │
   │                                                │
   │  Feeling in crisis or unsafe?                  │
   │  [ See mental-health crisis resources ]        │
   │                                                │
   │  This community is peer support — not a        │
   │  substitute for professional care.             │
   │                          [ Close ]             │
   └──────────────────────────────────────────────┘
```
**Notes:** Region-aware resources. Surfaced automatically when self-harm signals are detected in content (routes to human review, never to a vote — PRD §6.4).

---

# PART C — APP EXPERIENCE (iOS / Android)

Layout model: minimal **top header** (screen title + 🆘 + search) + **bottom tab bar** (5 tabs) + **single column**. Same data, same rules, narrower canvas. **No member-support UI.**

---

### C1. Bottom tab bar (persistent)

```
┌────────────────────────────┐
│        (screen content)    │
│                            │
├────────────────────────────┤
│ ⌂      ◇      ✚      ◷    ☻ │
│Home  Comm.  Post  Gov.  Me │   ← labels always shown, 44px targets
└────────────────────────────┘
```

---

### C2. Logged-out / sign-in

```
┌────────────────────────────┐
│         OneRhythm          │
│                            │
│  You are not alone with    │
│  your heart.               │
│                            │
│  A community for people    │
│  with arrhythmia & their   │
│  caregivers.               │
│                            │
│  [   Join free   ]         │
│  [   Log in      ]         │
│                            │
│  Not medical advice. In an │
│  emergency, call your local│
│  emergency number.   🆘     │
└────────────────────────────┘

   Sign in:
┌────────────────────────────┐
│  Email                     │
│ ┌────────────────────────┐ │
│ └────────────────────────┘ │
│  [ Send me a magic link ]  │
│  ── or ──                  │
│  [  Continue with Apple ]  │
│  [  Continue with Google] │
│                            │
│  After login, turn on      │
│  Face ID / fingerprint?    │
└────────────────────────────┘
```
**Notes:** Magic link returns via **deep link** back into the app (universal links / app links). Passkey upgrade offered post-login (most accessible secure path on mobile).

---

### C3. Onboarding (same consent model, stacked)

```
┌────────────────────────────┐
│  Step 1 — I'm here as…      │
│  ( ) Someone with an        │
│      arrhythmia             │
│  ( ) A caregiver            │
│  ( ) Both                   │
│  ( ) A professional         │
│  [ Continue ] [ Skip ]      │
├────────────────────────────┤
│  Step 2 — Optional & private│
│  [ ] Add my diagnosis to    │
│      find communities       │
│      (off by default)       │
│   AFib  SVT  ARVC  LongQT   │
│   VT   PVCs  Post-ablation  │
│   ICD                       │
│   Physical: Palpitations…   │
│   Emotional: Anxiety…       │
│  [ Save ]   [ Skip ]        │
│  🔒 Our promise on your data │
└────────────────────────────┘
```

---

### C4. Home tab

```
┌────────────────────────────┐
│ Home        🔍   🆘          │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ r/AFib · Marcus · 2h   │ │
│ │ "First week with my    │ │
│ │  pacemaker…"           │ │
│ │ ♥ 34   💬 12      ⚑    │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ r/Caregivers · Rosa·5h │ │
│ │ "How do you handle the │ │
│ │  fear when they sleep?"│ │
│ │ ♥ 51   💬 28      ⚑    │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ ✔ Dr. Lee · educational│ │
│ │ ⓘ Not medical advice   │ │
│ │ ♥ 88   💬 9       ⚑    │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ ⌂   ◇   ✚   ◷   ☻          │
└────────────────────────────┘
```
**Notes:** Single tap = open thread. The ✚ tab is the primary "share" action (replaces the web's inline compose).

---

### C5. Communities tab

```
┌────────────────────────────┐
│ Communities      🔍  🆘     │
├────────────────────────────┤
│ Your communities           │
│  ◇ r/AFib          ⟳        │
│  ◇ r/ICD                    │
│  ◇ r/Caregivers             │
│ ──────────────────────────  │
│ Discover                    │
│  ◇ r/ARVC      [ Join ]     │
│  ◇ r/LongQT    [ Join ]     │
│  ◇ r/General   [ Join ]     │
│                            │
│  [ + Request a new          │
│      community ]            │
│    (goes to a community vote)│
├────────────────────────────┤
│ ⌂   ◇   ✚   ◷   ☻          │
└────────────────────────────┘
```

---

### C6. Thread detail

```
┌────────────────────────────┐
│ ← r/AFib              🆘    │
├────────────────────────────┤
│ "Anyone else terrified      │
│  before a cardioversion?"   │
│  Marcus · 6h         ⚑      │
│                            │
│  I have mine Thursday and   │
│  I can't stop thinking…     │
│                            │
│  [ ♥ Upbeat 47 ] [ 💬 Reply]│
│ ──────────────────────────  │
│  └ Rosa · 5h                │
│    "The waiting is the      │
│     hardest part…"          │
│     [ ♥ 12 ] [ Reply ]  ⚑  │
│     └ Marcus · 4h           │
│       "Thank you."          │
│       [ ♥ 5 ] [ Reply ] ⚑  │
│  └ ✔ Dr. Lee · 3h           │
│    ⓘ General education.     │
│    [ ♥ 20 ] [ Reply ]   ⚑  │
│                            │
│ ┌────────────────────────┐ │
│ │ Write a reply…         │ │
│ └────────────────────────┘ │
│ [ Post reply ]             │
├────────────────────────────┤
│ ⌂   ◇   ✚   ◷   ☻          │
└────────────────────────────┘
```

---

### C7. Post composer (✚ tab)

```
┌────────────────────────────┐
│ ✕   Share something    🆘   │
├────────────────────────────┤
│ Post to:                    │
│  [ r/AFib            ▾ ]    │
│                            │
│ Title                       │
│ ┌────────────────────────┐ │
│ └────────────────────────┘ │
│ Your message                │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ ⓘ Please don't share medical│
│   records or ECG images.    │
│   This is peer support.     │
│                            │
│ [        Post         ]     │
└────────────────────────────┘
```
**Notes:** Upload of document/medical-record-type files is **not offered** (data-minimization; PRD §8). Gentle reminder reinforces the boundary.

---

### C8. Governance tab

```
┌────────────────────────────┐
│ Governance            🆘    │
├────────────────────────────┤
│ How this works ▸            │
│                            │
│ Open for your vote:         │
│ ┌────────────────────────┐ │
│ │ FEATURE                │ │
│ │ "Panic/anxiety quick-  │ │
│ │  support button"       │ │
│ │ Closes 3d · quorum ✔   │ │
│ │ [ Read & vote ]        │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ FUNDS                  │ │
│ │ "$1,200 — Spanish      │ │
│ │  caregiver guides"     │ │
│ │ Closes 6d · quorum ◔   │ │
│ │ [ Read & vote ]        │ │
│ └────────────────────────┘ │
│                            │
│ [ + Propose ]              │
│ [ Treasury ] [ Past votes ]│
│ [ Safety floor ▸ ]         │
├────────────────────────────┤
│ ⌂   ◇   ✚   ◷   ☻          │
└────────────────────────────┘
```

```
   Ballot (tap "Read & vote"):
┌────────────────────────────┐
│ ← FUNDS · Tier 2            │
│ "$1,200 Spanish guides"     │
│                            │
│ Plain summary: pay a        │
│ translator from the         │
│ community budget…           │
│                            │
│ Your vote (1 equal vote ✔): │
│  ( ) Yes, fund it           │
│  ( ) No                     │
│  ( ) Abstain                │
│  [ Cast my vote ]           │
│                            │
│ Live ⟳ Yes 71/No 22/Abs 7   │
│ Quorum 88/90 needed         │
└────────────────────────────┘
```

---

### C9. Profile / "Me" tab  (note the member-support link-out)

```
┌────────────────────────────┐
│ Me                    🆘    │
├────────────────────────────┤
│  ☻  Marcus                  │
│     Patient · r/AFib, r/ICD │
│                            │
│  [ My journey page ]        │
│  [ + Write a journey entry ]│
│  [ My posts & upbeats ]     │
│ ──────────────────────────  │
│  Settings                   │
│  [ Diagnosis & privacy ]    │
│  [ Notifications ]          │
│  [ Download my data ]       │
│  [ Delete my account ]      │
│ ──────────────────────────  │
│  ♥ Support OneRhythm        │
│  We're member-funded. You   │
│  can support us on our      │
│  website.                   │
│  [ Open onerhythm.org ↗ ]   │  ← opens browser; NO in-app payment
│ ──────────────────────────  │
│  About · Privacy · Open src │
├────────────────────────────┤
│ ⌂   ◇   ✚   ◷   ☻          │
└────────────────────────────┘
```
**Notes:** "Download my data" and "Delete my account" are first-class (MHMDA/CCPA/GDPR rights). Support is an **external link** only — no in-app purchase UI (Apple §3.2.1 / Google policy).

---

# PART D — Web vs. App: the differences that matter

| Concern | Web | App (iOS/Android) |
|---|---|---|
| **Primary nav** | Top bar + left sidebar | Bottom 5-tab bar |
| **Layout** | Multi-column, optional right rail | Single column |
| **Compose** | Inline "+ Share" + sidebar | Dedicated ✚ tab |
| **Member support** | Full Stripe Checkout on-platform | **None in-app**; link out to web |
| **Auth return** | Magic link opens in browser tab | Magic link **deep-links** back into app |
| **Biometrics** | Passkey (WebAuthn) optional | Face ID / fingerprint passkey, prominent |
| **Crisis 🆘** | Top bar + footer + auto-surface | Header on every screen + auto-surface |
| **Realtime ⟳** | Broadcast over WebSocket | Same; graceful fallback to fetch on drop |
| **Responsive overlap** | Collapses toward app layout <900px | n/a |
| **Updates** | Standard web deploy (Cloudflare Pages) | EAS Update for JS hotfixes; store review for native changes |

---

# Shared component inventory (build once, render both)
- `MagicLinkAuth` · `RoleConsentForm` · `HealthSelfIdConsent` (opt-in)
- `CommunityList` · `ThreadList` · `ThreadDetail` · `CommentTree`
- `UpbeatButton` (upvote-only; no downvote state) · `ReportFlag`
- `ProfessionalDisclaimerBand` · `VerifiedBadge`
- `JourneyEditor` · `JourneyView`
- `ProposalCard` · `Ballot` (one-equal-vote) · `TreasuryDashboard` · `TransparencyReport`
- `CrisisHelpSheet` (🆘) · `SafetyFloorNotice`
- `MemberSupportFlow` **(web target only — excluded from native bundle)**

> Every component ships against the WCAG 2.2 AA token set and is covered by the `a11y-reviewer` subagent and the `axe` CI hook before merge (PRD §14).
