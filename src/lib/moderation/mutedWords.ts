import AsyncStorage from "@react-native-async-storage/async-storage";

// Muted words, on this device only (Q6, decided 2026-10-29).
//
// The terms can reveal health ("ICD", "ablation"), so they are never sent to
// the server: no table, no consent purpose, nothing a moderator or triage
// could read. The cost is honest and stated in the UI: they do not follow the
// member to a new phone or computer. Server sync can come later, under its own
// consent purpose and review.

const BASE_KEY = "onerhythm.mutedWords.v1";
const MAX_LENGTH = 60;

// Kept per signed-in member, so on a shared device (a family tablet, a
// library computer) one member's words never reach the next member. The auth
// provider sets the owner as soon as it knows the session: a member id, or
// null when no one is signed in (then there is no list at all). Before the
// provider has said anything (undefined, e.g. a screen rendered on its own),
// one unscoped list is used.
let owner: string | null | undefined = undefined;

/** Called by the auth provider when the signed-in member changes. */
export function setMutedWordsOwner(memberId: string | null) {
  owner = memberId;
}

function key(): string | null {
  if (owner === undefined) return BASE_KEY;
  return owner ? `${BASE_KEY}.${owner}` : null;
}

function clean(word: string): string {
  return word.trim().toLowerCase().slice(0, MAX_LENGTH);
}

export async function listMutedWords(): Promise<string[]> {
  const k = key();
  if (!k) return [];
  try {
    const raw = await AsyncStorage.getItem(k);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((w): w is string => typeof w === "string") : [];
  } catch {
    return [];
  }
}

async function save(words: string[]): Promise<string[]> {
  const k = key();
  if (!k) return [];
  await AsyncStorage.setItem(k, JSON.stringify(words));
  return words;
}

export async function addMutedWord(word: string): Promise<string[]> {
  const w = clean(word);
  const words = await listMutedWords();
  if (!w || words.includes(w)) return words;
  return save([...words, w]);
}

export async function removeMutedWord(word: string): Promise<string[]> {
  const w = clean(word);
  return save((await listMutedWords()).filter((x) => x !== w));
}

/** Forget the signed-in member's words on this device (account deletion calls this). */
export async function clearMutedWords(): Promise<void> {
  const k = key();
  if (!k) return;
  // Never let device storage block what calls this (account deletion runs it
  // after the account is already gone).
  try {
    await AsyncStorage.removeItem(k);
  } catch {
    /* nothing stored, or no storage here */
  }
}
