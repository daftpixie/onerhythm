// Delete my account — Addendum A B13.
//
// Invokes the cascade already proven in supabase/tests/03_deletion_cascade_test.sql
// by removing the auth.users row. A client JWT cannot do that directly, so this
// calls a no-argument SECURITY DEFINER function that can only ever delete
// auth.uid() — there is no target to forge. No service_role key is involved.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { clearMutedWords } from "../moderation/mutedWords";

type Client = SupabaseClient<Database>;

export async function deleteMyAccount(client: Client): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Not authenticated");

  // No arguments: the function's own auth.uid() is the only possible target.
  const { error } = await client.rpc("delete_my_account");
  if (error) throw new Error(error.message);

  // The account is gone; the local session is now a token for a member who no
  // longer exists. Clear it so the UI cannot keep acting as them. `local` scope
  // because a global sign-out would call the server for a user it just deleted.
  // Muted words live only on this device (Q6); the account is gone, so they go too.
  await clearMutedWords();
  await client.auth.signOut({ scope: "local" });
}
