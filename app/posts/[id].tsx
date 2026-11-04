import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import {
  addUpbeat,
  buildCommentTree,
  createComment,
  getPost,
  listComments,
  listMyUpbeats,
  removeUpbeat,
  timeAgo,
  type CommentRow,
  type PostListItem,
} from "../../src/lib/social";
import { CommentThread } from "../../src/components/CommentThread";
import { DisclaimerBand } from "../../src/components/DisclaimerBand";
import { UpbeatButton } from "../../src/components/UpbeatButton";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";
import { ReportControl } from "../../src/components/moderation/ReportControl";
import { BlockControl } from "../../src/components/moderation/BlockControl";
import { RemovalNotice } from "../../src/components/moderation/RemovalNotice";
import { CrisisShowGate } from "../../src/components/moderation/CrisisShowGate";
import { MutedPost } from "../../src/components/moderation/MutedPost";
import { focusTargetRef } from "../../src/components/moderation/panel";
import {
  blockMember,
  getGates,
  myModerationNotices,
  publishedCrisisTerms,
  reportContent,
} from "../../src/lib/moderation/api";
import { listMutedWords } from "../../src/lib/moderation/mutedWords";
import { firstMatch } from "../../src/lib/moderation/match";

// Thread detail (wireframe B6/C6): the post, its upbeat control, threaded
// comments (each with its own upbeat + reply), and the reply composer.
// Replying to a comment sets the parent; "Cancel reply" returns to the post.
export default function ThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, loading } = useAuth();
  const [post, setPost] = useState<PostListItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [myPostUpbeat, setMyPostUpbeat] = useState(false);
  const [myCommentUpbeats, setMyCommentUpbeats] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Build step 4 (ADR 0022): moderation state of the post, the author's own
  // notice, and the two on-device lists (muted words; the published crisis
  // list). Matching happens here, on this device; nothing is sent.
  const [moderationState, setModerationState] = useState<string>("visible");
  const [notice, setNotice] = useState<{ actionId: string | null; rule: string } | null>(null);
  const [mutedWords, setMutedWords] = useState<string[]>([]);
  const [crisisTerms, setCrisisTerms] = useState<string[]>([]);
  const [blockedAuthor, setBlockedAuthor] = useState(false);
  const [reviewGate, setReviewGate] = useState<"met" | "unmet">("unmet");

  const load = useCallback(async () => {
    if (typeof id !== "string") return;
    try {
      setError(null);
      const found = await getPost(supabase, id);
      if (!found) {
        setNotFound(true);
        return;
      }
      setPost(found);
      // The generated types predate the moderation columns (ADR 0019 build notes).
      const { data: state } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (k: string, v: string) => {
              maybeSingle: () => Promise<{ data: { moderation_state?: string } | null }>;
            };
          };
        };
      })
        .from("posts")
        .select("moderation_state")
        .eq("id", id)
        .maybeSingle();
      setModerationState(state?.moderation_state ?? "visible");
      const notices = await myModerationNotices(supabase).catch(() => []);
      const ownNotice = notices.find((n) => n.post_id === id && n.action === "remove");
      setNotice(
        ownNotice ? { actionId: ownNotice.action_id, rule: ownNotice.floor_item_text ?? "" } : null,
      );
      setMutedWords(await listMutedWords());
      setCrisisTerms(await publishedCrisisTerms(supabase).catch(() => []));
      setReviewGate((await getGates(supabase).catch(() => null))?.G1 ?? "unmet");
      const rows = await listComments(supabase, id);
      setComments(rows);
      const mine = await listMyUpbeats(supabase, {
        postIds: [id],
        commentIds: rows.map((row) => row.id),
      });
      setMyPostUpbeat(mine.postIds.includes(id));
      setMyCommentUpbeats(mine.commentIds);
    } catch {
      setError("We couldn't load this post. Want to try again?");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/sign-in");
        return;
      }
      if (session) load();
    }, [loading, session, load, router]),
  );

  async function togglePostUpbeat(next: boolean) {
    if (typeof id !== "string") return;
    if (next) await addUpbeat(supabase, { postId: id });
    else await removeUpbeat(supabase, { postId: id });
    setMyPostUpbeat(next);
  }

  async function toggleCommentUpbeat(commentId: string, next: boolean) {
    if (next) await addUpbeat(supabase, { commentId });
    else await removeUpbeat(supabase, { commentId });
    setMyCommentUpbeats((ids) =>
      next ? [...ids, commentId] : ids.filter((cid) => cid !== commentId),
    );
  }

  async function submitReply() {
    if (typeof id !== "string" || !replyBody.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createComment(supabase, {
        postId: id,
        parentCommentId: replyingTo?.id ?? null,
        body: replyBody.trim(),
      });
      setReplyBody("");
      setReplyingTo(null);
      await load();
    } catch {
      setError("We couldn't send that reply. Want to try again?");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.help}>
          {"We couldn't find that post. It may have been removed by its author."}
        </Text>
      </View>
    );
  }

  if (loading || !session || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  const isProfessional = post.author?.role === "professional";
  const authorName = post.author?.display_name ?? "a member";
  const communityName = post.community?.name ?? "a community";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {post.community ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${communityName}`}
          onPress={() => router.push(`/communities/${post.community!.slug}`)}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>← {communityName}</Text>
        </Pressable>
      ) : null}

      {(() => {
        const isMine = session.user.id === post.author_id;
        // A neutral heading for every state that hides the post, so the title
        // (which may hold the muted word, the crisis words, or the removed
        // text) is hidden with it. It keeps the id the Block fallback uses.
        const neutral = (text: string) => (
          <Text
            style={styles.heading}
            accessibilityRole="header"
            nativeID="thread-heading"
            ref={focusTargetRef("thread-heading")}
            {...({ tabIndex: -1 } as object)}
          >
            {text}
          </Text>
        );
        // withId: only the title that stands alone carries the heading id, so a
        // folded post never repeats the neutral heading's id.
        const fullView = (withId: boolean) => (
          <>
          <Text
            style={styles.heading}
            // Inside a fold the neutral heading is the page's heading; the
            // revealed title is not a second one.
            accessibilityRole={withId ? "header" : undefined}
            nativeID={withId ? "thread-heading" : undefined}
            ref={withId ? focusTargetRef("thread-heading") : undefined}
            {...({ tabIndex: -1 } as object)}
          >
            {post.title}
          </Text>
          <Text style={styles.meta}>
            in {communityName} · by {authorName} · {timeAgo(post.created_at)}
          </Text>
          {post.author_id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${authorName}'s journey`}
              onPress={() => router.push(`/members/${post.author_id}/journey`)}
              style={({ focused, pressed }: PressState) => [
                styles.quietButton,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.quietText}>{authorName}&apos;s journey</Text>
            </Pressable>
          ) : null}
          {isProfessional ? (
            <Text style={styles.verified}>✔ Verified · general education</Text>
          ) : null}
      
            <Text style={styles.body}>{post.body}</Text>
            {isProfessional ? <DisclaimerBand /> : null}
          </>
        );
        if (moderationState === "removed") {
          if (!isMine) {
            return (
              <>
                {neutral("Removed post")}
                <View role="list">
                  <RemovalNotice viewer="other" floorItemText="" crisis={false} />
                </View>
              </>
            );
          }
          // Crisis adjacency: if the post had crisis language, or the rule is
          // about self-harm, the notice carries the resources in its block.
          const crisis =
            firstMatch(`${post.title} ${post.body}`, crisisTerms) !== null ||
            /hurt|harm|suicid|crisis/i.test(notice?.rule ?? "");
          return (
            <>
              {neutral("Your post was removed")}
              <RemovalNotice
                viewer="author"
                floorItemText={notice?.rule ?? ""}
                crisis={crisis}
                onAskAgain={
                  notice?.actionId
                    ? () => router.push(`/appeal/${notice.actionId}`)
                    : undefined
                }
              />
            </>
          );
        }
        if (blockedAuthor) {
          return (
            <>
              {neutral("Post hidden")}
              <Text style={styles.help}>You blocked {authorName}. Their posts are hidden.</Text>
            </>
          );
        }
        const text = `${post.title} ${post.body}`;
        const muted = isMine ? null : firstMatch(text, mutedWords);
        if (muted) {
          return (
            <>
              {neutral("A post you folded away")}
              <MutedPost word={muted}>{fullView(false)}</MutedPost>
            </>
          );
        }
        if (!isMine && firstMatch(text, crisisTerms)) {
          return (
            <>
              {neutral("A post about very hard feelings")}
              <CrisisShowGate>{fullView(false)}</CrisisShowGate>
            </>
          );
        }
        return fullView(true);
      })()}

      {session.user.id !== post.author_id && moderationState !== "removed" && !blockedAuthor ? (
        <View style={styles.moderationRow}>
          <ReportControl
            subjectKind="post"
            authorName={authorName}
            reviewGate={reviewGate}
            onSubmit={({ reason, note }) =>
              reportContent(supabase, { postId: post.id, reason, note })
            }
          />
          {post.author_id ? (
            <BlockControl
              memberName={authorName}
              fallbackFocusId="thread-heading"
              onBlock={async () => {
                await blockMember(supabase, post.author_id!);
                setBlockedAuthor(true);
              }}
            />
          ) : null}
        </View>
      ) : null}

      <UpbeatButton
        count={post.upbeat_count}
        upbeated={myPostUpbeat}
        subjectLabel="this post"
        onToggle={togglePostUpbeat}
      />

      <View style={styles.divider} />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Replies
      </Text>

      {comments === null ? (
        <ActivityIndicator color={tokens.ink} />
      ) : comments.length === 0 ? (
        <Text style={styles.help}>
          No replies yet. A kind word goes a long way.
        </Text>
      ) : (
        <CommentThread
          nodes={buildCommentTree(comments)}
          myUpbeatedIds={myCommentUpbeats}
          onToggleUpbeat={toggleCommentUpbeat}
          onReply={(comment) => setReplyingTo(comment)}
        />
      )}

      <View style={styles.replyBox}>
        <Text style={styles.label} nativeID="replyLabel">
          {replyingTo
            ? `Replying to ${replyingTo.authorName}`
            : "Write a reply"}
        </Text>
        {replyingTo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply and respond to the post instead"
            onPress={() => setReplyingTo(null)}
            style={({ focused, pressed }: PressState) => [
              styles.quietButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.quietText}>Cancel reply</Text>
          </Pressable>
        ) : null}
        <TextInput
          style={styles.input}
          value={replyBody}
          onChangeText={setReplyBody}
          accessibilityLabel={
            replyingTo ? `Reply to ${replyingTo.authorName}` : "Write a reply"
          }
          aria-labelledby="replyLabel"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post reply"
          accessibilityState={{ disabled: !replyBody.trim() || busy }}
          disabled={!replyBody.trim() || busy}
          onPress={submitReply}
          style={({ focused, pressed }: PressState) => [
            styles.primaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
            (!replyBody.trim() || busy) && styles.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={tokens.paper} />
          ) : (
            <Text style={styles.primaryText}>Post reply</Text>
          )}
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  moderationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: {
    padding: 24,
    gap: 8,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
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
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: tokens.line,
    marginVertical: 12,
  },
  replyBox: { gap: 8, marginTop: 16 },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: tokens.inkSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    alignSelf: "flex-start",
  },
  primaryText: {
    color: tokens.paper,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  quietButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  quietText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
