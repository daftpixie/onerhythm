# OneRhythm — Vision

**We are OneRhythm. Open by design.**

Version 0.3 · Draft for review · 4 November 2026 (v0.1: 27 October 2026; v0.2, 3 November 2026: section 3 and the moderation and hosting status lines; v0.3, 4 November 2026: the license is decided, Apache-2.0, in sections 11, 12 and 15, by [ADR 0024](../adr/0024-apache-2-and-fresh-history-release.md)) · Decision record: [ADR 0017](../adr/0017-open-by-design-layered-architecture.md)

**Status:** [ADR 0017](../adr/0017-open-by-design-layered-architecture.md) was accepted by the founder on 28 October 2026, including its rules for changing a floor; where this document says "proposed in ADR 0017", read "decided in ADR 0017".

> **What this is.** A plan and a set of hypotheses, written down so that anyone can check them. It is not a promise, not a product, and not medical advice.
>
> We label things honestly:
>
> - **Built** — it exists in the code today.
> - **Planned** — we intend to build it.
> - **For partners** — only licensed partners would build and run it.
> - **Hypothesis** — we believe it, and we have not shown it yet.
>
> **If you are struggling right now:** in the US, call or text **988**. In an emergency, call your local emergency number. Outside the US, your local crisis line can help.

---

## The short version

- OneRhythm is a peer-support community for people living with any heart-rhythm condition, and for the people who care for them.
- Support today is split by diagnosis. AFib has its groups. PVCs have theirs. So do SVT, VT, long QT, ARVC, and people living with a defibrillator. Those spaces matter. But the fear, the poor sleep, the isolation and the long wait between appointments show up across all of them. We call that time **the interval**. OneRhythm is built for it.
- We are building an **open core** that anyone can inspect and deploy: a safe, accessible community; a private **Visit Prep** journal that helps people bring better questions to their clinicians; and the safety tools that have to come first.
- Around that core we will publish **open standards** that partners can carry out: trained peer coaches, live group sessions, and a way for a member to hand their notes to a clinician.
- **Licensed partners** — health systems, clinics and others — can extend it into care we cannot and should not provide ourselves: therapy, links to health records, and clinical follow-up between visits.
- We believe this can ease distress, improve quality of life, and in time reduce avoidable emergency visits and costs. Those are **hypotheses**. The strongest evidence today comes from programs where a clinical team responds to what patients report. So we attach those claims to the layer that has a responder, and we have written down what would prove us wrong.
- This is not a story about a founder or about funding. We are publishing openly so that people and organizations with the capacity to carry this further can pick it up, check it, and run it — in their own communities, under their own licenses, across borders.

---

## 1. We are OneRhythm

We are building a place for people living with heart-rhythm conditions, for the people who love them, and for the people who treat them.

Heart-rhythm problems can be treated. Medicines, procedures and devices help a great many people, and some people get their lives back. Nothing here argues against that.

But a heart-rhythm condition is not only an electrical problem. It can bring fear of the next episode. Trouble sleeping. Worry about a device. A sense that nobody around you understands. Most of that is lived between appointments, when the care team is out of reach.

Those burdens can be eased too. In our experience, they get far less attention than the rhythm itself. The major heart societies now say the mind belongs in heart care: the American Heart Association in 2021 [[1]](#ref-1), and the European Society of Cardiology in its 2025 consensus statement on mental health and heart disease [[2]](#ref-2). The ESC's 2023 cardiomyopathy guideline recommends offering psychological support to people with an inherited cardiomyopathy who receive a defibrillator [[3]](#ref-3).

> "Arrhythmia absolutely is a modifiable burden — my case is living proof. But so is isolation — and it is work that is largely unaddressed — relative to procedural or medication intervention itself."
>
> "… it is ensuring that people feel held and understood in the time between — the interval — that is what OneRhythm is for."
>
> — Matthew J Adams, founder, 25 September 2026

That is one person's testimony. It is the reason OneRhythm exists. It is not proof that OneRhythm works. The rest of this document says how we plan to find out.

### 1.1 Many rhythms, one community

Support today is mostly organized by diagnosis. There are groups for AFib, PVCs, SVT, VT, long QT, ARVC, people with defibrillators, and life after an ablation. Those groups matter. Talking with someone who has your exact condition is a comfort nothing else gives.

What gets missed is what these conditions share. Fear of the next episode. Sleep that never quite settles. Feeling watched by your own heart. Feeling alone with it. Those experiences cross every diagnosis.

> "… each of these different types of arrhythmias can have a psychological effect which we all share in common — thus OneRhythm."
>
> — Matthew J Adams, 27 October 2026

So OneRhythm keeps a room for each diagnosis, and adds shared rooms for the experiences everyone has in common. Caregivers get rooms of their own, and a full place everywhere else.

We have not measured how fragmented support is today. We believe it, and we will test it (hypothesis H3, section 9).

### 1.2 Who it is for

We test every decision against one person: someone 65 or older, on an older phone or computer, with reduced vision or a less steady hand, who is not confident with technology. If a feature leaves that person out, it loses, however good it looks.

OneRhythm is also for:

- the person diagnosed this week, frightened and searching at two in the morning;
- the person years into it, living with a device, who wants to help others;
- the caregiver, who carries fear and logistics that nobody acknowledges — a full member, never a spectator;
- the clinician who wants to share general education without practicing medicine on the platform;
- the members who step up to moderate and steward the community.

---

## 2. What we believe

**The interval matters.** Most of life with a heart-rhythm condition happens between appointments. We build for that time.

**Safety, then access, then privacy.** When these pull against each other, that is the order. Governance, sustainability and polish come after.

**No price of belonging.** No device, questionnaire, or diagnosis will ever be the price of belonging. Neither will AI. Sharing a diagnosis is always optional.

**Medical judgment stays with you and your clinician.** OneRhythm does not diagnose, read ECGs, or give anyone individual medical advice. Clinicians who join may share general education with everyone. They may not advise one person about one heart. That line does not move.

**Pain is not a competition.** We never rank suffering. Feedback is positive only: members can give an "upbeat." There is no downvote anywhere — not hidden, not disabled, none.

**Missing is not zero.** If someone stops writing in their journal, that tells us nothing on its own. They may be doing well. They may be struggling. We never read meaning into silence [[4]](#ref-4).

**Your data is yours.** We collect as little as we can. We never sell it. We never put advertising or tracking code on any health page or signed-in page. Consent is recorded and can be withdrawn. Deleting removes your data from the live service right away; copies in backups will age out on a schedule we will publish before launch. Anything you printed, saved or shared stays outside our reach.

**Open by design.** We publish our code and our decisions, and we will publish our books once money moves. Anyone can check our work.

**People in the loop.**

> "Consequential machine judgment should be governed through cross-domain expertise together with meaningful representation from the people who bear its consequences."
>
> — Matthew J Adams

Members will help decide where OneRhythm goes, within safety and privacy floors that no vote can change (sections 8 and 12).

**Say what we know, and how we know it.**

> "What I witnessed is testimony. What a document establishes is evidence. What I infer must remain an inference. What I do not know must remain unknown."
>
> — Matthew J Adams

If we are wrong, we will say so where we said the rest.

---

## 3. Where we are today

OneRhythm is early. Here is what exists as of 3 November 2026.

**Built** (web first; only the landing page is set up to deploy):

- sign-in by email link, with no password to remember;
- roles for patients, caregivers, professionals, moderators and administrators (elected stewards are *Planned*);
- gentle onboarding that never requires sharing health information;
- optional, separately consented health self-identification — diagnosis, physical-symptom and emotional-symptom tags — unchecked by default, with a versioned, append-only consent record;
- communities organized by diagnosis, with threads, comments and upbeats;
- journey pages, visible to signed-in members;
- privacy rights: download your data, see your consent history, and delete your account, with deletion that cascades through the database;
- a help button with crisis resources on every screen;
- **the moderation core:** reporting and blocking, automated triage, removal notices, appeals, the "Show" gate on posts about very hard feelings, muted words kept on the member's own device, and a moderator console. It is built and tested, and not yet in use: no moderators are appointed, and the review team is not set up;
- **a landing-only public build** of the landing page ([ADR 0023](../adr/0023-railway-landing-only-web-host.md)). It shows the landing page, the privacy notice, the contact page and help in another country, and nothing else. It never connects to a database, and it has no sign-up form. A Dockerfile and runbook for Railway are ready; the founder does the deploy.

**How it is checked.** 644 automated tests pass across the component and browser-renderer suites (run 3 November 2026). The landing build is also checked in its own mode, and its server image is built and checked in CI. Database rules — no downvote, consent gating, the full deletion cascade, the separation of marketing data from member data, and the moderation rules — are pinned in database tests that run in CI against a local database; they last passed on `main` on 30 October 2026. Seven commit guards block things that must never land, including a downvote, a third-party tracker on a health page, and a secret. Every significant decision is written down in [`docs/adr/`](../adr/).

**Not met yet.** The member platform must not be reachable in public. All of its launch gates ([ADR 0021](../adr/0021-appeals-and-launch-gates.md)) are recorded as unmet or deferred. The database tests (G8) pass in CI, but that gate is not yet marked met. The others are crisis response and review staffing (G1), the appeals panel (G2), oversight of context notes (G3), who moderates before elections (G4), the published floors (G5), legal review (G6), the manual screen-reader pass (G7), and the data inventory entries (G9, deferred). The hosted database is not set up, and the confirmation email for the updates list is not wired.

**Not built yet:** the public pages for the floors, the gates and the moderation log; context notes on health claims; community governance; member support payments; and mobile app releases. [`docs/PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md) lists every open gap.

---

## 4. The shape of the whole

OneRhythm has three layers. Each layer has a different owner, a different set of rules, and different things it is allowed to claim.

| | Layer 1: The core | Layer 2: Open standards | Layer 3: Clinical care |
|---|---|---|---|
| **What** | Community, safety floor and moderation, journey pages, Visit Prep, crisis help | Peer coach and session facilitator standard, live group sessions, handing notes to a clinician | Therapy, links to health records, clinical follow-up between visits |
| **Who builds it** | We do, in the open | We write the standard; partners carry it out | Licensed partners only |
| **Holds clinical records?** | No — and no deployment of the core may | No | Yes, in the partner's own separate systems, never in the core's database |
| **May claim** | Connection, access, preparation for visits | The above, plus trained support | Effects on symptoms, use of care and cost — once shown |
| **Status** | Built in part; the rest Planned | Planned | For partners |

Why three layers:

- **It lets the work cross borders.** Code travels freely. Licenses, privacy laws and medical rules do not. The core stays non-clinical so it can be deployed almost anywhere. Clinical duties sit with partners who are licensed where they work.
- **It keeps the core safe and simple.** The core never decides anything clinical. It cannot get a diagnosis wrong, because it never makes one.
- **It makes adoption cheaper.** A health system does not have to rebuild community, safety and accessibility. It can start from ours and add the care it already provides.
- **It keeps claims honest.** The strongest evidence for fewer emergency visits comes from programs where a clinical team responds to what patients report (section 7.3). So those claims belong to Layer 3, where a responder exists.

These plans keep the core's non-goals in the product requirements ([PRD §2.2](../prd/OneRhythm_PRD.md)): the core is still not telehealth, not a clinical record, and not an emergency service. One line there — that nothing clinical is ever stored — will be amended to describe the private journal honestly (section 5.4). Layers 2 and 3 describe what partners may build around it.

---

## 5. Layer 1 — The core

### 5.1 One house, many rooms — *Built in part*

- **Diagnosis rooms** (*Built*): AFib, SVT, PVCs, VT, ARVC, long QT, people with defibrillators, and life after an ablation.
- **Shared rooms** (*Planned*): organized by experience, not diagnosis — fear of episodes, sleep, living with a device, waiting for a procedure, after a procedure, the first weeks after a diagnosis.
- **Caregiver rooms** (*Planned*): for spouses, parents, adult children and friends.
- **Partner rooms** (*Planned*): an existing patient group can ask to open a room through the same new-community process as any other. Its moderators are chosen the way every room's moderators are. It runs under the same safety floor, and it gets no extra vote, seat or say in governance. We want to be a home for existing groups, not a rival to them.

Self-identifying a diagnosis can suggest rooms. It never locks anyone out of general spaces.

### 5.2 Safety first — *Built in part, and first in line*

Nothing else opens before this.

- **A safety floor** that no vote can change — *the text is written (ADR 0017); publishing it as pages is Planned (gate G5)*. It covers dangerous medical misinformation; reading anyone's ECG or diagnosis; self-harm and crisis — in community spaces, those posts go to trained humans and crisis resources, never to a vote; harassment; doxxing; impersonating a clinician; child sexual abuse material; scams; spam; and illegal content. It also holds two rules for AI features (section 8): the AI organizes and never interprets, and crisis help is one tap away on every screen. The floor is versioned, and every change to it is published with the reason. Nobody reviews private journals for crisis words, and no moderator or coach role can open one; there, the help button on every screen is the safety control.
- **Moderation tools:** report and block on every post, automated triage for spam, scams and crisis language, a human review queue, and appeals — *Built, not yet in use*; a public moderation log and short context notes — *Planned*. Context notes are short notes on borderline health claims, linking to trusted sources, used instead of quietly deleting posts. Non-safety decisions will be appealable to an elected panel (*Planned*, gate G2). Safety-floor decisions go to trained humans and are never put to a vote.
- **Care for moderators** — *Planned*: two people on hard cases, rotation away from distressing material, and paid lead moderators as the community grows. Paid leads enforce the safety floor; they do not replace the moderators members elect. A safety floor should not rest on volunteers alone.

Apple requires filtering, reporting and blocking for any app with user-generated content [[5]](#ref-5). That makes the moderation core a launch requirement for an iPhone app, and the right first step everywhere else.

### 5.3 Journey pages — *Built (members only)*

Members can write a long-form page about their own journey. Today it is visible to signed-in members only. Letting a member make their page public is a separate decision for later. If we make it, pages would be pseudonymous by default, public only by the member's explicit choice, entry by entry, and never indexed in a way that exposes health information the member did not choose to share.

### 5.4 Visit Prep — *Planned*

This is the feature at the center of what we want to build next.

**The problem it answers.** An appointment is short. A lot happens between appointments, across body and mind: palpitations, sleep, fear, memory, energy, mood, side effects, strain at home. By the time the visit comes, much of it is hard to remember and harder to say. Some of it feels risky to say at all.

**What it is.** A private journal that belongs to the member. They write in their own words — about their body, their mind, their sleep, their days — whenever they want. When a visit is coming, Visit Prep helps them turn their notes into a short summary and a list of questions to bring.

**How it works:**

- It is **off until the member turns it on**, under its own consent — unchecked by default and never required to belong. Withdrawing that consent stops new entries at once, offers an export, and then — once the member confirms — deletes the journal.
- It is **private by default.** No screen or role in OneRhythm lets a coach, moderator, other member or staff member open a journal. Entries are encrypted at rest, and operator access to the database is limited and logged. If the member turns on AI help, adds a caregiver, or makes a share link, the text they choose can be read by that service or person while it is used. An optional vault mode goes further: we cannot read the entries at all.
- It **works fully without AI.** Simple prompts and a printable template are always there.
- **AI help is optional, and a second, separate consent.** The consent says which company runs the AI; that only the entries the member picks are sent, and only when they press a button; and what that company keeps. The member sees what will be sent before it goes, and can turn AI help off at any time. When it is on, the AI organizes the member's own words into a summary and suggests ways to phrase questions.
- The AI **organizes; it never interprets.** It does not diagnose. It does not say whether a symptom comes from the heart or the mind. It does not score anything. It does not read meaning into days with no entries. It does not give medical advice. It is not a therapist or a companion.
- If a member writes words that suggest they may hurt themselves — from a published list of words and phrases — Visit Prep shows crisis resources straight away. This check runs on the member's device, or briefly in memory on our server and is never stored. It shows resources only and tells no one: no alert, no log, no score, no review. It does not try to counsel anyone. The help button stays on every screen whether or not this check triggers.
- Everything the AI produces is labeled: written by the member, organized by AI at their request, not reviewed by a clinician.
- A member may write about their health in their own words, so we treat the whole journal as health information. OneRhythm has no fields for diagnoses, medicines or test results, never imports them from a record, device or clinic, and asks members not to paste records in. Text that looks like a pasted record gets a warning and is left out of any AI request.
- **Sharing is always the member's action.** They can print it or save a PDF. Later, they will be able to share it as an expiring link or QR code that a clinic can open (Appendix A). The member picks how long it lasts and can switch it off at any time. A passcode is on by default. Anyone with the link — and the passcode — can read it until it expires, so it should be shared the way you would hand over paper.
- **Deletion.** A member can delete any entry, or the whole journal, at any time. It leaves the live service at once; backups age out on the published schedule.

**Why we drew the lines here.**

1. **Safety.** Telling one person what is driving their symptoms is diagnosis. It needs a clinician who can examine them and be accountable for the answer.
2. **Science.** Patterns found across groups of people often do not hold for any one person [[6]](#ref-6). A tool that guessed at one person's causes from population patterns would be wrong in ways nobody could see.
3. **Rules.** The US Food and Drug Administration has long said it does not intend to enforce device requirements on apps that help patients organize and track their health information, or document and communicate potential medical conditions to a health care provider [[7]](#ref-7). Software that diagnoses, or that analyzes a person's data to recommend treatment, is regulated as a medical device [[8]](#ref-8). Visit Prep is designed to stay on the first side of that line. A healthcare attorney must confirm this before it ships, along with state consumer health data laws and the Federal Trade Commission's Health Breach Notification Rule [[9]](#ref-9).

**What we will measure.** Whether members feel more able to take part in their care, whether they report better visits, and whether clinicians find the summaries useful — without making visits longer. A review of question prompt lists, a simpler cousin of this idea, found some evidence that they help patients ask more questions and get more information. Some lengthened visits, and effects on anxiety and satisfaction were not consistent [[10]](#ref-10). We will not claim that Visit Prep reduces emergency visits. On its own, it has no responder (section 9).

**Before it ships:** an amendment to the product requirements and to our data rules, because a private health journal is new for OneRhythm and our current rules say nothing clinical is stored at all ([ADR 0017](../adr/0017-open-by-design-layered-architecture.md) lists the rules that change); an attorney review; a written safety case with a hazard log; a published test suite and red-team results for the AI; and the advisory group's published check (section 8).

### 5.5 The action record — *Planned*

Asking people how they feel is not care. What matters is whether help reached them.

So the core will record three facts, only with the member's separate consent: that they joined a session; that they chose to share a Visit Prep summary (not with whom); and an optional "this helped." These belong to the member. They can see them, they are in the member's data export, and they are deleted with the account. We store only things that happened, never "did not." Nothing is sent to anyone automatically: a partner gets an event only when the member sends it, in a format partners' referral systems already understand [[11]](#ref-11). These facts are never used to ask for contributions, never joined to payment data, and never sent to analytics. The core never records clinical results.

### 5.6 Access for everyone

- **WCAG 2.2 AA** [[12]](#ref-12) is our release target, and missing it blocks a release in our own process. Automated tests check contrast and controls. A full manual screen-reader review is still outstanding and will be done before launch.
- Large, readable type (Atkinson Hyperlegible), a text label on every control, no autoplay, no carousels, no ambient motion.
- **Live sessions** will have captions — WCAG 2.2 requires captions for live audio — and a phone dial-in for people with weak internet or no smartphone (section 6.2).
- **Caregiver access** (*Planned*): a member can let a named caregiver read specific things — never everything by default. Access is read-only, ends unless renewed, shows the member each time it is used, and can be ended in one step. A caregiver can never change consents, turn on AI, share for the member, delete anything, or vote on the member's behalf. Each grant is recorded in the consent record. It is not available in vault mode.

This matters to partners too. Under the 2024 Section 504 rule, US health organizations that receive funding from the Department of Health and Human Services must make their websites and apps meet WCAG 2.1 AA [[13]](#ref-13). A platform built to a stricter target is easier to adopt.

### 5.7 Privacy and security

**Built:** data minimization; consent as a versioned ledger; health self-identification off by default; no advertising or tracking code on health or signed-in pages — a commit guard blocks known tracker domains in app and source code, and continuous integration repeats the check; data export and deletion from the live database; row-level security on every database table.

**Planned:** passkeys alongside email links; alerts when a new device signs in; encryption of journal entries at rest, with a separate key for each member held in a key service we operate; an optional vault mode where the key stays with the member and we cannot read entries (vault mode turns off AI help, share links we create, and caregiver access, and a lost key cannot be recovered — we will say that plainly at the moment of choice); a check on outbound calls from server code before any AI feature ships; a threat model and a data-protection impact assessment; deletion that reaches backups and every processor on a published schedule; a breach-response plan; and privacy-preserving reporting, with no published number small enough to identify anyone.

Health communities face particular risks: stalking and doxxing through personal stories, scams aimed at older members, and quiet leaks of health data to advertisers. US regulators have penalized health apps for that last one, including GoodRx [[14]](#ref-14) and BetterHelp [[15]](#ref-15) in 2023. Our no-tracker guard exists because trust lost that way does not come back.

---

## 6. Layer 2 — Open standards that partners carry out

### 6.1 Arrhythmia peer coaches and session facilitators — *Planned*

People living with arrhythmia sometimes need more than a forum. Sometimes they need one trained person who has been there, one to one or in a small group.

(Community moderators are different: members elect them, and the training below may be offered to them but is never a condition for standing for election.)

There is no credential for arrhythmia peer support today. We will not invent one alone. Our plan:

- Start from existing peer-support standards: SAMHSA's National Model Standards for Peer Support Certification [[16]](#ref-16) and existing state and national peer-specialist certifications.
- Add modules on arrhythmia and devices, written with clinicians and with people who live with these conditions: what an episode can feel like, life with a defibrillator, life after an ablation, the line between support and medical advice, and when and how to connect someone to care.
- Ask an independent credentialing body to hold the standard, so the people who write it are not the only people who check it.
- Require supervision, clear limits on the role, and a crisis pathway. A peer coach never diagnoses, never interprets symptoms, never advises on medication, and never manages a crisis alone.

Aligning with national standards matters for partners too. Medicare's Principal Illness Navigation–Peer Support codes (G0140 and G0146) let a billing practitioner's trained or certified staff provide peer support to patients with a high-risk behavioral health condition, after an initiating visit, with training consistent with the national model standards [[17]](#ref-17). OneRhythm cannot bill Medicare. A clinic partner, in the right circumstances, can.

One-to-one and group coaching will not launch until the credential exists and a partner is ready to supervise it.

### 6.2 The Hub — live group sessions — *Planned*

A shared schedule, visible to members, of regular live sessions led by trained facilitators: newly diagnosed, living with a device, caregivers, sleep, waiting for a procedure, and more.

- Two trained facilitators in every session, with a written crisis plan.
- Captions on every session, made by a speech service under contract (no training, no transcript kept) or by software we host ourselves. Members are told how captions work before they join.
- A phone dial-in and an audio-only option. OneRhythm does not store dial-in phone numbers; the telephone provider, a contracted processor, sees the caller's number, as with any phone call.
- Times shown in each member's own time zone. Reminders never name a condition or topic — just "Your session starts in 15 minutes."
- Sessions are never recorded.
- Screen-sharing and file-sharing are off for members, so medical documents cannot come in by the side door.
- Built on open-source video software — for example LiveKit or Jitsi, both licensed under Apache-2.0 [[18]](#ref-18) [[19]](#ref-19) — hosted by us or by the partner, never as a third-party embed.

Group therapy is different from peer support. It belongs to Layer 3.

### 6.3 Handing notes to a clinician — *Planned*

An open, documented way for a member to share their Visit Prep summary with any clinic, in a format a person can read and a health record system can accept (Appendix A). It sends only what the member chooses, only when they choose. OneRhythm receives nothing back.

---

## 7. Layer 3 — Clinical care that licensed partners deliver

OneRhythm itself will not do any of what follows. It is what the core makes easier for licensed partners to do.

### 7.1 Therapy with licensed clinicians — *For partners*

Cognitive behavioral therapy (CBT) can help people living with heart-rhythm conditions:

- In a Swedish trial of 127 people with symptomatic paroxysmal AF, a 10-week, therapist-guided internet CBT program improved AF-specific quality of life by 15.0 points on the AFEQT scale (95% CI 10.1 to 19.8) compared with AF education. Healthcare use fell by 56% (95% CI 22% to 90%). Measured AF burden did not change [[20]](#ref-20). It is one trial, run by an expert team, and it needs to be repeated elsewhere.
- In a Danish trial of 88 people with a defibrillator and anxiety, CBT delivered by trained nurses reduced anxiety compared with usual care [[21]](#ref-21).

A partner delivering therapy — one to one or in groups — takes on what therapy requires: licensure where the member lives (in the US, interstate compacts such as PSYPACT help for some professions), privacy obligations under HIPAA where they apply, agreements with every vendor that handles health information, malpractice cover, and a clinical crisis service. In the US, partners may be able to bill through behavioral health integration and collaborative care, including Medicare's new add-on codes for 2026 (G0568–G0570) for practices that provide advanced primary care management [[22]](#ref-22).

### 7.2 Links to health records — *For partners*

In time, a member's shared summary could flow into their clinic's record, and a clinic could offer OneRhythm from inside its own systems, using open standards such as SMART on FHIR, SMART Health Links, and the International Patient Summary for use across borders [[23]](#ref-23) [[24]](#ref-24). That integration belongs to the partner, under the partner's obligations, in the partner's own systems. The core never reads from a health record: no FHIR reads, no device or record import. Data leaves the core only when the member sends it.

### 7.3 Observation with a clinical response — *For partners*

This is where the strongest evidence lives.

- In a US trial of 766 people being treated for advanced cancer, reporting symptoms online between visits — with nurses alerted to act on them — led to fewer emergency visits (34% vs 41%) and better quality of life [[25]](#ref-25), and to longer median survival (31.2 vs 26.0 months) [[26]](#ref-26). Hospital stays were lower too (45% vs 49%), but that difference was not statistically significant.
- In a cluster-randomized trial in China of 3,324 people with AF, an integrated mobile care program lowered the combined rate of stroke or embolism, death and rehospitalization (1.9% vs 6.0%; hazard ratio 0.39, 95% CI 0.22 to 0.67) [[27]](#ref-27).
- In a Dutch trial of 712 people with AF, nurse-led integrated care lowered the combined rate of cardiovascular hospitalization and cardiovascular death (hazard ratio 0.65, 95% CI 0.45 to 0.93) [[28]](#ref-28).

Each of these had a clinical team that **responded**. None of them was a peer community. And integrated care does not work everywhere: a larger Dutch trial (RACE 4, 1,375 people) did not show that nurse-led care was as good as usual care overall, and results were worse in less experienced centers [[29]](#ref-29).

So the model we believe in for Layer 3 is a loop. A diagnosed member reports how they are doing. A responsible clinical team reviews it on an agreed schedule. The member has a plan, written with their clinician, for what to do and when to go in. Help is counted only when it actually reaches them. Noticing distress creates a duty to respond, so the response comes first.

### 7.4 The line the core never crosses

Some people hope that one day a tool could help a care team understand how symptoms across body and mind relate for one particular person. That is a real need. It is also diagnosis.

Any software that infers a person's state, flags distress, scores risk, or attributes symptoms to the heart or the mind belongs in Layer 3, built by a regulated manufacturer. It would need medical-device review in the US [[8]](#ref-8) and in Europe [[30]](#ref-30), evidence from proper studies, input from patients that can change or stop the product, and response pathways in place **before** anything is detected. Those are the manufacturer's duties, separate from OneRhythm's own advisory group (section 8). The OneRhythm core will not do it. (Two things are not inference: showing fixed crisis resources when listed words appear, as Visit Prep does, which estimates nothing, stores nothing and tells no one; and routing a community post that contains crisis language to a trained human so that a person can respond, which is moderation. Counsel will confirm both.)

---

## 8. AI in OneRhythm

We think AI can help people carry the interval, if it is kept in its place. Our rules:

1. **Optional, always.** No one needs AI to belong. AI features are off until a member turns them on, with separate consent for each purpose.
2. **It organizes. It does not interpret.** No diagnosis, no attribution of causes, no scores, no medical advice. Not therapy. Not a companion.
3. **Crisis help first.** Crisis help is one tap away on every screen. Where Visit Prep notices words or phrases on a published list, it shows crisis resources at once, without keeping them. That check is best-effort, and it never replaces the help button.
4. **Always disclosed.** Members always know when they are dealing with AI. The EU AI Act requires this for AI systems that interact with people [[31]](#ref-31), and California's companion-chatbot law sets disclosure and crisis-protocol duties [[32]](#ref-32). Visit Prep is not a companion chatbot, but we will meet that standard anyway.
5. **No training. As little kept as possible.** The AI provider works for us under a written contract, only on requests the member starts, and may not train on member content. We contract for zero data retention where a provider offers it. AI help stays off for any provider that will not agree to these terms: the gateway will not switch on a hosted provider until the operator records that its signed terms say so. (Models that run on the member's device or on the deployment's own servers are exempt.) Providers can still keep data where the law requires it or to investigate abuse; we will list what each one keeps. Before anything is sent, the gateway removes names and contact details, and leaves out anything that looks like a pasted record. Nothing from a journal is kept in AI memory, search indexes or logs. We log which model ran, never what was said.
6. **Any model.** A model-agnostic gateway lets each deployment choose its provider, including open-weight or on-device models where data must stay local. We plan to build the first adapter for Anthropic's Claude.
7. **Tested in the open.** We will publish the tests — suicide-related prompts, attempts to make the AI diagnose, flattery, manipulation through pasted text — and run them before every release.
8. **Shaped by the people it affects, within the floors.** Rules 2 and 3 join the safety floor, and the firm parts of rules 1, 4 and 5 join the privacy floor — both listed in full in section 12, published, versioned, and never up for a vote. The best-effort parts — removing names, leaving out text that looks like a record, and the crisis-word check — are published and tested under rule 7 instead, because a heuristic can miss. Members vote on which AI features to build and in what order, choosing only among features that meet the floors. An advisory group of people living with these conditions and people who care for them, with clinicians advising, checks each AI feature against published tests and reports, with reasons, whether it meets the floors; counsel checks the legal parts of the privacy floor. VT Infinite, Inc. decides whether a feature ships. It may not ship one it finds breaks a floor, and if it ever ships one against the group's finding, it says why in public. Whoever proposed a feature can ask for one re-review. After release, the group can ask for a pause if it sees harm; a pause has a time limit and a published reason, and VT Infinite, Inc. decides what happens next and says why. The group has no access to anyone's journal or AI conversations. It works from test results, made-up example conversations, and reports members choose to send; any excerpt in a report is the member's choice each time, kept to what is needed, and deleted after review. It has no say over budgets, rankings or elections.

Some US states now restrict AI in mental health care. Illinois, for example, bars AI from providing therapy, while leaving room, as we read it, for peer support and self-help materials [[33]](#ref-33). Visit Prep is designed as neither therapy nor treatment. Counsel will confirm that across the states and countries where OneRhythm runs.

What AI can do here is still being learned. The first randomized trial of a generative-AI therapy chatbot — 210 US adults, four weeks, compared with a waiting list — found average symptom reductions of 51% for depression and 31% for anxiety, with the research team reviewing conversations and ready to step in [[34]](#ref-34). That is promising, and it is early. It is one reason our AI organizes rather than counsels.

---

## 9. What we expect to change, and how we will know

### 9.1 What the evidence says today

**What supports the vision:**

- **Heart-rhythm conditions are common and costly.** More than 50 million people worldwide live with AF or atrial flutter (Global Burden of Disease 2021: 52.55 million, 95% uncertainty interval 43.14 to 64.96 million) [[35]](#ref-35). US emergency visits for AF rose about 31% from 2007 to 2014, from 411,406 to 537,801 [[36]](#ref-36). In 2014, the average cost of a US hospital stay with AF as the main diagnosis was $8,819 [[37]](#ref-37).
- **Distress is common, though studies disagree on how common.** A 2024 review of 26 studies of people with AF found depression in about 22% and anxiety in about 13%, with very large differences between studies and signs that published figures run high [[38]](#ref-38). Among nearly 40,000 people with defibrillators, about 23% had clinically relevant anxiety, 15% depression, and 12% post-traumatic stress [[39]](#ref-39). These numbers describe groups of people, not any one person.
- **Isolation is linked to heart disease.** In a meta-analysis of long-term studies from 16 datasets, loneliness and social isolation were associated with about 29% higher risk of coronary heart disease (relative risk 1.29, 95% CI 1.04 to 1.59) and 32% higher risk of stroke (1.32, 95% CI 1.04 to 1.68) [[40]](#ref-40) [[41]](#ref-41). In data on 5,270 adults over 65 in original Medicare (2006–2012), socially isolated older adults cost Medicare about $1,608 more a year each — an estimated $6.7 billion a year in total [[42]](#ref-42). These are associations, not proof that isolation causes the harm or the spending.
- **Response loops and therapy have worked elsewhere.** Programs with a clinical response loop have reduced emergency visits and hospital stays (section 7.3). In one Swedish trial, guided CBT improved quality of life and reduced healthcare use in AF (section 7.1).

**What argues for caution:**

- **Screening without a care pathway does not help.** In a US trial of 1,500 people after an acute coronary syndrome, screening for depression did not improve quality of life or depression [[43]](#ref-43). Asking without a way to respond is not care.
- **Peer support on its own has weak evidence on hard outcomes.** A meta-analysis of peer support for people with severe mental illness found little evidence of effects on hospital admissions or symptoms, and some evidence on hope, recovery and empowerment [[44]](#ref-44). An earlier review found no robust evidence for the health effects of online peer communities [[45]](#ref-45).
- **Most people stop using digital health tools** — what has been called the "law of attrition" [[46]](#ref-46). Any effect depends on people staying, so we have to measure that honestly.
- **Fewer emergency visits is not always good.** Palpitations are often not dangerous — and sometimes they are. In a US national sample of emergency visits for palpitations, 34% of diagnoses were cardiac and about a quarter of patients were admitted [[47]](#ref-47). In one study of 107 people later proven to have SVT, the condition went unrecognized at first in 55%. In more than half of those, symptoms had been put down to panic, anxiety or stress, and the median wait for the right diagnosis was 3.3 years [[48]](#ref-48). Anything that lowers emergency use must show it does not cause missed diagnoses.

### 9.2 Our hypotheses

Each hypothesis names the layer that would produce it, how we would measure it, and what would count against it.

| # | Hypothesis | Layer | How we would measure it | What would count against it |
|---|---|---|---|---|
| H1 | Members feel less alone and less afraid of their heart after six months | 1 | Loneliness and cardiac-anxiety scales, compared with a waiting-list group | No meaningful difference in an adequately sized study |
| H2 | Visit Prep helps members take part in their care, without longer visits | 1 | Patient activation, member-rated visit quality, clinician feedback, visit length | No change in activation or visit quality; longer visits |
| H3 | Shared rooms reach people whom single-diagnosis groups miss — caregivers, people with rarer conditions, people in no group at all | 1 | Who joins and who stays; a survey of members of existing groups | Members mostly duplicate existing groups; existing groups do not want it |
| H4 | For people already diagnosed, a clinical response loop reduces avoidable emergency visits without more missed problems | 3 | Emergency visits and hospital stays from partner records; safety events; missed diagnoses | No reduction, or a reduction that comes with more missed arrhythmias or harm |
| H5 | Guided CBT improves quality of life and is cost-effective at common thresholds | 3 | Disease-specific quality of life, EQ-5D utility, costs | Effects smaller than the break-even levels in Appendix C |
| H6 | In value-based contracts, enrolled populations cost the same or less in total | 3 | Total cost of care against a matched comparison group | Higher total cost once program costs are counted |

We will publish results, including results that do not support us.

How evaluation protects members: it uses its own opt-in research consent, separate from the product, with ethics review. Evaluation data is stored apart from member accounts and never joined to health self-ID tags, journals or payments. Reports to partners, health plans and funders are aggregate, with small groups suppressed. Linking to a partner's records happens inside the partner's systems, with the member's written consent; OneRhythm never sends identities.

### 9.3 Why the economics can work

For partners, the bar to be worth paying for is low. Appendix C shows the arithmetic and labels every assumption.

- **The core** costs well under a dollar per member per year in technology at moderate scale (section 13). Technology is not the constraint. People are: moderation, crisis response, facilitation, and evaluation.
- **A guided CBT program**, assumed to cost $500 per patient per year, would pay for itself if it prevented about one AF hospitalization for every 18 patients each year. At a threshold of $100,000 per quality-adjusted life year (QALY), it would be cost-effective if it added 0.005 QALYs per patient per year — about two days of full health. Effects the size of those in the Swedish CBT trial [[20]](#ref-20) look large enough to clear these bars. That still has to be shown: the trial measured healthcare use and AF-specific quality of life, not costs or utility directly.

Partners also need not wait for proof of savings to be paid for the care they deliver. In the US today:

- **Peer support** for high-risk behavioral health conditions can be billed by a practitioner through Principal Illness Navigation–Peer Support [[17]](#ref-17).
- **Behavioral health integration and collaborative care** can be billed, including new add-on codes for practices in advanced primary care management [[22]](#ref-22).
- **Value-based contracts** reward what this model aims at. CMS's new LEAD accountable care model starts on 1 January 2027, runs for ten years, and replaces ACO REACH [[49]](#ref-49).

Outside the US, the UK's National Institute for Health and Care Excellence (NICE) groups digital health tools by what they do and sets the evidence each group needs [[50]](#ref-50). Tools that inform and connect people need less evidence than tools that treat or diagnose. The core would likely sit on the lighter side of that line; clinical extensions would need more. National programs such as Germany's DiGA would apply only to a partner's certified clinical product.

### 9.4 What would prove us wrong

We will treat the vision as wrong, in whole or in part, if:

- members do not feel less alone, or do not stay;
- Visit Prep does not help members take part in their care, or clinicians find it a burden;
- existing groups and their members do not want a shared home;
- clinical response loops do not reduce avoidable emergency visits among diagnosed members in an adequately powered study — or reduce them only by missing real problems;
- quality-of-life gains fall below the break-even levels in Appendix C;
- AI features cause harm we cannot prevent. If they do, they come out.

---

## 10. Who might carry this, and why

We have no partnerships today. These are the kinds of organizations that could carry this work, and what each would need to see.

| Who | What they care about | What OneRhythm offers | What they will need to see |
|---|---|---|---|
| Health systems and heart-rhythm programs | Follow-up after ablations and device implants; patient experience; clinician time | A ready, accessible community and Visit Prep; a base to add their own care | Safety case, accessibility report, security review, fit with their workflow |
| Accountable care organizations and value-based groups | Total cost of care, unplanned admissions, follow-up | A low-cost support layer to pair with care management | A budget-impact model and a utilization study (H4, H6) |
| Health plans, including Medicare Advantage | Member experience, retention, quality ratings | Support that members value | Aggregate engagement and experience results, with small groups suppressed |
| Patient organizations | Their members' needs; their independence | A home for their community without building software | Governance, data protection, and a room of their own under the same safety floor and elections as every other |
| Device and drug makers | Patient support around procedures, devices and treatment | An independent community their patients can use | Strict independence: no data access; no sponsored rooms, posts or seats; no influence on content or governance; legal review of any support |
| Researchers and funders | Open questions about the heart and the mind | Open code, open protocols, a willing community | Ethics approval, data governance, protocols registered in advance |
| Health services outside the US | Access, cost, equity | A deployment they can run under their own laws | Local evidence and certification |

Money never buys a vote, a seat, a veto, or a place on the roadmap. We will publish every organization that funds us, by name, with the amount and any conditions. Individuals are counted, never named. Funding buys no access to member data, no influence over content, no say in what members vote on, and no seat on the advisory group or with whoever keeps the floors. If we ever thank supporters with a badge, it is recognition only.

---

## 11. What adopters get, and what we ask

**What exists now:** the code, the tests, the commit guards, the decision records, and the production checklist.

**What we will produce before or alongside publication** (*Planned*):

1. a reference deployment with the moderation core, setup scripts and runbooks — not just a code repository;
2. a threat model and a data-protection impact assessment;
3. a regulatory boundary memo prepared for counsel, starting from Appendix B;
4. a safety case for Visit Prep, with its hazard log and AI test results;
5. an accessibility conformance report for WCAG 2.2 AA;
6. an interoperability specification for sharing Visit Prep summaries;
7. a governance charter covering the safety and privacy floors and how they change; the advisory group for AI, including who writes the tests it uses and how it adds cases; who screens proposals against the floors before a ballot, with public reasons and a way to redraft; and how AI features are proposed, checked and paused;
8. an evaluation protocol and an economic model template, with every assumption labeled;
9. a draft peer-coach standard, prepared with a credentialing partner;
10. security basics for open-source software: a software bill of materials, signed releases, and a coordinated vulnerability disclosure policy;
11. a breach-response plan, covering notice to members and regulators and what each processor must tell us, and when.

**What we ask of anyone who runs OneRhythm.** The code is under the Apache License 2.0, so we can ask but not compel. The name policy below is how we will tie these commitments to the OneRhythm name:

- Keep the safety floor and the privacy floor (section 12). All of both.
- No advertising or tracking code on health or signed-in pages. Never sell member data.
- Keep crisis help on every screen.
- Keep governance honest: one equal vote per eligible member, never weighted by money, reputation or tenure; a published eligibility gate and quorum; conflicts of interest blocked; results public; no extra power for partners, sponsors or funders.
- Publish what you learn, including what did not work.
- Contribute improvements back where you can.

**The name.** Anyone may use the code. The OneRhythm name should mean these commitments are kept. We plan a short trademark policy, written with counsel, that lets a deployment use the name only if it keeps both floors and the commitments above. Decisions about the name will follow published criteria, come with reasons, and never depend on payment. The safety floor governs the OneRhythm community space. Clinical care that a licensed partner offers sits outside it, under that partner's own professional rules.

---

## 12. Governance and stewardship

Member governance is *Planned* — it is not built yet. Until voting opens, the founder sets priorities, and says so. The design, from the product requirements ([PRD §6](../prd/OneRhythm_PRD.md)):

- **One equal vote per eligible member** — never weighted by money, reputation or tenure. To vote, an account must pass a published gate based on account age and participation. It is a gate, not a weight.
- **What members decide:** feature priorities, community guidelines, moderator elections, new communities, and appeals of non-safety decisions.
- **Money members direct:** once there is money to direct, members vote on how the community-directed part of the budget is spent. VT Infinite, Inc. carries out the result unless it would be illegal, unsafe, financially reckless or a conflict of interest — and if it ever declines, it says so publicly, with the reason.
- **Fair counting:** results count only above a published quorum; voting windows are time-boxed; conflicts of interest are blocked in the database; results are public; ballots meet WCAG 2.2 AA.
- **Off-chain:** governance runs on ordinary, auditable, deletable records — no blockchain, no tokens.

**Never put to a vote.** Two floors sit outside every vote: the safety floor (section 5.2, from the product requirements, with two AI rules added in ADR 0017) and a privacy floor beside it (accepted in ADR 0017; added to the product requirements by Amendment 3). Both are written down and versioned; publishing them as pages is *Planned* (gate G5). The privacy floor, word for word as ADR 0017 states it:

1. Consent comes before any health data is used.
2. AI is optional and always disclosed.
3. No sale of health data.
4. No sharing of health data, except at the member's own request; with a processor that works only for us, with no use of its own, under contract; or where a valid legal order or reporting duty requires it.
5. Journal text goes to an AI provider only on a request the member starts.
6. No advertising or tracking code on health or signed-in pages.
7. No training on member content, no member content in logs or AI memory, and no hosted AI without a contract that says so.
8. The right to delete, except where a valid legal order or reporting duty requires data to be kept.
9. Disclosures and holds under legal orders or reporting duties are counted in a public report, as far as the law allows.

One item has been added since, as a tightening announced on 28 October 2026 with its reason ([ADR 0018](../adr/0018-founder-decisions-2026-10-28.md)). ADR 0017's list above stays as its historical record.

10. Live sessions are never recorded.

That means no audio, video or transcript is kept, by us or by any processor; captions are live and not stored. The reason: people say vulnerable things in a live group, and a recording that does not exist cannot leak, be subpoenaed or be misused.

**When the floors pull against each other.** In a community space, the order in section 2 decides the case — safety, then access, then privacy — and the decision is published with its reason. Such a ruling covers only that case. It can never authorize opening a private journal or vault entry, and any lasting change goes through the rule for changing a floor.

**Changing a floor** (decided in ADR 0017). Only VT Infinite, Inc. — or a future steward, under the same rule — can change a floor. In an emergency a floor can be tightened at once. Otherwise every change is announced with its reason first. Loosening a floor waits a published notice period, needs a new decision record and legal review, and is never put to a vote. A loosened privacy item applies only to data collected afterward, and only with fresh opt-in recorded in the consent ledger. Each item says what harm or law it answers to, and any member can ask for that reason to be re-examined in public.

**An advisory group for AI** (*Planned*). A safety check, not a second vote (section 8, rule 8). It includes people living with these conditions and people who care for them, with clinicians advising. Seats are filled by lot or by equal-vote election — that choice is still open — count equally, and cannot be bought, sponsored, or held by anyone with a financial or institutional stake in what is being reviewed; stakes are declared and checked. No one has to share a diagnosis to serve. The group has no access to members' journals or AI conversations; excerpts reach it only in reports members choose to send, kept to what is needed and deleted after review. Until member voting opens, the first group is chosen by the founder and works under the same rules, including the duty to give public reasons; it is replaced once members can choose how seats are filled.

**Who runs it.** OneRhythm is an initiative of VT Infinite, Inc., a Delaware corporation. It is not a charity and not a 501(c)(3). Money members give is called member support, or a contribution, and it is not tax-deductible.

**Why open.**

> "… this is less a story of a founder or funding and more of a story about helping others become found."
>
> — Matthew J Adams, 27 October 2026

We are publishing openly so that organizations with the reach and the licenses to carry this further can do so. A project with one maintainer is fragile. Over time, we want a steward that is not one person — a foundation, a fiscal sponsor, or a partner institution. That choice is still open (section 15). Whoever the steward is, member contributions stay not tax-deductible unless counsel advises otherwise and a new decision record replaces [ADR 0007](../adr/0007-entity-pbc-and-transparency-posture.md).

**License.** Decided: the code is under the Apache License 2.0 ([ADR 0024](../adr/0024-apache-2-and-fresh-history-release.md)). It includes an explicit patent grant (section 3), which some partners' lawyers prefer, and it grants no rights to the OneRhythm name or mark (section 6), which fits the name policy above. Nothing was published under the earlier license, because the repository was private until the first public release.

---

## 13. What it costs to run

Technology is cheap. People are not.

Indicative monthly technology costs for the core, using list prices checked on 27 October 2026 and the assumptions below the table:

| Registered members | Active each month (assumed 30%) | Database and sign-in hosting | AI for Visit Prep (assumed 20% of active members opt in) |
|---|---|---|---|
| 10,000 | 3,000 | About $25, plus compute | About $35 with a mid-size model, or under $2 with a small one |
| 100,000 | 30,000 | About $25, plus compute | About $350, or about $17 |
| 1,000,000 | 300,000 | About $675, plus larger compute | About $3,500, or about $175 |

Assumptions: hosting uses Supabase's Pro plan, which costs $25 a month including 100,000 monthly active users, then $0.00325 for each additional one [[51]](#ref-51). Each AI user makes four "organize" requests a month (about 2,000 input and 500 output tokens each) and one visit summary (about 6,000 input and 1,000 output tokens). Prices are Anthropic's list prices for Claude Sonnet 5.5 ($2 per million input tokens, $10 per million output tokens) and Claude Haiku 5.5 ($0.10 and $0.50 for prompts up to 100,000 tokens) [[52]](#ref-52). That works out to about 6 cents, or about 0.3 cents, per AI user per month. Email, storage, larger database compute, video and captions are extra. Captions are priced per audio-minute by several vendors and belong in each session's budget.

What the table leaves out is most of the cost: moderators, crisis response, facilitators, engineers, security reviews and evaluation. We have no sourced figure for those, so we do not invent one. Any partner should budget for them first.

Above about a million members, a single shared deployment stops making sense. The model is many deployments — by region, by country, or by partner — each under its own laws (Appendix A).

---

## 14. The path: gates, not dates

We will not put dates on this. Each stage opens only when its gate is met. These stages sit alongside the phases in the product requirements ([PRD §15](../prd/OneRhythm_PRD.md)); they do not replace them.

**Done — Phase 1.** The web MVP described in section 3.

**Stage 1 — Open the door.**

- Correct the remaining public copy about the company's legal status, then publish the code.
- Put the landing page live. It holds no member data.
- Build the moderation core and publish the safety floor.
- Complete a manual screen-reader review.
- Engage a healthcare-privacy attorney for the member platform.
- Produce the first artifacts from section 11: the reference deployment, threat model, accessibility report and governance charter.

*Gate:* attorney review complete; a standalone consumer health data privacy policy published (Washington's law requires one); a written, tested position on how long backups keep deleted data; a decision on which countries to open in; moderation core live; screen-reader review passed.

**Stage 2 — The interval.**

- Open the member platform.
- Build member voting (PRD Phase 3), so members — not the founder — set priorities.
- Amend PRD §6 for the advisory group and the floors, then seat the first advisory group for AI: chosen by the founder until members can vote on how seats are filled.
- Amend the product requirements and data rules for Visit Prep (ADR 0017). Then ship Visit Prep without AI first. Add opt-in AI only after its safety case, red-team results, a signed processor contract, counsel review and the advisory group's published check.
- Draft the peer-coach standard with a credentialing partner, and pilot Hub sessions with trained facilitators.
- Run a first evaluation with partner clinics (H1–H3). Detecting a modest improvement in loneliness or cardiac anxiety would take about 175 people per group, or about 250 allowing for people who leave the study (Appendix C).

*Gate:* member voting live; safety case accepted; advisory group seated; evaluation protocol registered before anyone enrolls.

**Stage 3 — The bridge.**

- Licensed partners run therapy, clinical response loops, clinician handoff and health-record links.
- Partners run the studies of emergency visits, hospital use and cost (H4–H6). Showing a drop in yearly emergency visits from 20% to 15% of patients would take roughly 900 people per group — a study at partner scale, not a pilot (Appendix C).

*Gate, for each partner:* licensure, privacy agreements and clinical governance in place, and a medical-device review for anything that infers a person's state.

---

## 15. Open questions

We would rather list these than pretend they are settled.

1. **Steward.** Who holds the name, the safety floor and the long-term maintenance — a foundation, a fiscal sponsor, or a partner institution? Whoever it is keeps the floors published and versioned, and gives funders no say in them.
2. **License.** Settled: Apache-2.0 ([ADR 0024](../adr/0024-apache-2-and-fresh-history-release.md)).
3. **The name.** What are the published criteria a deployment must meet to use the OneRhythm name?
4. **Silos.** Do existing groups and their members want a shared home? (H3)
5. **Public journey pages.** Should members be able to publish their journey to the open web, and with what protections?
6. **Coach credential.** Which credentialing body, and which model of supervision?
7. **Where first.** Which countries and states for the first deployments, given their privacy and AI laws?
8. **Member voice on AI.** Settled: the floors outrank any vote and any advisory view; votes set priority among features that meet the floors; the advisory group can ask for a pause; VT Infinite, Inc. decides in public. Still open: how long a pause lasts, how members ask the group to look at a feature, and whether seats are filled by lot or by election.
9. **Sustaining the work.** Money never buys a vote, a seat or a veto, and nobody votes on a proposal that sets their own pay. Still open: how maintainers and moderators are paid, and how much of that is operating cost rather than part of the community-directed budget.
10. **Earmarked funding.** Should we ever accept money tied to specific work — for example, work that safety, security or accessibility requires, or work members have already put first?
11. **Age.** The member platform is meant for adults. How should young people living with arrhythmia, and their families, be served — and what do the laws on children's data require? Counsel to advise.

---

## 16. An invitation

If you live with a heart-rhythm condition, or love someone who does: we are building this with you, not for you.

If you are a clinician: help us keep the line between support and medicine clear, and tell us what would make a Visit Prep summary useful in your room.

If you lead a patient group: we would like to be a home for your community, not a rival to it.

If you run a health system, a clinic, a health plan or an accountable care organization: the core is open, and the clinical layer is yours to build. Check our work. Then help us find out whether it helps.

If you are a researcher or a funder: the hypotheses are written down. Help us test them.

If you write code, design, or review security and accessibility: there is room for you here.

Nobody should fight an invisible bear alone.

Ad Astra Per Aspera.

---

## Appendix A — Reference architecture (for builders)

### A.1 Deployment model

- **One deployment per partner and per jurisdiction, by default**, plus a public "commons" deployment for members who come without a partner. This avoids concentrating breach, legal and moderation risk on one operator, and lets data stay where its laws require.
- **Federation later, and only by choice:** shared session schedules or a directory of public journey pages across deployments.
- **A reference distribution, not just a repository:** infrastructure-as-code, seeded configuration, runbooks, and load tests.

### A.2 Components

| Component | What it does | Status |
|---|---|---|
| Client | One Expo (React Native + React Native Web) codebase for iOS, Android and web | Built (web) |
| Edge | Static hosting for the landing page: a pinned Caddy image on Railway with security headers and the single-page fallback ([ADR 0023](../adr/0023-railway-landing-only-web-host.md)). Content delivery, a web application firewall and rate limiting are still to choose | Built (landing page); Planned (the rest) |
| Core data and API | Supabase: Postgres with row-level security on every table, Auth, Realtime, Storage, Edge Functions | Built |
| Consent ledger | Versioned, append-only record of every consent and withdrawal | Built |
| Audit log | Append-only record of privileged actions — who, when, which table, how many rows — without member identifiers. Short-retention access logs let affected members be identified for a breach notice | Planned |
| Queue and workers | Moderation triage, notifications, deletion fan-out to every store | Planned |
| Search | Community content only. Journals are never indexed | Planned |
| Moderation core | Automated triage → human review queue → appeals → public log | Built (triage, review queue, appeals, console); Planned (public log page, context notes) |
| AI gateway | Checks consent on every request; will not switch on a hosted provider until the operator records that its signed terms bar training and state retention (on-device and self-hosted models exempt); policy layer (organize only; no diagnosis, attribution or scores); removes names and contact details and drops record-like text before sending; retrieval from vetted patient-education sources only, never from journals; provider adapters (Anthropic first; open-weight and on-device options); a provenance log of model, version and time bucket only — no member identifier, no content | Planned |
| Hub | Open-source WebRTC video, phone dial-in, live captions | Planned |
| Exports | Print and PDF; FHIR R4 QuestionnaireResponse; SMART Health Links | Planned |

### A.3 Visit Prep data and sharing

- **Storage.** Journal entries live in their own tables — never in journey pages, which have a publish switch — with a policy that lets only the owner read them. They are encrypted at rest with a separate data key for each member, wrapped by a key in a key service we operate ("envelope encryption"). Destroying a member's key at deletion is designed to leave any backup copy unreadable, provided each member's key is held outside the database backups. Until a restore drill proves it, the published backup window is the promise. Vault mode derives the key from a recovery phrase or, where the device supports it, the member's passkey; nothing can be recovered if it is lost. Timestamps and entry counts are not encrypted.
- **Export.** A published OneRhythm Questionnaire; the member's summary as a FHIR R4 QuestionnaireResponse [[53]](#ref-53), with free-text answers in the member's own words and no derived scores; a Provenance record stating "patient-authored; organized by AI at the member's request; not clinically reviewed."
- **Share links.** An expiring SMART Health Link [[23]](#ref-23), or print. The payload is encrypted on the member's device with the key carried in the link itself; a passcode is on by default; the default expiry is short; requests are rate-limited; revoking deletes the payload; the viewer page sends nothing to third parties; and no view log is tied to the member.
- **Plain headings.** Summary headings stay narrative ("What I noticed", "Questions I want to ask"). The AI never fills structured clinical sections such as problems or medications. Where a clinic's system expects an International Patient Summary [[24]](#ref-24), the summary travels as a narrative note.
- **Action record.** Member-held events shaped like the request → task → outcome pattern of the HL7 SDOH Clinical Care guide [[11]](#ref-11), so a member can hand them to a partner's referral system. No automatic feed. No clinical content.

### A.4 Terminology and measurement instruments

The core ships no licensed instrument text. Some measurement tools are free to use; others — including some utility and disease-specific quality-of-life instruments — require registration or license fees, and some clinical terminologies need a license in some countries. Partners license what their evaluations need. Check each instrument's terms before use.

### A.5 Security

- **Threats we design against:** stalking and doxxing through journey pages; scams aimed at older members; account takeover through a compromised email inbox; insider access to journals; tracking code leaking health data; a caregiver misusing delegated access; manipulation of the AI through pasted text; a breach at an AI provider; compromise of the AI gateway or the key service; and re-identification of people with rare conditions.
- **Targets:** OWASP ASVS Level 2 for the web application and MASVS for mobile.
- **Open-source supply chain:** a software bill of materials and build provenance for every release, signed releases, an OpenSSF Scorecard, and a coordinated vulnerability disclosure policy ([`SECURITY.md`](../../SECURITY.md)).
- **Certifications:** VT Infinite needs none to publish code. Any hosted deployment should expect to be asked for SOC 2 Type II or HITRUST in the US, ISO 27001 and 27701 in Europe, and the NHS Data Security and Protection Toolkit in the UK.

### A.6 Scale and operations

- **Row-level security at scale:** index every column a policy filters on; write `(select auth.uid())` so it runs once per query rather than once per row; avoid joins inside policies [[54]](#ref-54).
- **Beyond about a million active members:** read replicas, a queue, separate search, limits on realtime fan-out — and, above all, regional deployments rather than one global one.
- **Service levels we will publish:** availability of sign-in and of the crisis help button; moderation time to first human review; quarterly restore drills.
- **Observability with as little personal data as possible:** logs carry no journal text, names or email addresses. Member identifiers are replaced by a keyed hash — which is still personal data — and kept only for a short, published period.
- **Releases:** long-term-support versions with a published window for security patches. Today the largest risk to stability is having a single maintainer.

---

## Appendix B — Regulatory map (for counsel to confirm)

This is our understanding, written down so that a lawyer can check it quickly. It is not legal advice.

| Feature | Where | What we believe applies | Who owns it |
|---|---|---|---|
| Community, journey pages, health self-ID | US | FTC Act; the FTC Health Breach Notification Rule for health apps not covered by HIPAA [[9]](#ref-9); no advertising trackers | Core operator |
| The same | Washington, Nevada, Connecticut and other states | Consumer health data laws: consent, access, deletion. Washington's law gives individuals a right to sue | Core operator |
| The same | California | CCPA/CPRA rights for sensitive personal information | Core operator |
| The same | EU and UK | GDPR / UK GDPR Article 9 explicit consent; data-protection impact assessment; processor contracts; transfer rules | Each deployment's operator |
| Visit Prep journal, with or without AI | US | FTC Health Breach Notification Rule [[9]](#ref-9); Washington's law and similar ones (consent to collect, separate consent to share, processor contracts); CCPA/CPRA sensitive personal information | Core operator |
| Visit Prep with AI | US | FDA policy on software that helps patients organize health information and communicate with providers [[7]](#ref-7) [[8]](#ref-8); the AI provider as a contracted processor; FTC rules on deception; state laws on AI in mental health care [[33]](#ref-33); companion-chatbot crisis and disclosure standards, adopted voluntarily [[32]](#ref-32) | Core operator |
| Visit Prep with AI | EU | AI Act transparency duties (Article 50) [[31]](#ref-31); GDPR Article 9; a lawful transfer mechanism for any provider outside the EU; no medical intended purpose under the Medical Device Regulation [[30]](#ref-30) | Each deployment's operator |
| Age | All | Adults only at launch, confirmed by the member at sign-up, with no date of birth stored; children's data laws for anything aimed at younger people — counsel to confirm | Core operator |
| Peer coach credential | US states | State peer-specialist certification where services are billed | Credentialing body and partner |
| Hub sessions | All | Captions (WCAG); no recording; caption, video and dial-in vendors as contracted processors | Session host |
| Therapy | US | HIPAA for covered entities and their business associates; state licensure; interstate compacts | Licensed partner |
| Links to health records | US | HIPAA; information-blocking rules for health IT actors; app registration | Partner |
| Anything that infers a person's state | US, EU, UK | Medical-device review (FDA; EU MDR Rule 11; EU AI Act high-risk duties, whose dates have shifted — confirm current dates) | Regulated manufacturer |
| Substance-use treatment records | US | 42 CFR Part 2, for covered programs | Partner |
| Member posts | US | Section 230 protects good-faith moderation of members' content; it may not extend to text that our own AI generates — counsel to advise | Core operator |
| Legal demands for member data | All | What must be produced under a subpoena or court order, and how members are told — counsel to advise. Requests will be counted in the transparency report | Core operator |
| App distribution | Global | Apple's rules for user-generated content [[5]](#ref-5); Google Play's health app declarations | Core operator |

---

## Appendix C — The arithmetic

### C.1 Break-even

- Net cost per member-year = program cost − (emergency visits avoided × cost per emergency visit + hospital stays avoided × cost per stay + other costs avoided).
- Cost per QALY = net cost ÷ QALYs gained.

**Inputs we have:** the average cost of a US hospital stay with AF as the main diagnosis, $8,819 in 2014 dollars [[37]](#ref-37) (inflate to the year of any analysis); US cost-effectiveness benchmarks of $100,000 to $150,000 per QALY, used by the Institute for Clinical and Economic Review [[55]](#ref-55).

**Inputs we still need:** the cost of an emergency visit, from a partner's own claims; and utility values for people with AF, with defibrillators, and after ablation — and the decrement linked to anxiety and depression — from a systematic review, not a single study.

**Two worked examples (assumptions, not results):**

- *Core, technology only.* Assume $1 per member-year. It breaks even if it prevents one $8,819 hospital stay for every 8,819 member-years. This leaves out people costs, which dominate. It shows only that technology is not the constraint.
- *Guided CBT.* Assume $500 per patient-year. It breaks even if it prevents 0.057 hospital stays per patient-year ($500 ÷ $8,819) — about one for every 18 patients each year. At $100,000 per QALY, it is cost-effective if it adds 0.005 QALYs per patient-year ($500 ÷ $100,000) — about 1.8 days of full health.

### C.2 Study size

Two-sided significance level 0.05, 80% power.

- *A continuous outcome* — for example a loneliness or cardiac-anxiety score — with a standardized effect of 0.3: 2 × (1.96 + 0.84)² ÷ 0.3² ≈ 175 people per group; about 250 per group if 30% leave the study.
- *A yes/no outcome* — any emergency visit in a year — falling from 20% to 15%: about 906 people per group (normal approximation). The 20% starting rate is an assumption; partners should use their own data.

---

## Glossary

- **AF (atrial fibrillation)** — the most common heart-rhythm problem; the upper chambers beat irregularly.
- **Arrhythmia** — any heart-rhythm problem.
- **CBT (cognitive behavioral therapy)** — a talking therapy that works on the links between thoughts, feelings and actions.
- **Defibrillator (ICD)** — a small device placed under the skin that can shock the heart out of a dangerous rhythm.
- **FHIR** — a common standard that health record systems use to exchange information.
- **HIPAA** — the US law that protects health information held by health care providers, health plans and their business partners.
- **Hypothesis** — something we believe and intend to test, not something we have shown.
- **QALY (quality-adjusted life year)** — a year of life weighted by its quality; one QALY is one year in full health.
- **Row-level security** — database rules that let each person see only the rows they are allowed to see.
- **SMART Health Link** — an expiring, shareable link or QR code to a piece of health information. Anyone who has it, and its passcode, can open it until it expires.
- **Utility** — a number between 0 and 1 for how good a state of health is, used to calculate QALYs.
- **Value-based care** — payment arrangements that reward health outcomes and total cost, not the number of services.
- **Visit Prep** — OneRhythm's planned private journal that helps members get ready for appointments.
- **Zero data retention** — an arrangement in which an AI provider does not store the content sent to it, apart from narrow exceptions such as legal requirements.

---

## References

Sources were checked on 27 October 2026. Regulatory, payment and price details change; check the current versions before relying on them.

1. <a id="ref-1"></a>Levine GN, Cohen BE, Commodore-Mensah Y, et al. Psychological health, well-being, and the mind-heart-body connection: a scientific statement from the American Heart Association. *Circulation.* 2021;143(10):e763–e783. https://doi.org/10.1161/CIR.0000000000000947
2. <a id="ref-2"></a>Bueno H, Deaton C, Farrero M, et al. 2025 ESC Clinical Consensus Statement on mental health and cardiovascular disease. *Eur Heart J.* 2025;46(41):4156–4225. https://doi.org/10.1093/eurheartj/ehaf191
3. <a id="ref-3"></a>Arbelo E, Protonotarios A, Gimeno JR, et al. 2023 ESC Guidelines for the management of cardiomyopathies. *Eur Heart J.* 2023;44(37):3503–3626. https://doi.org/10.1093/eurheartj/ehad194
4. <a id="ref-4"></a>Rubin DB. Inference and missing data. *Biometrika.* 1976;63(3):581–592. https://doi.org/10.1093/biomet/63.3.581
5. <a id="ref-5"></a>Apple. App Store Review Guidelines, section 1.2: User-Generated Content. https://developer.apple.com/app-store/review/guidelines/#user-generated-content
6. <a id="ref-6"></a>Fisher AJ, Medaglia JD, Jeronimus BF. Lack of group-to-individual generalizability is a threat to human subjects research. *Proc Natl Acad Sci U S A.* 2018;115(27):E6106–E6115. https://doi.org/10.1073/pnas.1711978115
7. <a id="ref-7"></a>US Food and Drug Administration. *Mobile Medical Applications: Guidance for Industry and Food and Drug Administration Staff.* February 2015 edition, which lists among its examples apps that "help patients organize and track health information" and that "help patients document, show or communicate potential medical conditions to a health care provider." https://cchpca.org/2021/04/FDA-mHealth-2-20.pdf. The current edition is titled *Policy for Device Software Functions and Mobile Medical Applications*; counsel should confirm its present wording.
8. <a id="ref-8"></a>US Food and Drug Administration. *General Wellness: Policy for Low Risk Devices* and *Clinical Decision Support Software*, revised final guidances issued January 2026. Summary: DLA Piper, "FDA updates its clinical decision support and general wellness guidances: key points," 15 January 2026. https://www.dlapiper.com/en-pl/insights/publications/2026/01/fda-updates-its-clinical-decision-support-and-general-wellness-guidances-key-points
9. <a id="ref-9"></a>US Federal Trade Commission. Health Breach Notification Rule, 16 CFR Part 318, as amended in 2024. https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-318
10. <a id="ref-10"></a>Sansoni JE, Grootemaat P, Duncan C. Question prompt lists in health consultations: a review. *Patient Educ Couns.* 2015;98:1454–1464. https://ro.uow.edu.au/ahsri/651
11. <a id="ref-11"></a>HL7 International. SDOH Clinical Care FHIR Implementation Guide (developed with the Gravity Project). https://hl7.org/fhir/us/sdoh-clinicalcare/
12. <a id="ref-12"></a>W3C. Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation, 2023. https://www.w3.org/TR/WCAG22/
13. <a id="ref-13"></a>US Department of Health and Human Services. Nondiscrimination on the Basis of Disability in Programs or Activities Receiving Federal Financial Assistance (Section 504), final rule, 45 CFR Part 84, May 2024. Adopts WCAG 2.1 AA for web content and mobile apps. https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-84
14. <a id="ref-14"></a>US Federal Trade Commission. FTC enforcement action to bar GoodRx from sharing consumers' sensitive health info for advertising. Press release, 1 February 2023.
15. <a id="ref-15"></a>US Federal Trade Commission. FTC to ban BetterHelp from revealing consumers' data, including sensitive mental health information, to Facebook and others for targeted advertising. Press release, 2 March 2023.
16. <a id="ref-16"></a>Substance Abuse and Mental Health Services Administration. *National Model Standards for Peer Support Certification.* 2023.
17. <a id="ref-17"></a>American Academy of Family Physicians. Using codes G0023, G0024, G0140 and G0146 for PIN services. https://www.aafp.org/practice-operations/billing-and-coding/g0023-g0024-g0140-g0146-pin-codes
18. <a id="ref-18"></a>LiveKit, open-source WebRTC server (Apache-2.0). https://github.com/livekit/livekit
19. <a id="ref-19"></a>Jitsi Meet, open-source video conferencing (Apache-2.0). https://github.com/jitsi/jitsi-meet
20. <a id="ref-20"></a>Särnholm J, Skúladóttir H, Rück C, et al. Cognitive behavioral therapy improves quality of life in patients with symptomatic paroxysmal atrial fibrillation. *J Am Coll Cardiol.* 2023;82(1):46–56. https://doi.org/10.1016/j.jacc.2023.04.044
21. <a id="ref-21"></a>Berg SK, Rasmussen TB, Herning M, et al. Cognitive behavioural therapy significantly reduces anxiety in patients with implanted cardioverter defibrillator compared with usual care: findings from the Screen-ICD randomised controlled trial. *Eur J Prev Cardiol.* 2020;27(3):258–268. https://doi.org/10.1177/2047487319874147
22. <a id="ref-22"></a>Centers for Medicare & Medicaid Services. MLN MM14315: Medicare Physician Fee Schedule Final Rule Summary, CY 2026 (optional add-on codes G0568, G0569 and G0570 for behavioral health integration and collaborative care alongside advanced primary care management). https://www.cms.gov/files/document/mm14315-medicare-physician-fee-schedule-final-rule-summary-cy-2026.pdf
23. <a id="ref-23"></a>SMART Health IT. SMART Health Links specification. https://docs.smarthealthit.org/smart-health-links/
24. <a id="ref-24"></a>HL7 International. International Patient Summary (IPS) FHIR Implementation Guide. https://hl7.org/fhir/uv/ips/
25. <a id="ref-25"></a>Basch E, Deal AM, Kris MG, et al. Symptom monitoring with patient-reported outcomes during routine cancer treatment: a randomized controlled trial. *J Clin Oncol.* 2016;34(6):557–565. https://doi.org/10.1200/JCO.2015.63.0830
26. <a id="ref-26"></a>Basch E, Deal AM, Dueck AC, et al. Overall survival results of a trial assessing patient-reported outcomes for symptom monitoring during routine cancer treatment. *JAMA.* 2017;318(2):197–198. https://doi.org/10.1001/jama.2017.7156
27. <a id="ref-27"></a>Guo Y, Lane DA, Wang L, et al. Mobile health technology to improve care for patients with atrial fibrillation. *J Am Coll Cardiol.* 2020;75(13):1523–1534. https://doi.org/10.1016/j.jacc.2020.01.052
28. <a id="ref-28"></a>Hendriks JML, de Wit R, Crijns HJGM, et al. Nurse-led care vs. usual care for patients with atrial fibrillation: results of a randomized trial of integrated chronic care vs. routine clinical care in ambulatory patients with atrial fibrillation. *Eur Heart J.* 2012;33(21):2692–2699. https://doi.org/10.1093/eurheartj/ehs071
29. <a id="ref-29"></a>Wijtvliet EPJP, Tieleman RG, van Gelder IC, et al. Nurse-led vs. usual-care for atrial fibrillation. *Eur Heart J.* 2020;41(5):634–641. https://doi.org/10.1093/eurheartj/ehz666
30. <a id="ref-30"></a>Regulation (EU) 2017/745 on medical devices, Annex VIII, Rule 11 (software). https://eur-lex.europa.eu/eli/reg/2017/745/oj
31. <a id="ref-31"></a>Regulation (EU) 2024/1689 (Artificial Intelligence Act), Article 50: transparency obligations for certain AI systems. https://eur-lex.europa.eu/eli/reg/2024/1689/oj
32. <a id="ref-32"></a>California Senate Bill 243 (2025), companion chatbots: disclosure and suicide-prevention protocol requirements.
33. <a id="ref-33"></a>Illinois Public Act 104-0054 (House Bill 1806, 2025), Wellness and Oversight for Psychological Resources Act.
34. <a id="ref-34"></a>Heinz MV, Mackin DM, Trudeau BM, et al. Randomized trial of a generative AI chatbot for mental health treatment. *NEJM AI.* 2025;2(4). https://doi.org/10.1056/AIoa2400802
35. <a id="ref-35"></a>Wang Z, Shi Z, Shen J, et al. Analysis and comparison of the trends in burden of atrial fibrillation/atrial flutter in China and worldwide from 1990 to 2021 and predictions to 2036 of China. *Front Cardiovasc Med.* 2025;12:1540750. Reports Global Burden of Disease 2021 estimates. https://doi.org/10.3389/fcvm.2025.1540750
36. <a id="ref-36"></a>Rozen G, Hosseini SM, Kaadan MI, et al. Emergency department visits for atrial fibrillation in the United States: trends in admission rates and economic burden from 2007 to 2014. *J Am Heart Assoc.* 2018;7(15):e009024. https://doi.org/10.1161/JAHA.118.009024
37. <a id="ref-37"></a>Jackson SL, Tong X, Yin X, George MG, Ritchey MD. Emergency department, hospital inpatient, and mortality burden of atrial fibrillation in the United States, 2006 to 2014. *Am J Cardiol.* 2017;120(11):1966–1973. Mean cost estimated from charges using hospital cost-to-charge ratios. https://doi.org/10.1016/j.amjcard.2017.08.017
38. <a id="ref-38"></a>Zhang S, Zhang N, Liu L, et al. Global epidemiology of mental disorder in atrial fibrillation between 1998–2021: a systematic review and meta-analysis. *World J Psychiatry.* 2024;14(1):179–193. Pooled estimates: depression 22.0%, anxiety 13.0%; heterogeneity I² ≥ 99.7%; lower after trim-and-fill adjustment for publication bias. https://doi.org/10.5498/wjp.v14.i1.179
39. <a id="ref-39"></a>Ghezzi ES, Sharman RLS, Selvanayagam JB, et al. Burden of mood symptoms and disorders in implantable cardioverter defibrillator patients: a systematic review and meta-analysis of 39 954 patients. *Europace.* 2023;25(6):euad130. https://doi.org/10.1093/europace/euad130
40. <a id="ref-40"></a>Valtorta NK, Kanaan M, Gilbody S, Ronzi S, Hanratty B. Loneliness and social isolation as risk factors for coronary heart disease and stroke: systematic review and meta-analysis of longitudinal observational studies. *Heart.* 2016;102(13):1009–1016. https://doi.org/10.1136/heartjnl-2015-308790
41. <a id="ref-41"></a>Cené CW, Beckie TM, Sims M, et al. Effects of objective and perceived social isolation on cardiovascular and brain health: a scientific statement from the American Heart Association. *J Am Heart Assoc.* 2022;11(16):e026493. https://doi.org/10.1161/JAHA.122.026493
42. <a id="ref-42"></a>AARP Public Policy Institute, with Stanford University. *Medicare Spends More on Socially Isolated Older Adults.* Insight on the Issues 125, November 2017. Summary: https://www.aarp.org/medicare/high-price-of-social-isolation-study-2017/
43. <a id="ref-43"></a>Kronish IM, Moise N, Cheung YK, et al. Effect of depression screening after acute coronary syndromes on quality of life: the CODIACS-QoL randomized clinical trial. *JAMA Intern Med.* 2020;180(1):45–53. https://doi.org/10.1001/jamainternmed.2019.4518
44. <a id="ref-44"></a>Lloyd-Evans B, Mayo-Wilson E, Harrison B, et al. A systematic review and meta-analysis of randomised controlled trials of peer support for people with severe mental illness. *BMC Psychiatry.* 2014;14:39. https://doi.org/10.1186/1471-244X-14-39
45. <a id="ref-45"></a>Eysenbach G, Powell J, Englesakis M, Rizo C, Stern A. Health related virtual communities and electronic support groups: systematic review of the effects of online peer to peer interactions. *BMJ.* 2004;328(7449):1166. https://doi.org/10.1136/bmj.328.7449.1166
46. <a id="ref-46"></a>Eysenbach G. The law of attrition. *J Med Internet Res.* 2005;7(1):e11. https://doi.org/10.2196/jmir.7.1.e11
47. <a id="ref-47"></a>Probst MA, Mower WR, Kanzaria HK, Hoffman JR, Buch EF, Sun BC. Analysis of emergency department visits for palpitations (from the National Hospital Ambulatory Medical Care Survey). *Am J Cardiol.* 2014;113(10):1685–1690. https://doi.org/10.1016/j.amjcard.2014.02.020
48. <a id="ref-48"></a>Lessmeier TJ, Gamperling D, Johnson-Liddon V, et al. Unrecognized paroxysmal supraventricular tachycardia: potential for misdiagnosis as panic disorder. *Arch Intern Med.* 1997;157(5):537–543.
49. <a id="ref-49"></a>Foley & Lardner LLP. LEAD-ing the future of ACOs: new Long-term Enhanced ACO Design model. January 2026. https://www.foley.com/insights/publications/2026/01/lead-ing-the-future-of-acos-new-long-term-enhanced-aco-design-model/ (model page: https://www.cms.gov/priorities/innovation/innovation-models/lead)
50. <a id="ref-50"></a>National Institute for Health and Care Excellence. Evidence standards framework for digital health technologies (ECD7). https://www.nice.org.uk/corporate/ecd7
51. <a id="ref-51"></a>Supabase. Pricing. https://supabase.com/pricing (checked 27 October 2026).
52. <a id="ref-52"></a>Anthropic. Claude Sonnet 5.5 and Claude Haiku 5.5 model overviews, pricing sections. https://platform.claude.com/docs/en/models/sonnet-5-5/overview and https://platform.claude.com/docs/en/models/haiku-5-5/overview (checked 27 October 2026).
53. <a id="ref-53"></a>HL7 International. FHIR R4: Questionnaire and QuestionnaireResponse resources. https://hl7.org/fhir/R4/questionnaire.html
54. <a id="ref-54"></a>Supabase. Row Level Security: performance recommendations. https://supabase.com/docs/guides/database/postgres/row-level-security
55. <a id="ref-55"></a>Institute for Clinical and Economic Review. Value Assessment Framework (health-benefit price benchmarks of $100,000–$150,000 per QALY). https://icer.org
