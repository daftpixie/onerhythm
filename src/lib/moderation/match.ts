// Whole-word, case-insensitive phrase matching, run on the reader's own
// device. Shared by muted words (Q6) and the "Show" gate's crisis match (Q8).
// Nothing here stores, logs or sends anything.

/** Lower-case, turn punctuation into spaces, and collapse runs of spaces. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * The first term that appears in `text` as whole words, or null. A term never
 * matches inside another word ("icd" does not match "icder").
 */
export function firstMatch(text: string, terms: string[]): string | null {
  const haystack = ` ${normalise(text)} `;
  for (const term of terms) {
    const needle = normalise(term);
    if (needle && haystack.includes(` ${needle} `)) return term;
  }
  return null;
}
