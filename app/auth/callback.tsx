import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { tokens } from "../../src/theme/tokens";

// Web magic-link return. The Supabase client (detectSessionInUrl) exchanges the
// link for a session on load; we wait for it, then move to onboarding. A failed
// return is surfaced plainly — never a silent failure.
export default function AuthCallback() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/onboarding");
    }
  }, [loading, session, router]);

  if (loading || session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
        <Text style={styles.text}>Signing you in…</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.heading} accessibilityRole="header">
        We couldn&apos;t finish signing you in
      </Text>
      <Text style={styles.text}>
        The link may have expired. You can ask for a new one.
      </Text>
      <Link href="/sign-in" style={styles.link} accessibilityRole="link">
        Back to sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: tokens.paper,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    textAlign: "center",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    paddingVertical: 10,
  },
});
