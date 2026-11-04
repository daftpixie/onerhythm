// Onboarding role selection. We record the member's OWN statement
// (self_declared) faithfully, and derive a SAFE permission role from it:
//  - "caregiver" -> role caregiver
//  - "patient" / "both" -> role patient (caregiver communities are joinable via
//    membership regardless of role; the enum has no "both")
//  - "professional" -> role patient until the later verification slice (the
//    professional role carries future broadcast privileges, so it is not granted
//    on self-declaration).
// See ADR 0004. Skipping onboarding writes nothing (role stays the 'patient'
// default from handle_new_user; self_declared stays null).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type OnboardingChoice = "patient" | "caregiver" | "both" | "professional";
type UserRole = Database["public"]["Enums"]["user_role"];
type Client = SupabaseClient<Database>;

export function roleForChoice(choice: OnboardingChoice): UserRole {
  return choice === "caregiver" ? "caregiver" : "patient";
}

export async function setOnboardingRole(
  client: Client,
  choice: OnboardingChoice,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not authenticated");

  const { error } = await client
    .from("profiles")
    .update({ role: roleForChoice(choice), self_declared: choice })
    .eq("id", user.id);
  if (error) throw error;
}
