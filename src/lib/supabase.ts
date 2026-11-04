import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "./database.types";
import { isLandingMode } from "./site";

// Only the PUBLISHABLE (anon) key + project URL reach the client. The secret
// (service) key is backend/test-only and must never be bundled. See .env.example.
//
// The client is built on FIRST USE, not at import (ADR 0023). The web build is
// one bundle, so every route module is in it, and an import-time throw would
// take the landing page down with it. In the landing build
// (EXPO_PUBLIC_SITE_MODE=landing) the client is never built at all: nothing
// in that build may call Supabase, and reaching for it throws instead.

let client: SupabaseClient<Database> | null = null;

function build(): SupabaseClient<Database> {
  if (isLandingMode()) {
    throw new Error(
      "Supabase is not available in the landing build (EXPO_PUBLIC_SITE_MODE=landing). " +
        "A route that needs it must not render in landing mode (ADR 0023).",
    );
  }
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in the values from `npx supabase status`.",
    );
  }

  // On native, persist the session with AsyncStorage. On web, the default
  // localStorage adapter is used and `detectSessionInUrl` handles the
  // magic-link callback returning to /auth/callback.
  const isWeb = Platform.OS === "web";

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: isWeb ? undefined : AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWeb,
      flowType: "pkce",
    },
  });
}

/** The one client, built on first use. Throws in the landing build. */
export function getSupabase(): SupabaseClient<Database> {
  if (!client) client = build();
  return client;
}

// Callers keep writing `supabase.from(...)`. The proxy forwards to the real
// client, built on first property access; methods are bound to it, so `this`
// inside supabase-js is the client and never the proxy.
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const real = getSupabase();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
  has(_target, prop) {
    return prop in getSupabase();
  },
});
