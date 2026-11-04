import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { JourneyEntry } from "../lib/social";
import { timeAgo } from "../lib/social";
import { type PressState } from "../lib/pressable";
import { UpbeatButton } from "./UpbeatButton";
import { tokens, focus, space } from "../theme/tokens";

export interface JourneyEntryViewProps {
  entry: JourneyEntry;
  isOwner: boolean;
  upbeated: boolean;
  onToggleUpbeat: (next: boolean) => Promise<unknown>;
  onEdit: () => void;
  onTogglePublish: () => void;
  /** Called ONLY after the member confirms — never on the first press. */
  onDelete: () => void;
}

// Long-form reading view (Brand v3 §4): 18px body, 1.6 line-height, ~70ch
// measure, Atkinson Hyperlegible. No DisclaimerBand — these are lived
// stories, not education (ADR 0009 decision b). Deleting uses the Brand §8
// destructive pattern with a REQUIRED inline confirmation step.
export function JourneyEntryView({
  entry,
  isOwner,
  upbeated,
  onToggleUpbeat,
  onEdit,
  onTogglePublish,
  onDelete,
}: JourneyEntryViewProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Focus management for the confirmation step (WCAG 4.1.3): when the region
  // opens, focus lands on the SAFE control ("Keep it" — Enter cancels, never
  // deletes); when it closes, focus returns to the trigger. RNW exposes
  // .focus() on focusable hosts; on native it's a guarded no-op and the
  // live region below carries the announcement.
  const keepItRef = useRef<View>(null);
  const deleteTriggerRef = useRef<View>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    const focusable = (
      confirmingDelete ? keepItRef.current : deleteTriggerRef.current
    ) as { focus?: () => void } | null;
    if (confirmingDelete || wasConfirming.current) focusable?.focus?.();
    wasConfirming.current = confirmingDelete;
  }, [confirmingDelete]);

  return (
    <View testID="journey-measure" style={styles.measure}>
      <Text style={styles.title} accessibilityRole="header">
        {entry.title}
      </Text>
      <Text style={styles.meta}>
        by {entry.author?.display_name ?? "a member"} ·{" "}
        {timeAgo(entry.created_at)}
        {isOwner ? ` · ${entry.is_published ? "Published" : "Draft"}` : ""}
      </Text>

      <Text testID="journey-body" style={styles.body}>
        {entry.body}
      </Text>

      <UpbeatButton
        count={entry.upbeat_count}
        upbeated={upbeated}
        subjectLabel="this journey entry"
        onToggle={onToggleUpbeat}
      />

      {isOwner ? (
        <View style={styles.ownerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit this entry"
            onPress={onEdit}
            style={({ focused, pressed }: PressState) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.secondaryText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={entry.is_published ? "Unpublish" : "Publish"}
            onPress={onTogglePublish}
            style={({ focused, pressed }: PressState) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.secondaryText}>
              {entry.is_published ? "Unpublish" : "Publish"}
            </Text>
          </Pressable>
          <Pressable
            ref={deleteTriggerRef}
            accessibilityRole="button"
            accessibilityLabel="Delete this entry"
            onPress={() => setConfirmingDelete(true)}
            style={({ focused, pressed }: PressState) => [
              styles.destructiveButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.destructiveText}>Delete this entry</Text>
          </Pressable>
        </View>
      ) : null}

      {isOwner && confirmingDelete ? (
        <View accessibilityLiveRegion="polite" style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            {
              "This deletes the entry for good. There's no undo. Your story, your call."
            }
          </Text>
          <View style={styles.confirmRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes, delete it"
              onPress={() => {
                setConfirmingDelete(false);
                onDelete();
              }}
              style={({ focused, pressed }: PressState) => [
                styles.destructiveButton,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.destructiveText}>Yes, delete it</Text>
            </Pressable>
            <Pressable
              ref={keepItRef}
              accessibilityRole="button"
              accessibilityLabel="Keep it"
              onPress={() => setConfirmingDelete(false)}
              style={({ focused, pressed }: PressState) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.secondaryText}>Keep it</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 42,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  meta: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  // Brand v3 §4 long-form reading: 18px, 1.6 line-height (29px), Atkinson.
  body: {
    fontSize: 18,
    lineHeight: 29,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tokens.paper,
  },
  secondaryText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  // Brand §8 destructive: Paper fill, Heart Deep text + border, explicit label.
  destructiveButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.pulse,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tokens.paper,
  },
  destructiveText: {
    color: tokens.pulse,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  confirmBox: {
    borderWidth: 1,
    borderColor: tokens.pulse,
    borderRadius: 12,
    backgroundColor: tokens.paper,
    padding: space.card,
    gap: 12,
  },
  confirmText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
