import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/lib/auth";
import {
  setOnboardingRole,
  type OnboardingChoice,
} from "../src/lib/profile";
import { grantHealthSelfIdConsent } from "../src/lib/consent";
import {
  HealthSelfIdConsent,
  type HealthSelfIdConsentResult,
  type SelfIdTagOption,
} from "../src/components/HealthSelfIdConsent";
import { type PressState } from "../src/lib/pressable";
import { tokens, focus } from "../src/theme/tokens";

const ROLE_OPTIONS: { choice: OnboardingChoice; label: string }[] = [
  { choice: "patient", label: "I have an arrhythmia" },
  { choice: "caregiver", label: "I care for someone who does (caregiver)" },
  { choice: "both", label: "Both" },
  {
    choice: "professional",
    label: "I'm a healthcare professional who wants to contribute",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [choice, setChoice] = useState<OnboardingChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [tags, setTags] = useState<SelfIdTagOption[]>([]);

  // Not signed in? Onboarding is post-auth — send to sign-in.
  useEffect(() => {
    if (!loading && !session) router.replace("/sign-in");
  }, [loading, session, router]);

  // Load the controlled vocabulary for step 2.
  useEffect(() => {
    let active = true;
    supabase
      .from("self_id_tags")
      .select("id, code, label, tag_type")
      .eq("is_active", true)
      .then(({ data }) => {
        if (active && data) setTags(data as SelfIdTagOption[]);
      });
    return () => {
      active = false;
    };
  }, []);

  async function continueFromRole() {
    if (!choice || busy) return;
    setBusy(true);
    try {
      await setOnboardingRole(supabase, choice);
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(result: HealthSelfIdConsentResult) {
    if (busy) return;
    setBusy(true);
    try {
      // Opt-in writes consent + tags through the gated path. Anything else
      // (unchecked, or no tags chosen) writes NOTHING.
      if (result.consentChecked && result.selectedTagIds.length > 0) {
        await grantHealthSelfIdConsent(supabase, result.selectedTagIds);
      }
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  function finishWithoutWriting() {
    router.replace("/");
  }

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  if (step === 2) {
    return (
      <HealthSelfIdConsent
        tags={tags}
        onSave={handleSave}
        onSkip={finishWithoutWriting}
      />
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Step 1 of 2 — Who are you here as?
      </Text>
      <Text style={styles.help}>
        This helps us point you to the right spaces. You can change it later.
      </Text>

      <View accessibilityRole="radiogroup" style={styles.group}>
        {ROLE_OPTIONS.map((opt) => {
          const selected = choice === opt.choice;
          return (
            <Pressable
              key={opt.choice}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={opt.label}
              onPress={() => setChoice(opt.choice)}
              style={({ focused, pressed }: PressState) => [
                styles.radioRow,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={styles.radioLabel}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !choice || busy }}
        disabled={!choice || busy}
        onPress={continueFromRole}
        style={({ focused, pressed }: PressState) => [
          styles.primaryButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
          (!choice || busy) && styles.disabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={tokens.paper} />
        ) : (
          <Text style={styles.primaryButtonText}>Continue</Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
        onPress={() => setStep(2)}
        style={({ focused, pressed }: PressState) => [
          styles.secondaryButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: {
    padding: 24,
    gap: 8,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
  group: { gap: 4, marginBottom: 8 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.inkSecondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  radioSelected: { borderColor: tokens.ink },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.ink,
  },
  radioLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
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
    marginTop: 8,
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
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
