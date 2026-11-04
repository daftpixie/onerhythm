import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { tokens } from "../../theme/tokens";
import { useAnnounce } from "../StatusRegion";
import { focusById, focusTargetRef } from "./panel";
import { mod } from "./styles";

// The moderator queue (ADR 0022; plan §4.2, §5.5; T15).
//
// Realtime never moves focus and never reorders. The list keeps its own
// order: items that arrive are held and counted ("3 new items — Show"), and
// go in at the top only when the moderator chooses Show. Then focus moves to
// the first new item's Open button. "Pause live updates" holds arrivals
// silently; on un-pause they are counted once.
//
// If another reviewer handles the item whose Open button has focus, the queue
// says so and moves focus to the next item, never to body.
//
// A row shows the category in words, the tier and the age as static text.
// Never a reporter, a note, a count of reports or a snippet (ADR 0019, T6).

export interface QueueItem {
  id: string;
  /** The category in words, e.g. "Possible dangerous medical misinformation". */
  category: string;
  tierLabel: string;
  /** Static text, e.g. "waiting 3 hours, as of 10:42". Never ticks. */
  ageText: string;
  /** 3 (the safety floor) unless the item says otherwise. */
  tier?: 1 | 3;
  /** The moderation_category key. Missing means unknown, which fails closed. */
  categoryKey?: string;
  subjectKind?: "post" | "comment";
}

export const HANDLED_ELSEWHERE = "Another reviewer already handled this item.";

export const newItemsText = (n: number) => `${n} new ${n === 1 ? "item" : "items"}`;

export interface ModerationQueueProps {
  items: QueueItem[];
  /** The item open in the console's pane, if any. */
  openId?: string | null;
  onOpen?: (id: string) => void;
  /** Items this moderator just acted on: their leaving is not "another reviewer". */
  actedOn?: ReadonlySet<string>;
  /**
   * Ask the server for the queue again ("Check for new items"). Resolves with
   * the item ids now in it, so the queue can say when nothing is new.
   */
  onRefresh?: () => Promise<string[] | void>;
  /**
   * True when a Realtime feed drives `items`. False says so in words and
   * drops "Pause live updates", which would do nothing.
   */
  live?: boolean;
  /** Prefix for the focus targets; the console uses it to focus a row. */
  idPrefix?: string;
}

export const queueOpenId = (prefix: string, id: string) => `${prefix}-open-${id}`;
export const queueHeadingId = (prefix: string) => `${prefix}-heading`;

export function ModerationQueue({
  items,
  openId = null,
  onOpen,
  actedOn,
  onRefresh,
  live = true,
  idPrefix,
}: ModerationQueueProps) {
  const announce = useAnnounce();
  const ownId = useId();
  const prefix = idPrefix ?? `queue-${ownId.replace(/:/g, "")}`;
  const headingId = queueHeadingId(prefix);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  // The order the moderator sees. Only Show adds to it.
  const [shown, setShown] = useState<string[]>(() => items.map((i) => i.id));
  // Arrived, not yet shown.
  const [pending, setPending] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  const display = shown.filter((id) => byId.has(id));
  const waiting = pending.filter((id) => byId.has(id));

  const focusedId = useRef<string | null>(null);
  const lastDisplay = useRef<string[]>(display);
  const focusAfterShow = useRef<string | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Arrivals and departures, after the DOM has the new list.
  useLayoutEffect(() => {
    const before = lastDisplay.current;
    const known = new Set([...shown, ...pending]);
    const arrived = items.map((i) => i.id).filter((id) => !known.has(id));
    if (arrived.length > 0) {
      const next = [...pending.filter((id) => byId.has(id)), ...arrived];
      setPending(next);
      if (!pausedRef.current) announce(newItemsText(next.length));
    }

    const gone = focusedId.current;
    if (gone && !byId.has(gone) && before.includes(gone)) {
      focusedId.current = null;
      if (!actedOn?.has(gone)) announce(HANDLED_ELSEWHERE);
      const at = before.indexOf(gone);
      const after = before.slice(at + 1).find((id) => byId.has(id));
      const prior = before.slice(0, at).reverse().find((id) => byId.has(id));
      const target = after ?? prior;
      if (!(target && focusById(queueOpenId(prefix, target)))) focusById(headingId);
    }
    // Forget departed ids, so the lists do not grow without end.
    if (shown.some((id) => !byId.has(id))) setShown((s) => s.filter((id) => byId.has(id)));
    lastDisplay.current = shown.filter((id) => byId.has(id));
    // Runs when the server's list changes; the state it reads is current.
  }, [items]);

  // After Show: focus the first new item's Open button.
  useLayoutEffect(() => {
    const id = focusAfterShow.current;
    if (!id) return;
    focusAfterShow.current = null;
    focusById(queueOpenId(prefix, id));
  }, [shown, prefix]);

  function show() {
    const fresh = items.map((i) => i.id).filter((id) => waiting.includes(id));
    if (fresh.length === 0) return;
    focusAfterShow.current = fresh[0];
    setPending([]);
    setShown((s) => [...fresh, ...s]);
  }

  async function check() {
    if (!onRefresh) return;
    const known = new Set([...shown, ...pending, ...items.map((i) => i.id)]);
    try {
      const ids = await onRefresh();
      setCheckFailed(false);
      // New arrivals are counted by the effect above; say so when there are none.
      if (Array.isArray(ids) && !ids.some((id) => !known.has(id))) announce("No new items.");
    } catch {
      setCheckFailed(true);
    }
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    // Arrivals held while paused are counted once, on un-pause.
    if (!next && waiting.length > 0) announce(newItemsText(waiting.length));
  }

  function onFocusRow(id: string) {
    focusedId.current = id;
  }
  function onBlurRow(e: unknown) {
    // A row removed from under focus still counts as the focused one, so the
    // departure above can move focus on. Only a real move away clears it.
    const target = (e as { nativeEvent?: { target?: unknown }; target?: unknown })?.target;
    if (Platform.OS === "web" && (target as { isConnected?: boolean })?.isConnected === false) return;
    focusedId.current = null;
  }

  return (
    <View>
      <Text
        ref={focusTargetRef(headingId)}
        nativeID={headingId}
        role="heading"
        aria-level={2}
        style={mod.heading}
        {...({ tabIndex: -1 } as object)}
      >
        Queue
      </Text>

      <Text style={mod.hint}>
        {!live
          ? "Live updates aren't on yet. Choose Check for new items."
          : paused
            ? "Live updates are paused."
            : "Live updates are on."}{" "}
        The oldest items are first.
      </Text>
      <View style={mod.row}>
        {live && (
        <Pressable
          onPress={togglePause}
          role="button"
          accessibilityRole="button"
          aria-pressed={paused}
          accessibilityState={{ selected: paused }}
          style={({ focused, pressed }: PressState) => [
            mod.button,
            pressed && mod.pressed,
            focused && mod.focusRing,
          ]}
        >
          <Text style={mod.buttonText}>Pause live updates</Text>
        </Pressable>
        )}
        {onRefresh && (
          <Pressable
            onPress={check}
            role="button"
            accessibilityRole="button"
            style={({ focused, pressed }: PressState) => [
              mod.button,
              pressed && mod.pressed,
              focused && mod.focusRing,
            ]}
          >
            <Text style={mod.buttonText}>Check for new items</Text>
          </Pressable>
        )}
        {!paused && waiting.length > 0 && (
          <Pressable
            onPress={show}
            role="button"
            accessibilityRole="button"
            style={({ focused, pressed }: PressState) => [
              mod.button,
              mod.buttonPrimary,
              pressed && mod.pressed,
              focused && mod.focusRing,
            ]}
          >
            <Text style={[mod.buttonText, mod.buttonTextPrimary]}>
              {newItemsText(waiting.length)} — Show
            </Text>
          </Pressable>
        )}
      </View>

      {checkFailed && (
        <Text role="alert" style={mod.error}>
          We couldn&apos;t check for new items. Please try again.
        </Text>
      )}

      {display.length === 0 ? (
        <Text style={mod.body}>Nothing is waiting.</Text>
      ) : (
        <View role="list" aria-labelledby={headingId} style={styles.list}>
          {display.map((id) => {
            const item = byId.get(id) as QueueItem;
            const isOpen = openId === id;
            return (
              <View role="listitem" key={id} style={[styles.row, isOpen && styles.rowOpen]}>
                <Text style={mod.label}>{item.category}</Text>
                <Text style={mod.hint}>
                  {item.tierLabel}. {item.ageText}.{isOpen ? " Open now." : ""}
                </Text>
                <Pressable
                  ref={focusTargetRef(queueOpenId(prefix, id)) as never}
                  nativeID={queueOpenId(prefix, id)}
                  onPress={() => onOpen?.(id)}
                  onFocus={() => onFocusRow(id)}
                  onBlur={onBlurRow}
                  role="button"
                  accessibilityRole="button"
                  aria-label={`Open ${item.category}`}
                  style={({ focused, pressed }: PressState) => [
                    mod.button,
                    pressed && mod.pressed,
                    focused && mod.focusRing,
                  ]}
                >
                  <Text style={mod.buttonText}>Open</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 8 },
  row: {
    borderTopWidth: 1,
    borderTopColor: tokens.line,
    paddingVertical: 12,
  },
  // The open row is marked by text ("Open now.") and a heavier rule, never by
  // colour alone.
  rowOpen: { borderTopWidth: 3, borderTopColor: tokens.ink },
});
