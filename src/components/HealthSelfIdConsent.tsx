import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../lib/pressable";
import { tokens, focus } from "../theme/tokens";

export type SelfIdTagType =
  | "diagnosis"
  | "physical_symptom"
  | "emotional_symptom";

export interface SelfIdTagOption {
  id: string;
  code: string;
  label: string;
  tag_type: SelfIdTagType;
}

export interface HealthSelfIdConsentResult {
  consentChecked: boolean;
  selectedTagIds: string[];
}

interface Props {
  tags: SelfIdTagOption[];
  onSave: (result: HealthSelfIdConsentResult) => void;
  onSkip: () => void;
}

const GROUP_TITLES: Record<SelfIdTagType, string> = {
  diagnosis: "Diagnosis (choose any)",
  physical_symptom: "How it affects you — physical",
  emotional_symptom: "How it affects you — emotional",
};
const GROUP_ORDER: SelfIdTagType[] = [
  "diagnosis",
  "physical_symptom",
  "emotional_symptom",
];

// A checkbox row: 44px target, accessible checkbox role/state, icon + TEXT label,
// visible focus ring on web.
function CheckboxRow({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      style={({ focused, pressed }: PressState) => [
        styles.checkboxRow,
        disabled && styles.disabledRow,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.boxMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

export function HealthSelfIdConsent({ tags, onSave, onSkip }: Props) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleTag(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading} accessibilityRole="header">
        Step 2 of 2 — Tell us what you&apos;re dealing with
      </Text>

      <Text style={styles.explanation}>
        This is optional and private. It only helps us suggest communities you
        might find useful. We never sell or share it, and you can change or
        remove it anytime.
      </Text>

      {/* The single sensitive-data opt-in: a SEPARATE consent, UNCHECKED by
          default. No tags are written unless this is on. */}
      <CheckboxRow
        label="Yes, I want to add this and join relevant communities"
        checked={consentChecked}
        onToggle={() => setConsentChecked((v) => !v)}
      />

      {GROUP_ORDER.map((type) => {
        const group = tags.filter((t) => t.tag_type === type);
        if (group.length === 0) return null;
        return (
          <View key={type} style={styles.group}>
            <Text style={styles.groupTitle}>{GROUP_TITLES[type]}</Text>
            {group.map((tag) => (
              <CheckboxRow
                key={tag.id}
                label={tag.label}
                checked={selected.has(tag.id)}
                disabled={!consentChecked}
                onToggle={() => toggleTag(tag.id)}
              />
            ))}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save and continue"
        onPress={() =>
          onSave({ consentChecked, selectedTagIds: Array.from(selected) })
        }
        style={({ focused, pressed }: PressState) => [
          styles.primaryButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.primaryButtonText}>Save &amp; continue</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip — I'll just browse"
        onPress={onSkip}
        style={({ focused, pressed }: PressState) => [
          styles.secondaryButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Skip — I&apos;ll just browse</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: { padding: 24, gap: 8 },
  heading: {
    fontSize: 22,
    lineHeight: 30,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  explanation: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 12,
  },
  group: { marginTop: 12, gap: 4 },
  groupTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12,
  },
  // v3 §3 retires the grey. Disabled is carried by the row opacity and by
  // accessibilityState.disabled — never by a text colour, which is what
  // WCAG 1.4.1 requires anyway.
  disabledRow: { opacity: 0.45 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: tokens.inkSecondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  boxChecked: { backgroundColor: tokens.ink, borderColor: tokens.ink },
  boxMark: { color: tokens.paper, fontSize: 16, fontWeight: "700", lineHeight: 18 },
  checkboxLabel: {
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
    marginTop: 24,
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
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
