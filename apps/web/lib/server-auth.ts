import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { SessionResponse } from "./auth-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = "onerhythm_session";

async function fetchSession(): Promise<SessionResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return { authenticated: false, user: null };
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
    cache: "no-store",
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
  });

  if (!response.ok) {
    return { authenticated: false, user: null };
  }

  return (await response.json()) as SessionResponse;
}

export async function requireAuthenticatedPage(nextPath: string): Promise<SessionResponse> {
  const session = await fetchSession();

  if (!session.authenticated || !session.user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}
