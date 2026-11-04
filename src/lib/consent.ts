// Health self-ID consent lifecycle. Pure functions over a Supabase client so the
// exact product code is exercised by the Node/DB tests against the live stack.
// No React Native imports here — keep it usable from both app and node.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Single source of truth for the consent policy version recorded in the ledger.
// Bump when the plain-language data promise changes; reconcile with the
// published policy document (see ADR 0004).
export const CONSENT_POLICY_VERSION = "v1";

type Client = SupabaseClient<Database>;

async function requireUserId(client: Client): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * GRANT: write exactly one current consent_records row (purpose=health_self_id)
 * and then the selected health_self_ids — through the RLS-gated path. Consent is
 * written FIRST so the gate (has_current_health_consent) permits the tag writes.
 * Skipping onboarding simply never calls this, so nothing is written.
 */
export async function grantHealthSelfIdConsent(
  client: Client,
  tagIds: string[],
): Promise<void> {
  const memberId = await requireUserId(client);

  const { error: consentErr } = await client.from("consent_records").insert({
    member_id: memberId,
    purpose: "health_self_id",
    policy_version: CONSENT_POLICY_VERSION,
    source: "onboarding",
  });
  if (consentErr) throw consentErr;

  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({ member_id: memberId, tag_id }));
    const { error: tagsErr } = await client.from("health_self_ids").insert(rows);
    if (tagsErr) throw tagsErr;
  }
}

/**
 * WITHDRAW: set withdrawn_at on the member's current health_self_id consent. The
 * 1B trigger (purge_self_id_on_consent_withdrawal) then deletes their
 * health_self_ids so the data cannot exist at rest without current consent.
 */
export async function withdrawHealthSelfIdConsent(client: Client): Promise<void> {
  const memberId = await requireUserId(client);

  const { error } = await client
    .from("consent_records")
    .update({ withdrawn_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .eq("purpose", "health_self_id")
    .is("withdrawn_at", null);
  if (error) throw error;
}

/** Whether the member currently holds a (non-withdrawn) health self-ID consent. */
export async function hasCurrentHealthConsent(client: Client): Promise<boolean> {
  const memberId = await requireUserId(client);
  const { count, error } = await client
    .from("consent_records")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("purpose", "health_self_id")
    .is("withdrawn_at", null);
  if (error) throw error;
  return (count ?? 0) > 0;
}
