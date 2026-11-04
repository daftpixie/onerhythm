import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../src/lib/supabase";
import { type PressState } from "../src/lib/pressable";
import { tokens, focus } from "../src/theme/tokens";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setResendIn(30);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1 && timer.current) {
          clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function sendLink() {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    const emailRedirectTo = Linking.createURL("/auth/callback");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo },
    });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setSent(true);
    startCooldown();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Welcome. Let&apos;s get you in.
      </Text>

      {!sent ? (
        <>
          <Text style={styles.label} nativeID="emailLabel">
            Email address
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email address"
            aria-labelledby="emailLabel"
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor={tokens.inkTertiary}
            onSubmitEditing={sendLink}
            returnKeyType="send"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send me a magic link"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={sendLink}
            style={({ focused, pressed }: PressState) => [
              styles.primaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={tokens.paper} />
            ) : (
              <Text style={styles.primaryButtonText}>Send me a magic link</Text>
            )}
          </Pressable>

          <Text style={styles.help}>
            We&apos;ll email you a link. Click it on this device and you&apos;re
            in — no password to remember.
          </Text>
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            Check your email
          </Text>
          <Text style={styles.help}>
            We sent a link to {email.trim()}. Click it on this device to
            continue.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              resendIn > 0
                ? `Resend available in ${resendIn} seconds`
                : "Resend the link"
            }
            accessibilityState={{ disabled: resendIn > 0 || busy }}
            disabled={resendIn > 0 || busy}
            onPress={sendLink}
            style={({ focused, pressed }: PressState) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
              (resendIn > 0 || busy) && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {resendIn > 0 ? `Resend (${resendIn}s)` : "Resend the link"}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: { padding: 24, gap: 12, maxWidth: 520, width: "100%", alignSelf: "center" },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.inkSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: tokens.ink,
    backgroundColor: tokens.paper,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  primaryButton: {
    backgroundColor: tokens.pulse,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    color: tokens.paper,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: tokens.paper,
  },
  secondaryButtonText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  card: {
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    backgroundColor: tokens.paper,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
