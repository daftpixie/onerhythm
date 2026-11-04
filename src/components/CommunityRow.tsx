import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CommunitySummary } from "../lib/social";
import { type PressState } from "../lib/pressable";
import { tokens, focus, space } from "../theme/tokens";

export interface CommunityRowProps {
  community: CommunitySummary;
  joined: boolean;
  /** false while signed out — the row still opens, but join is hidden. */
  canJoin: boolean;
  busy?: boolean;
  onOpen: () => void;
  onToggleJoin: () => void;
}

// One community in the browse list (wireframe C5): the row opens the
// community; the explicit Join/Leave button (icon-free, full words, named
// with the community) manages membership. Leave is reversible, so no
// confirmation step is required.
export function CommunityRow({
  community,
  joined,
  canJoin,
  busy = false,
  onOpen,
  onToggleJoin,
}: CommunityRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${community.name}`}
        onPress={onOpen}
        style={({ focused, pressed }: PressState) => [
          styles.openArea,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.name}>{community.name}</Text>
        {community.description ? (
          <Text style={styles.description}>{community.description}</Text>
        ) : null}
      </Pressable>
      {canJoin ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            joined ? `Leave ${community.name}` : `Join ${community.name}`
          }
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onToggleJoin}
          style={({ focused, pressed }: PressState) => [
            styles.joinButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
            busy && styles.disabled,
          ]}
        >
          <Text style={styles.joinText}>{joined ? "Leave" : "Join"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 12,
    backgroundColor: tokens.paper,
    padding: space.card,
  },
  openArea: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    gap: 2,
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  joinButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tokens.paper,
  },
  joinText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
