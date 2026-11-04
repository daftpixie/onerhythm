// Consent history — Addendum A B14.
//
// The full versioned ledger, INCLUDING withdrawn records: this is why
// withdrawal writes withdrawn_at rather than deleting the row. Shows the member
// which policy version they agreed to, and when it ended.
//
// RLS genuinely scopes this one (consent_select_self is member_id = auth.uid()),
// but the explicit predicate stays: the export module documents why relying on
// RLS alone is a habit worth not forming.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

type Client = SupabaseClient<Database>;
export type ConsentRecord = Database["public"]["Tables"]["consent_records"]["Row"];

export async function listMyConsentHistory(
  client: Client,
): Promise<ConsentRecord[]> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client
    .from("consent_records")
    .select("*")
    .eq("member_id", user.id)
    .order("granted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
