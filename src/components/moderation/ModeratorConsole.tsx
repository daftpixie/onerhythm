import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { type PressState } from "../../lib/pressable";
import { tokens } from "../../theme/tokens";
import { MAIN_ID, useBeforeMain } from "../AppShell";
import { useAnnounce } from "../StatusRegion";
import {
  HANDLED_ELSEWHERE,
  ModerationQueue,
  queueHeadingId,
  queueOpenId,
  type QueueItem,
} from "./ModerationQueue";
import { focusById, focusNode, focusTargetRef } from "./panel";
import { mod } from "./styles";

// The moderator console (ADR 0022; plan §4.2, §5.5; Wireframes Addendum A,
// B15). Its own page under AppShell: the moderator navigation (with a skip
// link past it) sits before main; inside main are the queue and an item pane,
// side by side when wide and one column when narrow.
//
// - Realtime never moves focus or reorders (ModerationQueue; T15).
// - Moderators act under their pseudonym. The client never holds a member id:
//   items carry only an item id, a category, a tier and an age (ADR 0019).
// - Every action records a reason and cites exactly one rule: a safety-floor
//   item for Tier 3, a community guideline for Tier 1 (moderate(); T9).
// - Tier 3 is never routed to a vote: there is no panel or vote control here.
// - Bans (Q9): safety floor only, an end date within max_ban_term, and a
//   second moderator confirms. While max_ban_term is not set, none is offered.
// - Crisis, harassment and unknown categories keep their content behind
//   "Show this content", never auto-expanded (moderator care).
// - The session warning comes at least 20 seconds ahead (here, 60), with
//   "Stay signed in", and keeps every typed reason (SC 2.2.1).
//
// This component is reachable only when a member holds a moderator grant.
// While G4 is unmet nobody can, and the route shows ConsoleUnavailable.

export type { QueueItem } from "./ModerationQueue";

export type ActionKind =
  | "no_action"
  | "remove"
  | "lock"
  | "escalate"
  | "request_edit"
  | "temporary_ban"
  | "sent_crisis_resources";

export type Tier1Rule = "off_topic" | "unkind";

export interface ModerationActionInput {
  kind: ActionKind;
  reason: string;
  floorItemId?: string;
  tier1Rule?: Tier1Rule;
  /** ISO time. Only for temporary_ban. */
  endsAt?: string;
}

export interface ModeratorConsoleProps {
  items: QueueItem[];
  onAction: (itemId: string, action: ModerationActionInput) => Promise<void>;
  /** Loads the item's text when it is opened. null: no longer available. */
  loadContent?: (itemId: string) => Promise<string | null>;
  /** The current safety-floor items, for citing on Tier 3 actions. */
  floorItems?: Array<{ id: string; text: string }>;
  /** max_ban_term in whole days; null while it is not set (G9). */
  maxBanTermDays?: number | null;
  gates?: { G1: "met" | "unmet" };
  /** When the session ends (ms since the epoch). */
  sessionExpiresAt?: number;
  onStaySignedIn?: () => Promise<void>;
  /** Read the queue again. Resolves with the item ids now in it. */
  onRefresh?: () => Promise<string[] | void>;
  /** True only once a Realtime feed drives `items`. */
  live?: boolean;
}

const WARN_AHEAD_MS = 60_000;
const REASON_MAX = 280;
const BAN_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 24 * 3600 * 1000;

/**
 * Categories whose content is shown in the pane at once. Every other one,
 * crisis, harassment, doxxing, illegal and any key this build does not know,
 * opens only behind "Show this content" (an allow-list, so it fails closed).
 */
const NOT_SENSITIVE = new Set(["dangerous_misinfo", "impersonation", "spam", "scam", "other_safety", "tier1"]);
const isSensitive = (item: QueueItem) => !item.categoryKey || !NOT_SENSITIVE.has(item.categoryKey);
/** Categories this build knows how to act on. */
const KNOWN = new Set([...NOT_SENSITIVE, "crisis", "harassment", "doxxing", "illegal"]);

const TIER1_RULES: Array<{ value: Tier1Rule; label: string }> = [
  { value: "off_topic", label: "Off topic" },
  { value: "unkind", label: "Unkind" },
];

type Choice =
  | "noAction"
  | "remove"
  | "lock"
  | "escalate"
  | "requestEdit"
  | "ban"
  | "sendCrisis";

const CHOICES: Record<Choice, { label: string; kind: ActionKind }> = {
  noAction: { label: "No action needed", kind: "no_action" },
  remove: { label: "Remove it (safety floor)", kind: "remove" },
  lock: { label: "Lock the thread", kind: "lock" },
  escalate: { label: "Ask another moderator", kind: "escalate" },
  requestEdit: { label: "Ask the author to edit", kind: "request_edit" },
  ban: { label: "Propose a temporary ban", kind: "temporary_ban" },
  sendCrisis: { label: "Send crisis resources to the member", kind: "sent_crisis_resources" },
};

/** Ban lengths offered: whole days within max_ban_term. None while it is unset (G9). */
const banLengths = (maxBanTermDays: number | null) =>
  maxBanTermDays ? BAN_DAYS.filter((d) => d <= maxBanTermDays) : [];

/** What a moderator may do with an item. Tier 3 never goes to a vote. */
function choicesFor(item: QueueItem, maxBanTermDays: number | null, g1: "met" | "unmet"): Choice[] {
  const tier = item.tier ?? 3;
  const isPost = item.subjectKind !== "comment";
  // A category this build does not know: only the actions that change nothing
  // about the content (fails closed, like Show this content).
  if (item.categoryKey && !KNOWN.has(item.categoryKey)) return ["noAction", "escalate"];
  if (!item.categoryKey) return ["noAction", "escalate"];
  if (item.categoryKey === "crisis") {
    // Never removed, banned or locked; resources only once G1 is met.
    return ["noAction", "escalate", ...(g1 === "met" ? (["sendCrisis"] as Choice[]) : [])];
  }
  if (tier === 1) {
    // A Tier 1 item is never removed or banned. No lock either: until
    // elections every grant is interim, and moderate() refuses an interim
    // moderator a Tier 1 lock (T24), so offering it would only fail.
    return ["noAction", "requestEdit", "escalate"];
  }
  return [
    "noAction",
    "remove",
    ...(isPost ? (["lock"] as Choice[]) : []),
    "escalate",
    ...(banLengths(maxBanTermDays).length > 0 ? (["ban"] as Choice[]) : []),
  ];
}

interface Draft {
  choice: Choice | null;
  rule: string | null;
  banDays: number | null;
  reason: string;
}
const EMPTY: Draft = { choice: null, rule: null, banDays: null, reason: "" };

const focusRingStyle = ({ focused, pressed }: PressState) => [
  mod.button,
  pressed && mod.pressed,
  focused && mod.focusRing,
];

/** The skip link and the moderator navigation. Before main under AppShell. */
function ConsoleNav({ headingTarget }: { headingTarget: string }) {
  return (
    <View style={styles.nav}>
      <Pressable
        role="link"
        accessibilityRole="link"
        {...({ href: `#${MAIN_ID}` } as object)}
        onPress={(e: unknown) => {
          (e as { preventDefault?: () => void })?.preventDefault?.();
          if (!focusById(MAIN_ID)) focusById(headingTarget);
        }}
        style={({ focused, pressed }: PressState) => [mod.link, pressed && mod.pressed, focused && mod.focusRing]}
      >
        <Text style={mod.link}>Skip to the queue</Text>
      </Pressable>
      <View role="navigation" aria-label="Moderator navigation">
        <Pressable
          role="link"
          accessibilityRole="link"
          aria-current="page"
          {...({ href: "/moderation" } as object)}
          onPress={(e: unknown) => {
            // This page: stay here (and keep any typed reason).
            (e as { preventDefault?: () => void })?.preventDefault?.();
          }}
          style={({ focused, pressed }: PressState) => [mod.link, pressed && mod.pressed, focused && mod.focusRing]}
        >
          <Text style={mod.link}>Queue (this page)</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ModeratorConsole({
  items,
  onAction,
  loadContent,
  floorItems = [],
  maxBanTermDays = null,
  gates = { G1: "unmet" },
  sessionExpiresAt,
  onStaySignedIn,
  onRefresh,
  live = true,
}: ModeratorConsoleProps) {
  const announce = useAnnounce();
  const uid = useId().replace(/:/g, "");
  const prefix = `console-${uid}`;
  const pageHeadingId = `${prefix}-title`;
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  // The navigation goes before main when AppShell is there; inline otherwise.
  const nav = useMemo(() => <ConsoleNav headingTarget={pageHeadingId} />, [pageHeadingId]);
  const navPlaced = useBeforeMain(nav);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const [openId, setOpenId] = useState<string | null>(null);
  // A copy of the open item, so the pane (and its typed reason) stays if
  // another reviewer handles it.
  const [openItem, setOpenItem] = useState<QueueItem | null>(null);
  const [handledElsewhere, setHandledElsewhere] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [errors, setErrors] = useState<Partial<Record<"choice" | "rule" | "banDays" | "reason", string>>>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const actedOn = useRef(new Set<string>());

  const [content, setContent] = useState<{ state: "idle" | "loading" | "ready" | "gone" | "failed"; text?: string }>({ state: "idle" });
  // The item a content request is for. A late answer for another item is dropped.
  const contentFor = useRef<string | null>(null);
  const [shown, setShown] = useState(false);

  const [warn, setWarn] = useState(false);

  const paneHeadingRef = useRef<Text>(null);
  const firstChoiceRef = useRef<View>(null);
  const firstRuleRef = useRef<View>(null);
  const firstBanRef = useRef<View>(null);
  const reasonRef = useRef<TextInput>(null);

  const ids = {
    pane: `${prefix}-pane`,
    paneHeading: `${prefix}-pane-heading`,
    content: `${prefix}-content`,
    choiceLegend: `${prefix}-choice-legend`,
    choiceError: `${prefix}-choice-error`,
    ruleLegend: `${prefix}-rule-legend`,
    ruleError: `${prefix}-rule-error`,
    banLegend: `${prefix}-ban-legend`,
    banError: `${prefix}-ban-error`,
    banNote: `${prefix}-ban-note`,
    reasonLabel: `${prefix}-reason-label`,
    reasonError: `${prefix}-reason-error`,
    reasonCount: `${prefix}-reason-count`,
    reasonHint: `${prefix}-reason-hint`,
  };

  // The open item left the server's list.
  useLayoutEffect(() => {
    if (!openId) return;
    const current = byId.get(openId);
    if (current) {
      setOpenItem(current);
      return;
    }
    if (!actedOn.current.has(openId) && !handledElsewhere) {
      setHandledElsewhere(true);
      announce(HANDLED_ELSEWHERE);
    }
  }, [byId, openId, handledElsewhere, announce]);

  // Session expiry: one timer, set for the warning moment; nothing ticks.
  useEffect(() => {
    setWarn(false);
    if (!sessionExpiresAt) return;
    const delay = sessionExpiresAt - WARN_AHEAD_MS - Date.now();
    if (delay <= 0) {
      setWarn(true);
      return;
    }
    const t = setTimeout(() => setWarn(true), delay);
    return () => clearTimeout(t);
  }, [sessionExpiresAt]);

  useEffect(() => {
    if (warn) announce("You'll be signed out in about a minute. Anything you typed stays here.");
  }, [warn, announce]);

  async function stay() {
    try {
      await onStaySignedIn?.();
      setWarn(false);
      // The button is gone; focus goes to the page heading, never body.
      focusById(pageHeadingId);
      announce("You're still signed in.");
    } catch {
      announce("We couldn't keep you signed in. Copy anything you typed before you sign in again.");
    }
  }

  function open(id: string) {
    const item = byId.get(id);
    if (!item) return;
    setOpenId(id);
    setOpenItem(item);
    setHandledElsewhere(false);
    setErrors({});
    setFailed(false);
    setShown(false);
    contentFor.current = id;
    setContent({ state: loadContent ? "loading" : "idle" });
    if (loadContent) {
      loadContent(id).then(
        (text) => {
          if (contentFor.current === id) setContent(text === null ? { state: "gone" } : { state: "ready", text });
        },
        () => {
          if (contentFor.current === id) setContent({ state: "failed" });
        },
      );
    }
  }

  /** Close the pane and forget the item's text. */
  function closePane() {
    contentFor.current = null;
    setContent({ state: "idle" });
    setShown(false);
    setOpenId(null);
    setOpenItem(null);
    setHandledElsewhere(false);
  }

  // Forget any loaded text when the console goes away.
  useEffect(() => () => {
    contentFor.current = null;
  }, []);

  // Focus the pane's heading once it shows the item that was opened.
  const focusPane = useRef(false);
  useEffect(() => {
    if (focusPane.current && openId) {
      focusPane.current = false;
      focusNode(paneHeadingRef.current);
    }
  }, [openId]);

  const draft = (openId && drafts[openId]) || EMPTY;
  const setDraft = (patch: Partial<Draft>) => {
    if (!openId) return;
    setDrafts((d) => ({ ...d, [openId]: { ...(d[openId] ?? EMPTY), ...patch } }));
  };

  const item = openItem;
  const tier = item?.tier ?? 3;
  const choices = item ? choicesFor(item, maxBanTermDays, gates.G1) : [];
  const rules: Array<{ id: string; label: string }> =
    tier === 1 ? TIER1_RULES.map((r) => ({ id: r.value, label: r.label })) : floorItems.map((f) => ({ id: f.id, label: f.text }));
  const banDays = banLengths(maxBanTermDays);

  async function apply() {
    if (!item || !openId || busy || handledElsewhere) return;
    const next: typeof errors = {};
    if (!draft.choice || !choices.includes(draft.choice)) next.choice = "Choose what you want to do.";
    if (!draft.rule || !rules.some((r) => r.id === draft.rule)) next.rule = "Choose the rule you checked this against.";
    if (draft.choice === "ban" && !draft.banDays) next.banDays = "Choose how long the ban lasts.";
    if (!draft.reason.trim()) next.reason = "Write a reason for this action.";
    setErrors(next);
    if (next.choice) return focusNode(firstChoiceRef.current);
    if (next.rule) return focusNode(firstRuleRef.current);
    if (next.banDays) return focusNode(firstBanRef.current);
    if (next.reason) return focusNode(reasonRef.current);

    const choice = draft.choice as Choice;
    const action: ModerationActionInput = { kind: CHOICES[choice].kind, reason: draft.reason.trim() };
    if (tier === 1) action.tier1Rule = draft.rule as Tier1Rule;
    else action.floorItemId = draft.rule as string;
    if (choice === "ban") action.endsAt = new Date(Date.now() + (draft.banDays as number) * DAY_MS).toISOString();

    setBusy(true);
    setFailed(false);
    const id = openId;
    actedOn.current.add(id);
    try {
      await onAction(id, action);
      // Focus moves to the next row before the pane closes, never to body.
      const list = items.map((i) => i.id);
      const at = list.indexOf(id);
      const target = list.slice(at + 1)[0] ?? list.slice(0, Math.max(at, 0)).reverse()[0];
      if (!(target && focusById(queueOpenId(prefix, target)))) focusById(queueHeadingId(prefix));
      setDrafts((d) => {
        const rest = { ...d };
        delete rest[id];
        return rest;
      });
      closePane();
      // A ban is only proposed: it starts when a second moderator confirms it (Q9).
      announce(choice === "ban" ? "Ban proposed. It starts only when a second moderator confirms it." : "Action applied.");
    } catch {
      actedOn.current.delete(id);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const radio = (
    key: string,
    label: string,
    checked: boolean,
    onPress: () => void,
    ref?: Ref<View>,
  ) => (
    <Pressable
      key={key}
      ref={ref}
      onPress={onPress}
      role="radio"
      accessibilityRole="radio"
      aria-checked={checked}
      accessibilityState={{ checked }}
      aria-label={label}
      style={({ focused, pressed }: PressState) => [styles.radioRow, pressed && mod.pressed, focused && mod.focusRing]}
    >
      <Text style={mod.body} aria-hidden>
        {checked ? "◉" : "○"} {label}
      </Text>
    </Pressable>
  );

  const pane = !item ? (
    <Text style={mod.body}>Choose Open on an item to see it here.</Text>
  ) : (
    <View nativeID={ids.pane} role="group" aria-labelledby={ids.paneHeading} style={mod.panel}>
      <Text
        ref={paneHeadingRef}
        nativeID={ids.paneHeading}
        role="heading"
        aria-level={2}
        style={mod.heading}
        {...({ tabIndex: -1 } as object)}
      >
        {item.category}
      </Text>
      <Text style={mod.hint}>
        {item.tierLabel}. {item.ageText}.
      </Text>
      {handledElsewhere && (
        <>
          <Text style={mod.error}>{HANDLED_ELSEWHERE} Nothing you typed is lost.</Text>
          <Pressable
            onPress={() => {
              closePane();
              focusById(queueHeadingId(prefix));
            }}
            role="button"
            accessibilityRole="button"
            style={focusRingStyle}
          >
            <Text style={mod.buttonText}>Close this item</Text>
          </Pressable>
        </>
      )}

      {item.categoryKey === "crisis" && (
        // Plan §5.1: a one-line link to the same resources, for the moderator.
        <Text style={mod.body}>
          <Text>Looking after yourself matters too.</Text> In the US, you can{" "}
          <InlineLink url="tel:988" label="call 988" /> or <InlineLink url="sms:988" label="text 988" />.
        </Text>
      )}

      <Text role="heading" aria-level={3} style={styles.subheading}>
        What was posted
      </Text>
      {content.state === "loading" && <Text style={mod.hint}>Loading the content.</Text>}
      {content.state === "failed" && <Text style={mod.hint}>We couldn&apos;t load the content.</Text>}
      {content.state === "gone" && <Text style={mod.hint}>This content is no longer available.</Text>}
      {content.state === "idle" && <Text style={mod.hint}>The content isn&apos;t shown here.</Text>}
      {content.state === "ready" &&
        (isSensitive(item) ? (
          <>
            <Pressable
              onPress={() => setShown((s) => !s)}
              role="button"
              accessibilityRole="button"
              aria-expanded={shown}
              aria-controls={ids.content}
              accessibilityState={{ expanded: shown }}
              style={focusRingStyle}
            >
              <Text style={mod.buttonText}>{shown ? "Hide this content" : "Show this content"}</Text>
            </Pressable>
            {shown && (
              <View nativeID={ids.content} style={styles.content}>
                <Text style={mod.body}>{content.text}</Text>
              </View>
            )}
          </>
        ) : (
          <View nativeID={ids.content} style={styles.content}>
            <Text style={mod.body}>{content.text}</Text>
          </View>
        ))}

      <Text nativeID={ids.choiceLegend} role="heading" aria-level={3} style={styles.subheading}>
        What do you want to do?
      </Text>
      <View
        role="radiogroup"
        aria-labelledby={ids.choiceLegend}
        aria-invalid={errors.choice ? true : undefined}
        aria-describedby={errors.choice ? ids.choiceError : undefined}
      >
        {choices.map((c, i) =>
          radio(c, CHOICES[c].label, draft.choice === c, () => {
            setDraft({ choice: c, banDays: c === "ban" ? draft.banDays : null });
            setErrors((e) => ({ ...e, choice: undefined }));
          }, i === 0 ? firstChoiceRef : undefined),
        )}
      </View>
      {errors.choice && (
        <Text nativeID={ids.choiceError} style={mod.error}>
          {errors.choice}
        </Text>
      )}
      {tier === 3 && item.categoryKey !== "crisis" && banDays.length === 0 && (
        <Text style={mod.hint}>Bans can&apos;t be proposed yet. No longest ban length is set.</Text>
      )}

      <Text nativeID={ids.ruleLegend} role="heading" aria-level={3} style={styles.subheading}>
        {tier === 1
          ? "Which community guideline did you check this against?"
          : "Which safety rule did you check this against?"}
      </Text>
      {rules.length === 0 ? (
        <Text style={mod.hint}>
          The safety floor isn&apos;t published yet, so there is no rule to cite. Nothing can be applied.
        </Text>
      ) : (
        <View
          role="radiogroup"
          aria-labelledby={ids.ruleLegend}
          aria-invalid={errors.rule ? true : undefined}
          aria-describedby={errors.rule ? ids.ruleError : undefined}
        >
          {rules.map((r, i) =>
            radio(r.id, r.label, draft.rule === r.id, () => {
              setDraft({ rule: r.id });
              setErrors((e) => ({ ...e, rule: undefined }));
            }, i === 0 ? firstRuleRef : undefined),
          )}
        </View>
      )}
      {errors.rule && (
        <Text nativeID={ids.ruleError} style={mod.error}>
          {errors.rule}
        </Text>
      )}

      {draft.choice === "ban" && (
        <>
          <Text nativeID={ids.banNote} style={mod.body}>
            A second moderator must confirm a ban before it starts. A ban always has an end date.
          </Text>
          <Text nativeID={ids.banLegend} role="heading" aria-level={3} style={styles.subheading}>
            How long?
          </Text>
          <View
            role="radiogroup"
            aria-labelledby={ids.banLegend}
            aria-invalid={errors.banDays ? true : undefined}
            aria-describedby={errors.banDays ? `${ids.banError} ${ids.banNote}` : ids.banNote}
          >
            {banDays.map((d, i) =>
              radio(String(d), `${d} ${d === 1 ? "day" : "days"}`, draft.banDays === d, () => {
                setDraft({ banDays: d });
                setErrors((e) => ({ ...e, banDays: undefined }));
              }, i === 0 ? firstBanRef : undefined),
            )}
          </View>
          {errors.banDays && (
            <Text nativeID={ids.banError} style={mod.error}>
              {errors.banDays}
            </Text>
          )}
        </>
      )}

      <Text nativeID={ids.reasonLabel} style={[mod.label, styles.reasonLabel]}>
        Reason
      </Text>
      <Text nativeID={ids.reasonHint} style={mod.hint}>
        Say what you saw and why. The author may see this. Please don&apos;t include anyone&apos;s
        health details or name.
      </Text>
      <TextInput
        ref={reasonRef}
        value={draft.reason}
        onChangeText={(t) => {
          setDraft({ reason: t.slice(0, REASON_MAX) });
          if (t.trim()) setErrors((e) => ({ ...e, reason: undefined }));
        }}
        multiline
        maxLength={REASON_MAX}
        aria-labelledby={ids.reasonLabel}
        accessibilityLabelledBy={ids.reasonLabel}
        accessibilityLabel={Platform.OS === "ios" ? "Reason" : undefined}
        aria-invalid={errors.reason ? true : undefined}
        aria-describedby={
          errors.reason
            ? `${ids.reasonError} ${ids.reasonHint} ${ids.reasonCount}`
            : `${ids.reasonHint} ${ids.reasonCount}`
        }
        style={mod.input}
      />
      {errors.reason && (
        <Text nativeID={ids.reasonError} style={mod.error}>
          {errors.reason}
        </Text>
      )}
      <Text nativeID={ids.reasonCount} style={mod.hint}>
        {REASON_MAX - draft.reason.length} characters left
      </Text>

      {failed && (
        <Text role="alert" style={mod.error}>
          That action didn&apos;t save. Your reason is still here. Please try again.
        </Text>
      )}
      {!handledElsewhere && (
        <Pressable
          onPress={apply}
          role="button"
          accessibilityRole="button"
          style={({ focused, pressed }: PressState) => [
            mod.button,
            mod.buttonPrimary,
            pressed && mod.pressed,
            focused && mod.focusRing,
          ]}
        >
          <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Apply</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.page}>
      {!navPlaced && nav}
      <Text
        ref={focusTargetRef(pageHeadingId)}
        nativeID={pageHeadingId}
        role="heading"
        aria-level={1}
        style={styles.title}
        {...({ tabIndex: -1 } as object)}
      >
        Moderator console
      </Text>
      <Text style={mod.body}>
        Your actions are recorded under your moderator name, not your account name.
      </Text>

      {warn && (
        <View style={[mod.panel, styles.warning]}>
          <Text style={mod.error}>
            You&apos;ll be signed out in about a minute. Anything you typed stays here.
          </Text>
          <Pressable
            onPress={stay}
            role="button"
            accessibilityRole="button"
            style={({ focused, pressed }: PressState) => [
              mod.button,
              mod.buttonPrimary,
              pressed && mod.pressed,
              focused && mod.focusRing,
            ]}
          >
            <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Stay signed in</Text>
          </Pressable>
        </View>
      )}

      <View style={wide ? styles.twoPane : undefined}>
        <View style={wide ? styles.queuePane : undefined}>
          <ModerationQueue
            items={items}
            openId={openId}
            onOpen={(id) => {
              // Already open: just take the moderator to its pane.
              if (id === openId) return focusNode(paneHeadingRef.current);
              focusPane.current = true;
              open(id);
            }}
            actedOn={actedOn.current}
            onRefresh={onRefresh}
            live={live}
            idPrefix={prefix}
          />
        </View>
        <View style={wide ? styles.itemPane : styles.itemPaneNarrow}>{pane}</View>
      </View>
    </View>
  );
}

/** An inline link inside a sentence, with a real href (24px line, SC 2.5.8 inline exception). */
function InlineLink({ url, label }: { url: string; label: string }) {
  return (
    <Text
      role="link"
      accessibilityRole="link"
      {...({ href: url } as object)}
      onPress={Platform.OS === "web" ? undefined : () => Linking.openURL(url).catch(() => {})}
      style={styles.inlineLink}
    >
      {label}
    </Text>
  );
}

export type ConsoleUnavailableReason = "no_moderators" | "not_a_moderator";

/**
 * The console's page when it cannot be shown. While G4 is unmet no member can
 * hold a grant, and the page says so plainly; it never fakes access.
 */
export function ConsoleUnavailable({ reason }: { reason: ConsoleUnavailableReason }) {
  return (
    <View style={styles.page}>
      <Text role="heading" aria-level={1} style={styles.title}>
        Moderator console
      </Text>
      {reason === "no_moderators" ? (
        <>
          <Text style={mod.body}>No moderators are appointed yet.</Text>
          <Text style={mod.hint}>
            Moderators will be named in public, with end dates, before anyone can use this page.
          </Text>
        </>
      ) : (
        <Text style={mod.body}>This page is for moderators. You don&apos;t have access to it.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16 },
  nav: { paddingHorizontal: 16, paddingTop: 8 },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginTop: 16,
    marginBottom: 4,
  },
  reasonLabel: { marginTop: 16 },
  twoPane: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  queuePane: { flex: 2, minWidth: 0 },
  itemPane: { flex: 3, minWidth: 0 },
  itemPaneNarrow: { marginTop: 16 },
  content: {
    borderLeftWidth: 3,
    borderLeftColor: tokens.ink,
    paddingLeft: 12,
    marginVertical: 8,
  },
  warning: { marginBottom: 8 },
  radioRow: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  inlineLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: tokens.ink,
    textDecorationLine: "underline",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
});
