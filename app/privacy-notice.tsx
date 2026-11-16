import { ScrollView, StyleSheet, Text, View } from "react-native";
import { isLandingMode } from "../src/lib/site";
import { tokens, radius, space } from "../src/theme/tokens";

// The privacy notice for the UPDATES LIST ONLY.
//
// This is deliberately narrow. It is not the Consumer Health Data Privacy
// Policy (Washington MHMDA), not the Terms of Service, and not the member
// privacy policy — those are gated on attorney review, which is build-blocking
// (CLAUDE.md #7), and nothing here substitutes for it or unblocks it. Saying
// so on the page is part of the point: a marketing notice that reads like a
// full privacy policy would be the most convenient possible lie.
export default function PrivacyNoticeScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.measure}>
        <Text
          style={styles.h1}
          accessibilityRole="header"
          aria-level={1}
        >
          Privacy notice for the updates list
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            This covers the updates list only. OneRhythm is not open yet. The
            fuller policies that will cover being a member — including how we
            handle anything you tell us about your health — are still being
            prepared for legal review, and we won’t open until that review is done. This page is
            not that review and does not stand in for it.
          </Text>
          {isLandingMode() ? (
            // ADR 0023: sign-up is off in the public build. Say so, so this
            // page never reads as if addresses are being collected today.
            <Text style={[styles.calloutText, styles.calloutGap]}>
              The updates list is closed for now. This site has no form and
              sets no cookies. If you email us, we receive your address and what
              you write, so please leave out health details. Our email is
              hosted by Google Workspace, so Google handles every message for
              us. Like any website,
              our host sees the IP address of each visitor. The rest of this
              page explains how the list will work if it opens.
            </Text>
          ) : null}
        </View>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          What we collect
        </Text>
        <Text style={styles.body}>
          Your email address. That’s the whole list. We don’t ask for your name,
          where you live, or anything at all about your health, and there’s
          nowhere on the form to tell us.
        </Text>
        <Text style={styles.body}>
          We also record the date you signed up and which page the form was on,
          so we can tell an old address from a new one.
        </Text>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          Why we collect it
        </Text>
        <Text style={styles.body}>
          To email you about this project — how it’s going, and when it opens.
          Nothing else. We won’t use your address to advertise to you, and we
          won’t use it to work out anything about you.
        </Text>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          Who else sees it
        </Text>
        <Text style={styles.body}>
          We never sell your address. If the list opens, we plan to store it in
          a Supabase database and copy the list to a private Google Sheet in
          Google Workspace. We have not chosen an email delivery provider yet.
        </Text>
        <Text style={styles.body}>
          Before the list opens, we will publish who handles it and why. Those
          providers must work only for us, under written contracts, with no use
          of the list for their own purposes. We will not open the list until
          those checks are done.
        </Text>
        <Text style={styles.body}>
          This list is kept completely separate from member accounts. If you
          join OneRhythm later using the same address, the two are not
          connected, not compared, and not merged. That separation is built into
          the database, not just promised here.
        </Text>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          How long we keep it
        </Text>
        <Text style={styles.body}>
          Until you unsubscribe, or until you ask us to delete it. We’re not
          going to promise an automatic cleanup we haven’t built yet — if you
          want to be gone sooner, ask, and we’ll do it by hand.
        </Text>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          Leaving, and being deleted
        </Text>
        <Text style={styles.body}>
          Every email we send will have an unsubscribe link, and it works
          without signing in to anything. Unsubscribing stops the email and
          keeps your address on a do-not-email list so a later signup doesn’t
          quietly start it again.
        </Text>
        <Text style={styles.body}>
          If you’d rather we delete the record altogether, reply to any email
          from us and say so. We’ll delete it and confirm.
        </Text>

        <Text
          style={styles.h2}
          accessibilityRole="header"
          aria-level={2}
        >
          No tracking
        </Text>
        <Text style={styles.body}>
          There are no advertising or tracking pixels on this site. We don’t use
          cookies to follow you, and we don’t hand anything to advertisers.
        </Text>

        <Text style={styles.fineprint}>
          OneRhythm is an initiative of VT Infinite, Inc., a Delaware
          corporation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  calloutGap: { marginTop: 12 },
  scroll: {
    flex: 1,
    backgroundColor: tokens.paper,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
  },
  measure: {
    // Same measured reading column as the landing page: ~71 characters of
    // 18px Atkinson Hyperlegible. See app/index.tsx.
    width: "100%",
    maxWidth: 620,
    paddingHorizontal: 24,
    paddingVertical: space.section,
  },
  h1: {
    fontSize: 28,
    lineHeight: 42,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 16,
  },
  h2: {
    marginTop: 32,
    fontSize: 22,
    lineHeight: 33,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  body: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 12,
  },
  callout: {
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: radius.card,
    backgroundColor: tokens.fill,
    padding: 24,
  },
  calloutText: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  fineprint: {
    marginTop: 32,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
