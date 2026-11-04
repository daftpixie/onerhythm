import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CommentTreeNode } from "../lib/social";
import { timeAgo } from "../lib/social";
import { type PressState } from "../lib/pressable";
import { DisclaimerBand } from "./DisclaimerBand";
import { UpbeatButton } from "./UpbeatButton";
import { tokens, focus } from "../theme/tokens";

export interface CommentThreadProps {
  nodes: CommentTreeNode[];
  myUpbeatedIds: string[];
  onToggleUpbeat: (commentId: string, next: boolean) => Promise<unknown>;
  onReply: (comment: { id: string; authorName: string }) => void;
}

// Threaded comments on a narrow canvas (wireframe B6/C6): 12px indent per
// depth, CAPPED at depth 4 — deeper replies stay at the cap and name their
// parent in plain words ("Replying to Ben") so nesting never crushes the
// text column under zoom/reflow. Every node has its own upbeat control and
// reply action; professional authors always wear the DisclaimerBand.
const INDENT_PER_DEPTH = 12;
const DEPTH_CAP = 4;

interface NodeViewProps extends Omit<CommentThreadProps, "nodes"> {
  node: CommentTreeNode;
  depth: number;
  parentAuthorName: string | null;
}

function CommentNodeView({
  node,
  depth,
  parentAuthorName,
  myUpbeatedIds,
  onToggleUpbeat,
  onReply,
}: NodeViewProps) {
  const authorName = node.author?.display_name ?? "a member";
  const isProfessional = node.author?.role === "professional";
  const upbeated = myUpbeatedIds.includes(node.id);

  return (
    <Fragment>
      <View
        testID={`comment-${node.id}`}
        style={[
          styles.node,
          { marginLeft: INDENT_PER_DEPTH * Math.min(depth, DEPTH_CAP) },
        ]}
      >
        {depth > DEPTH_CAP && parentAuthorName ? (
          <Text style={styles.replyingTo}>Replying to {parentAuthorName}</Text>
        ) : null}
        <Text style={styles.meta}>
          {authorName} · {timeAgo(node.created_at)}
        </Text>
        {isProfessional ? (
          <Text style={styles.verified}>✔ Verified · general education</Text>
        ) : null}
        <Text style={styles.body}>{node.body}</Text>
        {isProfessional ? <DisclaimerBand /> : null}
        <View style={styles.actions}>
          <UpbeatButton
            count={node.upbeat_count}
            upbeated={upbeated}
            subjectLabel={`comment by ${authorName}`}
            onToggle={(next) => onToggleUpbeat(node.id, next)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${authorName}`}
            onPress={() => onReply({ id: node.id, authorName })}
            style={({ focused, pressed }: PressState) => [
              styles.replyButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.replyText}>💬 Reply</Text>
          </Pressable>
        </View>
      </View>
      {node.children.map((child) => (
        <CommentNodeView
          key={child.id}
          node={child}
          depth={depth + 1}
          parentAuthorName={authorName}
          myUpbeatedIds={myUpbeatedIds}
          onToggleUpbeat={onToggleUpbeat}
          onReply={onReply}
        />
      ))}
    </Fragment>
  );
}

export function CommentThread({
  nodes,
  myUpbeatedIds,
  onToggleUpbeat,
  onReply,
}: CommentThreadProps) {
  return (
    <View>
      {nodes.map((node) => (
        <CommentNodeView
          key={node.id}
          node={node}
          depth={0}
          parentAuthorName={null}
          myUpbeatedIds={myUpbeatedIds}
          onToggleUpbeat={onToggleUpbeat}
          onReply={onReply}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    borderLeftWidth: 1,
    borderLeftColor: tokens.line,
    paddingLeft: 12,
    paddingVertical: 8,
    gap: 4,
  },
  replyingTo: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
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
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  replyButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
