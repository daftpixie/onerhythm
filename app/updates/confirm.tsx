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
  confirmSubscription,
  type ConfirmStatus,
} from "../../src/lib/updates/subscribe";
import { tokens, space } from "../../src/theme/tokens";

// Double opt-in, completed. The link in the confirmation email lands here.
//
// No login, and no account: this page knows a token and nothing else. It never
// learns whose address it is and never touches a member table.
const MESSAGES: Record<ConfirmStatus | "working", string> = {
  working: "One moment — we're checking your link.",
  confirmed:
    "Thank you — you're on the list. We'll write when there's real news, " +
    "and not more often than that. Every email will have an unsubscribe link.",
  already_confirmed:
    "You're already on the list — this link had been used once before. " +
    "There's nothing else you need to do.",
  invalid:
    "We couldn't match that link. It may have been mistyped, or it may be an " +
    "old one. You can add your address again from the home page.",
  failed:
    "Sorry — something went wrong at our end and we couldn't check your link. " +
    "Please try again in a little while.",
};

export default function ConfirmScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<ConfirmStatus | "working">(
    token ? "working" : "invalid",
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    confirmSubscription(token).then((result) => {
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
