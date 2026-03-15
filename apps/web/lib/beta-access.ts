import type { SessionResponse } from "./auth-api";

export const BETA_PENDING_PATH = "/beta-access-pending";

export function hasPendingBetaAccess(session: SessionResponse): boolean {
  return session.beta_access === "pending";
}

export function hasAppAccess(session: SessionResponse): boolean {
  return Boolean(session.authenticated && session.user && session.beta_access !== "pending");
}
