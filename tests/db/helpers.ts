// Shared helpers for the Node/DB tests. These talk to the LOCAL Supabase stack
// only and obtain real authenticated sessions deterministically via the admin
// API. The secret key is read from .env.test (gitignored, test-only) — it never
// reaches client code. See .env.test.example.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import type { Database } from "../../src/lib/database.types";

function loadTestEnv() {
  try {
    const txt = readFileSync(join(process.cwd(), ".env.test"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // fall back to whatever is already in process.env
  }
}
loadTestEnv();

const URL = process.env.SUPABASE_TEST_URL as string;
const ANON = process.env.SUPABASE_TEST_ANON_KEY as string;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_KEY as string;

if (!URL || !ANON || !SERVICE) {
  throw new Error(
    "DB tests need SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY / " +
      "SUPABASE_TEST_SERVICE_KEY. Copy .env.test.example to .env.test " +
      "(values from `npx supabase status`).",
  );
}

// service-key client: bypasses RLS; used only to set up/inspect/tear down.
export const admin: SupabaseClient<Database> = createClient<Database>(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let counter = 0;
export interface TestUser {
  id: string;
  email: string;
  password: string;
}

// Creating the auth user fires the handle_new_user trigger -> profile row.
export async function createTestUser(): Promise<TestUser> {
  const email = `test_${Date.now()}_${counter++}@onerhythm.test`;
  const password = "test-password-123456";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return { id: data.user!.id, email, password };
}

// A real authenticated session as the given user (anon-key client + sign-in).
export async function signInAs(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

export async function deleteTestUser(id: string): Promise<void> {
  await admin.auth.admin.deleteUser(id);
}
