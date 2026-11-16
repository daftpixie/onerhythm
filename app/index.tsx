import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type ReactNode } from "react";
import { Redirect, useRouter } from "expo-router";
import { ContactLine } from "../src/components/ContactLine";
import { CrisisHelp } from "../src/components/CrisisHelpSheet";
import { DisclaimerBand } from "../src/components/DisclaimerBand";
import { UpdatesSignupForm } from "../src/components/UpdatesSignupForm";
import { Wordmark } from "../src/components/Wordmark";
import { useAuth } from "../src/lib/auth";
import { type PressState } from "../src/lib/pressable";
import { CONTACT_EMAIL, isLandingMode, SOURCE_URL, VISION_URL } from "../src/lib/site";
import { tokens, focus, space } from "../src/theme/tokens";

// The public front door (wireframe B1, Brand v3). Signed-out only — a member
// who is already in goes straight to their feed.
//
// This page has one job and one primary action: say honestly what this is,
// and let someone leave an email address so they hear when it opens. No
// health data is collected here and no health claim is made about the reader.
//
// Heading levels are carried by aria-level, which react-native-web maps to
// the real thing. React Native's TextProps has no accessibilityLevel, so on
// iOS/Android these announce as headings without a level — the same class of
// web-only-a11y gap as the focus rings recorded in ADR 0010, and noted in
// ADR 0011 rather than left to be rediscovered.
/**
 * A link that leaves the site. A real href on web (so it shows where it goes
 * and works without script); on native, which has no href, the press opens it.
 */
function ExternalLink({
  href,
  primary = false,
  label,
  children,
}: {
  href: string;
  /** A primary action: a 44px target (a11y.md). */
  primary?: boolean;
  /** A fuller accessible name. It must start with the visible text (SC 2.5.3). */
  label?: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      role="link"
      accessibilityRole="link"
      aria-label={label}
      accessibilityLabel={label}
      {...({ href } as object)}
      onPress={Platform.OS === "web" ? undefined : () => Linking.openURL(href).catch(() => {})}
      style={({ focused }: PressState) => [
        styles.quietLink,
        primary && styles.primaryLink,
        focused && styles.focusRing,
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  // ADR 0023: the public build is landing-only, with the updates sign-up off.
  const landing = isLandingMode();

  // Signed-in members land on their feed; the landing page is for visitors.
  if (!loading && session) {
    return <Redirect href="/feed" />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.measure}>
        <View style={styles.hero}>
          <Wordmark size={44} />

          <Text
            style={styles.h1}
            accessibilityRole="header"
            aria-level={1}
          >
            You are not alone with your heart.
          </Text>

          <Text style={styles.lede}>
            A community for people living with arrhythmia — and the people who
            care for them.
          </Text>

          {landing ? (
            <>
              {/* Sign-up is off (founder decision, 3 Nov 2026): no form, and
                  nothing is collected. A plain contact line takes its place,
                  and the page promises no email it cannot send. */}
              <Text style={styles.status}>
                It’s not open yet. We’re building it carefully, and slowly,
                because getting this right matters.
              </Text>
              <ContactLine lead="If you have a question, or you'd like to get involved, email us." />
            </>
          ) : (
            <>
              <Text style={styles.status}>
                It’s not open yet. We’re building it carefully, and slowly, because
                getting this right matters. Leave your email and we’ll tell you when
                it opens.
              </Text>

              <UpdatesSignupForm />
            </>
          )}

          <View style={styles.inlineLinks}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={
                landing ? "Read the privacy notice" : "Read the privacy notice for the updates list"
              }
              onPress={() => router.push("/privacy-notice")}
              style={({ focused }: PressState) => [
                styles.quietLink,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.quietLinkText}>Privacy notice</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text
                style={styles.columnTitle}
                accessibilityRole="header"
                // Level 2, not 3. These two columns are top-level sections of
                // the page — there is no level-2 heading above them — so a 3
                // made the outline jump h1 -> h3 and then back down to h2,
                // leaving a hole in the screen-reader outline (SC 1.3.1).
                // Invisible until the web project put real tag names on the
                // page; every heading looks identical in a native tree.
                aria-level={2}
              >
                What this is
              </Text>
              <Text style={styles.columnItem}>Peer support</Text>
              <Text style={styles.columnItem}>Diagnosis-based communities</Text>
              <Text style={styles.columnItem}>Share your journey</Text>
              <Text style={styles.columnItem}>
                {"Positive-only (\"upbeats\") — there is no downvote"}
              </Text>
            </View>
            <View style={styles.column}>
              <Text
                style={styles.columnTitle}
                accessibilityRole="header"
                // Sibling of "What this is" above — same level, same reason.
                aria-level={2}
              >
                What this is NOT
              </Text>
              <Text style={styles.columnItem}>Not medical advice</Text>
              <Text style={styles.columnItem}>
                Not a place for diagnosis or ECG reading
              </Text>
              <Text style={styles.columnItem}>
                Not affiliated with any provider
              </Text>
              <Text style={styles.columnItem}>
                In an emergency, call your local emergency number
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            Why this exists
          </Text>
          {/* Evidence: docs/vision/OneRhythm_Vision.md refs 35, 38 and 39; ADR 0025.
              Wang et al. (2025): 52.55M AF/atrial-flutter cases in 2021.
              Zhang et al. (2024): pooled AF anxiety 13%, depression 22%.
              Ghezzi et al. (2023): pooled ICD PTSD 12.43%.
              These estimates describe studied populations, not this reader.
              Different measures and substantial heterogeneity limit precision. */}
          {/* Short sentences, one clinical term each. The a11y review flagged
              the first draft of this paragraph as running above the ~8th-grade
              bar in .claude/rules/a11y.md — three long words in one compound
              sentence, for a reader who may have been diagnosed this week. */}
          <Text style={styles.body}>
            In 2021, more than 50 million people around the world were estimated
            to be living with atrial fibrillation or atrial flutter. These are
            two common heart-rhythm conditions.
          </Text>
          <Text style={styles.body}>
            Living with a heart-rhythm problem can also affect your peace of
            mind. One review of many studies found
            anxiety in about one in eight people with atrial fibrillation,
            and depression in about one in five. Another review found
            post-traumatic stress in about one in eight people with an implanted
            defibrillator. The studies used different measures, and their
            estimates varied widely.
          </Text>
          <Text style={styles.body}>
            Those numbers are about a population, not about you — nobody here
            will tell you how you feel. They’re the reason we think a place like
            this should exist, and the reason the people standing next to a
            patient belong here too.
          </Text>
          {/* Sources for the figures above (4 Nov 2026). The vision document
              lists them, with links, under "References". No new numbers here. */}
          <ExternalLink
            href={`${VISION_URL}#references`}
            primary
            label="Where these numbers come from, on GitHub"
          >
            <Text style={styles.quietLinkText}>Where these numbers come from</Text>
          </ExternalLink>
          {/* The thoughts-of-suicide line sits in the SAME paragraph as the
              crisis resources on purpose. It used to be three paragraphs above
              them; adjacency is doing real work here and should not be undone
              by a later edit that tidies the numbers back together. */}
          <Text style={styles.body}>
            Some people living with a heart-rhythm problem have thoughts of
            suicide. If you’re struggling right now, you don’t have to wait
            for us. In the US, you can call or text 988, any time. The help
            button at the top of
            every page has crisis resources, and in an emergency you should call
            your local emergency number.
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            Who built it
          </Text>
          {/* The founder's words (4 Nov 2026), unchanged. His specific
              diagnosis and device are deliberately NOT named (ADR 0016).
              "We" here means the people described in the second paragraph.
              The promises under "What we will never do" are the operator's
              (VT Infinite, Inc.), and that section says so. No member's words, names, stories or counts appear
              here or anywhere in the repository: using them would need each
              person's consent. */}
          <Text style={styles.body}>
            I live with an arrhythmia. I built OneRhythm on my own, with the
            help of Claude, an AI assistant, because I couldn’t find it when I
            needed it.
          </Text>
          <Text style={styles.body}>
            But I was never really building it alone. Over the past year and a
            half, people from around the world, from all walks of life, have
            written to me. They live with arrhythmia, love someone who does, or
            work in heart care. They told me what helps, what doesn’t, and what
            it feels like when nobody around you understands. When this page
            says “we”, it means them. They are the reason this exists.
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            Why it’s called OneRhythm
          </Text>
          <Text style={styles.body}>
            Our diagnoses are different. Our symptoms are different from one
            person to the next. But heart disease touches all of us — patients,
            caregivers and professionals alike. Nobody should fight an invisible
            bear alone.
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          {/* This was the "Open books" section and its link to /transparency,
              removed pre-launch (ADR 0016): publishing a cost table of well
              under a dollar a month against no support at all, for a platform
              that has not opened, claims more than it says. The ledger itself
              is kept outside the public release for now (ADR 0024) and is
              guarded append-only — it is the page that was premature, not the
              record. Restoring the page is a named Phase 4 prerequisite,
              alongside Stripe.

              The entity sentence stays, because being straight about not being
              a charity is not contingent on a page that renders numbers. */}
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            Who runs it
          </Text>
          <Text style={styles.body}>
            OneRhythm is a VT Infinite, Inc. initiative. A conversion to a
            Delaware public benefit corporation is proposed but has not been
            filed. OneRhythm is not a separate 501(c)(3). If member support
            opens under the current corporate structure, contributions will
            not be tax-deductible. The terms will be reviewed before launch.
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            What we will never do
          </Text>
          {/* Governance review, 4 Nov 2026: "we" in "Who built it" means the
              people who wrote to the founder. These promises are the
              operator's, and member voting is not built, so both are said. */}
          <Text style={styles.body}>
            VT Infinite, Inc., which runs OneRhythm, makes these promises.
            Member voting is not built yet. When it opens, every member will
            have one equal vote.
          </Text>
          <Text style={styles.columnItem}>No ads, and no tracking pixels</Text>
          {/* Matches privacy floor items 3 and 4 (review, 3 Nov 2026):
              "never share" was broader than the floor, which allows sharing
              at the member's request, with processors under contract, and
              under a valid legal order. */}
          <Text style={styles.columnItem}>
            We never sell your data. We only share it when you ask us to, to
            run the service under contract, or when the law requires it
          </Text>
          <Text style={styles.columnItem}>
            No paywalls — nothing here is ever gated by money
          </Text>
          <Text style={styles.columnItem}>
            No pay-for-power in governance: when voting opens, one member, one
            equal vote
          </Text>
          <Text style={styles.columnItem}>
            No medical advice, and no storing of clinical records
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          {/* For outreach (3 Nov 2026). Plain, and NO NUMBERS: ADR 0016's
              statistics rules hold, and tests/web/landing-mode.test.tsx fails
              on a digit here. No ask for money, either. The vision document is
              where the evidence and its sources live. */}
          <Text
            style={styles.h2}
            accessibilityRole="header"
            aria-level={2}
          >
            For partners and builders
          </Text>
          <Text style={styles.body}>
            OneRhythm is open by design. The code is open source, under the
            Apache License, so anyone may read it, check it and reuse it. We are
            writing down, for anyone to read, the rules that keep members safe
            and keep their data private. Those rules are not put to a vote.
          </Text>
          <Text style={styles.body}>
            OneRhythm itself stays a peer community. It does not give medical
            advice, and it is not tied to any provider. If you run a clinic, a
            health program or a research group, or you write software, you are
            welcome to read our plans and reuse what helps. We would rather be
            checked than trusted.
          </Text>
          <ExternalLink href={VISION_URL} primary>
            <Text style={styles.quietLinkText}>Read the vision document on GitHub</Text>
          </ExternalLink>
          <ContactLine
            lead="To talk about working together, email us."
            label={`Email ${CONTACT_EMAIL} about working together`}
          />
        </View>

        {/* The founder's closing words (4 Nov 2026), verbatim. Two plain
            lines, deliberately not a heading. */}
        <View style={styles.hope}>
          <Text style={styles.body}>Hope is what built OneRhythm.</Text>
          <Text style={styles.body}>Hope is what will keep OneRhythm.</Text>
        </View>

        <DisclaimerBand />

        <View style={styles.footer}>
          {/* One link per destination. B1 sketches Privacy in the footer too,
              but two links to the same page under two names is a worse
              experience than one link in the place it matters — the privacy
              notice sits beside the form that collects the address. (B1 also
              sketched an open-books link here; that page is gone, ADR 0016.) */}
          <View style={styles.footerLinks}>
            {/* The repository. Correct once it is public:
                docs/RELEASE_FRESH_HISTORY.md flips visibility before the
                site's address is shared. */}
            <ExternalLink href={SOURCE_URL}>
              <Text style={styles.quietLinkText}>Open source code on GitHub</Text>
            </ExternalLink>
          </View>

          {/* B1 puts a crisis affordance in the footer as well as the header.
              Reachable from every screen is a safety requirement, not a nicety. */}
          <View style={styles.crisisRow}>
            <CrisisHelp />
          </View>

          <Text style={styles.fineprint}>
            Not medical advice. In an emergency, call your local emergency
            number.
          </Text>
          <Text style={styles.fineprint}>A VT Infinite, Inc. initiative.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: tokens.paper,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
  },
  // v3 follow-up #5: the reading measure. Without a cap this page produced
  // ~80–90 character lines above 1200px, well past the ~45–75ch a reader can
  // track — worst for exactly the person this is built for.
  //
  // 620 is measured, not guessed. Atkinson Hyperlegible 400 averages 8.05px
  // per character of this page's actual prose at 18px, so a 572px text column
  // (620 minus 24px padding each side) lands at ~71 characters. A 720px cap
  // still gave 83.5, which is why the first number was wrong.
  measure: {
    width: "100%",
    maxWidth: 620,
    paddingHorizontal: 24,
  },
  hero: {
    paddingTop: 48,
    paddingBottom: space.section,
  },
  h1: {
    marginTop: 24,
    fontSize: 32,
    lineHeight: 44,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  h2: {
    fontSize: 22,
    lineHeight: 33,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 12,
  },
  lede: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  status: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    lineHeight: 27,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  body: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 12,
  },
  section: {
    // v3 §5: sections breathe at 48–64px. Space is what lowers cognitive load
    // for a reader who is anxious, tired, or new to all of this.
    paddingVertical: space.section,
  },
  hope: {
    paddingBottom: space.section,
  },
  rule: {
    height: 1,
    backgroundColor: tokens.line,
  },
  columns: {
    flexDirection: "row",
    gap: 24,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    minWidth: 240,
  },
  columnTitle: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 12,
  },
  columnItem: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
  crisisRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  inlineLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
  },
  quietLink: {
    minHeight: 24,
    justifyContent: "center",
    paddingVertical: 8,
  },
  primaryLink: {
    minHeight: 44,
  },
  quietLinkText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    textDecorationLine: "underline",
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
  fineprint: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  footer: {
    paddingTop: space.section,
    paddingBottom: space.section,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 12,
  },
});
