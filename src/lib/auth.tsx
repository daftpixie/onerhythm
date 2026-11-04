import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { clearAppealDrafts } from "./moderation/appealDrafts";
import { setMutedWordsOwner } from "./moderation/mutedWords";
import { isLandingMode } from "./site";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The landing build has no accounts (ADR 0023): nobody is signed in, nothing
// is loading, and Supabase is never touched.
const LANDING_AUTH: AuthContextValue = {
  session: null,
  user: null,
  loading: false,
  signOut: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isLandingMode()) {
    return <AuthContext.Provider value={LANDING_AUTH}>{children}</AuthContext.Provider>;
  }
  return <MemberAuthProvider>{children}</MemberAuthProvider>;
}

function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setMutedWordsOwner(data.session?.user.id ?? null);
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Any sign-out (this tab, another tab, expiry, account deletion) clears
      // appeal drafts; muted words follow the member who is signed in.
      if (event === "SIGNED_OUT") clearAppealDrafts();
      setMutedWordsOwner(next?.user.id ?? null);
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // A shared tablet must not keep one person's appeal words for the next
    // (ADR 0022: the draft lives in memory only, and sign-out clears it).
    clearAppealDrafts();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
