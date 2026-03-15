import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { SessionResponse } from "./auth-api";
import { BETA_PENDING_PATH, hasPendingBetaAccess } from "./beta-access";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = "onerhythm_session";

export async function getServerSession(): Promise<SessionResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return { authenticated: false, user: null, beta_access: "not_required" };
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
    cache: "no-store",
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
  });

  if (!response.ok) {
    return { authenticated: false, user: null, beta_access: "not_required" };
  }

  return (await response.json()) as SessionResponse;
}

export function getAuthenticatedLandingPath(session: SessionResponse): string {
  if (!session.authenticated || !session.user) {
    return "/sign-in";
  }

  if (hasPendingBetaAccess(session)) {
    return BETA_PENDING_PATH;
  }

  return session.user.profile_id ? "/account/data" : "/onboarding";
}

export async function requireAuthenticatedPage(nextPath: string): Promise<SessionResponse> {
  const session = await getServerSession();

  if (!session.authenticated || !session.user) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  if (hasPendingBetaAccess(session) && nextPath !== BETA_PENDING_PATH) {
    redirect(BETA_PENDING_PATH);
  }

  return session;
}
