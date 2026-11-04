// The appeal draft store (ADR 0022): in memory only, for the app session,
// keyed by the action. Never written to device storage or the server, because
// an appeal may hold health details. Cleared on any sign-out, so a shared
// tablet keeps no one's words for the next person.
const drafts = new Map<string, string>();

export function getAppealDraft(actionId: string): string {
  return drafts.get(actionId) ?? "";
}

export function setAppealDraft(actionId: string, text: string) {
  if (text) drafts.set(actionId, text);
  else drafts.delete(actionId);
}

/** Forget every appeal draft. */
export function clearAppealDrafts() {
  drafts.clear();
}
