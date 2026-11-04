// The pre-launch updates list — client wrappers for the three definer
// functions in migration 20260806134500.
//
// BINDING RULE (ADR 0011): this module may never reference a member table.
// The updates list holds ordinary marketing contacts; a member's address is
// bound to health self-ID through the consent ledger. Nothing here — and no
// file that imports it — may query the two together. Enforced by
// tests/unit/no-join-path.test.ts and guard #8.
//
// There is no read path. The table cannot be selected by any client role; the
// functions are the entire surface. Note the asymmetry in what these return:
// subscribe answers the same way whether the address was new or already
// present (silence is what removes the enumeration oracle), while confirm and
// unsubscribe report a status, because their caller already holds a token that
// was mailed to the address in question.
//
// The Supabase client is imported lazily inside each call rather than at the
// top of the file. It reaches for AsyncStorage, a native module, so a
// top-level import would make the pure validation helper below impossible to
// import on its own — and a validator that cannot be exercised without a
// native storage shim is a validator nobody tests.

export { looksLikeEmail } from "./email";
import { looksLikeEmail } from "./email";

export type SubscribeOutcome =
  | { ok: true }
  | { ok: false; reason: "invalid_email" | "failed" };

export type ConfirmStatus =
  | "confirmed"
  | "already_confirmed"
  | "invalid"
  | "failed";

export type UnsubscribeStatus =
  | "unsubscribed"
  | "already_unsubscribed"
  | "invalid"
  | "failed";

/**
 * Add an address to the updates list.
 *
 * Succeeds identically whether the address was new or already present — the
 * database absorbs duplicates silently so that this call cannot be used to
 * test whether someone is on the list. Callers must not render a different
 * message for the two cases, because there is no way to tell them apart and
 * pretending otherwise would rebuild the oracle in the UI.
 */
export async function subscribeToUpdates(
  email: string,
): Promise<SubscribeOutcome> {
  const trimmed = email.trim();
  if (!looksLikeEmail(trimmed)) {
    return { ok: false, reason: "invalid_email" };
  }

  const { supabase } = await import("../supabase");
  const { error } = await supabase.rpc("subscribe_to_updates", {
    p_email: trimmed,
    p_source: "landing",
  });

  if (error) {
    // 22023 is the function's own "invalid_email" raise — the server-side
    // half of the check above, kept so a malformed address cannot slip
    // through a client that skipped validation.
    if (error.code === "22023") return { ok: false, reason: "invalid_email" };
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

/** Complete double opt-in. Idempotent. */
export async function confirmSubscription(
  token: string,
): Promise<ConfirmStatus> {
  const { supabase } = await import("../supabase");
  const { data, error } = await supabase.rpc("confirm_updates_subscription", {
    p_token: token,
  });
  if (error) return "failed";
  if (
    data === "confirmed" ||
    data === "already_confirmed" ||
    data === "invalid"
  ) {
    return data;
  }
  return "failed";
}

/** Leave the list. No login required (CAN-SPAM). Idempotent. */
export async function unsubscribeFromUpdates(
  token: string,
): Promise<UnsubscribeStatus> {
  const { supabase } = await import("../supabase");
  const { data, error } = await supabase.rpc("unsubscribe_from_updates", {
    p_token: token,
  });
  if (error) return "failed";
  if (
    data === "unsubscribed" ||
    data === "already_unsubscribed" ||
    data === "invalid"
  ) {
    return data;
  }
  return "failed";
}
