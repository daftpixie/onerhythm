import { Pressable, StyleSheet, Text } from "react-native";
import type { PostListItem } from "../lib/social";
import { timeAgo } from "../lib/social";
import { type PressState } from "../lib/pressable";
import { DisclaimerBand } from "./DisclaimerBand";
import { tokens, focus, space } from "../theme/tokens";

/**
 * Folded on this device (plan §4.8; Q8): the reader muted a word in it, or it
 * matches the published crisis list. The card then shows why, never the title
 * or preview, and opening it leads to the same fold on the post's page.
 */
export type PostFold = { kind: "muted"; word: string } | { kind: "crisis" };

export interface PostCardProps {
  post: PostListItem;
  onPress?: () => void;
  fold?: PostFold | null;
}

// One feed/community card (wireframe B4/C4): meta line, title, short body
// preview, counts as TEXT (the upbeat TOGGLE lives on the thread screen — a
// nested control inside a pressable card is a keyboard/screen-reader trap).
// A professional author always wears "✔ Verified" + the DisclaimerBand.
export function PostCard({ post, onPress, fold }: PostCardProps) {
  const isProfessional = post.author?.role === "professional";
  const communityName = post.community?.name ?? "a community";
  const authorName = post.author?.display_name ?? "a member";

  if (fold) {
    const why =
      fold.kind === "muted"
        ? `Folded away because of the word '${fold.word}'. Open to see it.`
        : "This post talks about very hard feelings. Open to see it.";
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={why}
        accessibilityHint={`Open this post from ${communityName}`}
        onPress={onPress}
        style={({ focused, pressed }: PressState) => [
          styles.card,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.meta}>
          in {communityName} · by {authorName} · {timeAgo(post.created_at)}
        </Text>
        <Text style={styles.preview}>{why}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      // Information parity for screen readers: the visible card shows the
      // verified badge and counts, so the accessible name carries them too.
      accessibilityLabel={`${post.title}${
        isProfessional ? ", from a verified professional" : ""
      } — ${post.upbeat_count} upbeats, ${post.comment_count} replies`}
      accessibilityHint={`Open this post from ${communityName}`}
      onPress={onPress}
      style={({ focused, pressed }: PressState) => [
        styles.card,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      <Text style={styles.meta}>
        in {communityName} · by {authorName} · {timeAgo(post.created_at)}
      </Text>
      {isProfessional ? (
        <Text style={styles.verified}>✔ Verified · general education</Text>
      ) : null}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.preview} numberOfLines={2}>
        {post.body}
      </Text>
      {isProfessional ? <DisclaimerBand /> : null}
      <Text style={styles.counts}>
        ♥ {post.upbeat_count} Upbeats · 💬 {post.comment_count} replies
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
  meta: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  verified: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  preview: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  counts: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
