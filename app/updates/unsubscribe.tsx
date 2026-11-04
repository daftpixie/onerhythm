import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  unsubscribeFromUpdates,
  type UnsubscribeStatus,
} from "../../src/lib/updates/subscribe";
import { tokens, space } from "../../src/theme/tokens";

// Leaving the list. CAN-SPAM requires this to work from day one, and it must
// never ask anyone to sign in, remember anything, or explain themselves — the
// token in the link is the whole story.
//
// The row is kept rather than deleted, so the address stays suppressed instead
// of being quietly re-added by a later signup. Anyone who wants the record
// gone entirely can ask, and we delete it.
const MESSAGES: Record<UnsubscribeStatus | "working", string> = {
  working: "One moment — we're taking your address off the list.",
  unsubscribed:
    "Done. You're off the list and we won't email you again. " +
    "No hard feelings, and you're welcome back any time.",
  already_unsubscribed:
    "You're already off the list — this link had been used once before. " +
    "We won't email you.",
  invalid:
    "We couldn't match that link. It may have been mistyped, or it may be an " +
    "old one. If you're still getting email from us, reply to it and we'll " +
    "take you off by hand.",
  failed:
    "Sorry — something went wrong at our end. Please try again in a little " +
    "while, and if it keeps happening, reply to any of our email and we'll " +
    "take you off by hand.",
};

export default function UnsubscribeScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<UnsubscribeStatus | "working">(
    token ? "working" : "invalid",
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    unsubscribeFromUpdates(token).then((result) => {
      if (active) setStatus(result);
    });
    return () => {
      active = false;
    };
  }, [token]);

  // accessibilityLiveRegion is Android-only in this React Native version and
  // role="status" does not make VoiceOver speak by itself, so an iOS screen-
  // reader user would land here from an email link and be told nothing about
  // whether it worked. Announce explicitly once the outcome is known.
  useEffect(() => {
    // iOS only: web and Android are covered by the live-region prop below,
    // and announcing on all three makes TalkBack say it twice.
    if (status !== "working" && Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(MESSAGES[status]);
    }
  }, [status]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.measure}>
        <Text
          style={styles.h1}
          accessibilityRole="header"
          aria-level={1}
        >
          Project updates
        </Text>
        <Text
          style={styles.body}
          role="status"
          accessibilityLiveRegion="polite"
        >
          {MESSAGES[status]}
        </Text>
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
  body: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
