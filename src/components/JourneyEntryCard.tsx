import { Pressable, StyleSheet, Text, View } from "react-native";
import type { JourneyEntry } from "../lib/social";
import { timeAgo } from "../lib/social";
import { type PressState } from "../lib/pressable";
import { tokens, focus, space } from "../theme/tokens";

export interface JourneyEntryCardProps {
  entry: JourneyEntry;
  /** Own list shows the Draft/Published chip; other-member views don't. */
  showStatus?: boolean;
  onPress?: () => void;
}

// One journey entry in a list (wireframe B7). Status is a TEXT chip, never
// color alone. No DisclaimerBand here — journey entries are lived stories,
// not education (ADR 0009 decision b).
export function JourneyEntryCard({
  entry,
  showStatus = false,
  onPress,
}: JourneyEntryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.title}${
        showStatus ? (entry.is_published ? ", published" : ", draft") : ""
      }`}
      accessibilityHint="Open this journey entry"
      onPress={onPress}
      style={({ focused, pressed }: PressState) => [
        styles.card,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      {showStatus ? (
        <View
          style={styles.chip}
        >
          <Text style={styles.chipText}>
            {entry.is_published ? "Published" : "Draft"}
          </Text>
        </View>
      ) : null}
      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.meta}>
        {timeAgo(entry.created_at)} · ♥ {entry.upbeat_count} Upbeats
      </Text>
      <Text style={styles.preview} numberOfLines={3}>
        {entry.body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 12,
    backgroundColor: tokens.paper,
    padding: space.card,
    gap: 6,
  },
  // v3 §3 retires the semantic border. Draft vs Published was ALREADY carried
  // by the chip's own text and by the card's accessibilityLabel — the green
  // border was reinforcement, so removing it costs no meaning. One chip
  // treatment now serves both states.
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: tokens.fill,
  },
  chipText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  title: {
    fontSize: 20,
    lineHeight: 30,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  meta: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  preview: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
