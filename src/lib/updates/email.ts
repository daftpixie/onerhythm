// Pure email-shape check, deliberately in its own module with NO imports.
//
// Whether an address works is decided by whether mail arrives, not by a
// regex. This exists only so the form can say "that doesn't look like an email
// address" in words before the round trip; the database repeats the check.
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function looksLikeEmail(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= 3 && trimmed.length <= 254 && EMAIL_SHAPE.test(trimmed)
  );
}
