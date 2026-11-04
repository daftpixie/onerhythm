// The Google Sheet mirror of the updates list (ADR 0011).
//
// The no-correlation rule extends to the mirror: an export is just a join
// waiting to be written in a spreadsheet. These assertions are about what the
// script CAN carry, not about what today's version happens to do — the point
// is that widening it has to break a test first.
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

const FIELDS = JSON.parse(
  readFileSync(join(ROOT, "scripts", "subscriber-export-fields.json"), "utf8"),
) as { select: string[]; headers: string[] };

const SCRIPT = readFileSync(
  join(ROOT, "scripts", "sync-subscribers-to-sheet.js"),
  "utf8",
);

const MEMBER_FIELDS = [
  "profiles",
  "auth.users",
  "health_self_ids",
  "consent_records",
  "self_id_tags",
  "memberships",
  "journey_entries",
  "display_name",
  "member_id",
  "self_declared",
];

describe("the export carries marketing fields and nothing else", () => {
  it("allows exactly the four marketing fields", () => {
    expect(FIELDS.select).toEqual([
      "email",
      "created_at",
      "confirmed_at",
      "unsubscribed_at",
    ]);
  });

  it("has a header for every exported field", () => {
    expect(FIELDS.headers).toHaveLength(FIELDS.select.length);
  });

  it("cannot include a member or profile field", () => {
    for (const field of MEMBER_FIELDS) {
      expect(FIELDS.select).not.toContain(field);
    }
  });

  it("never exports either token", () => {
    // An unsubscribe token in a spreadsheet is a live capability sitting in a
    // document — anyone with view access could unsubscribe anyone.
    expect(FIELDS.select).not.toContain("confirm_token");
    expect(FIELDS.select).not.toContain("unsubscribe_token");
    expect(SCRIPT).not.toMatch(/confirm_token|unsubscribe_token/);
  });
});

describe("the sync script obeys its own rules", () => {
  it("reads only the allow-listed columns, from the manifest", () => {
    // The select string is built from the JSON, so the manifest is the single
    // place the export can be widened — and widening it fails the test above.
    expect(SCRIPT).toMatch(/FIELDS\.select\.join\(","\)/);
    expect(SCRIPT).toMatch(/select=\$\{select\}/);
  });

  it("names no member table anywhere", () => {
    for (const field of MEMBER_FIELDS) {
      expect(SCRIPT).not.toContain(field);
    }
  });

  it("OVERWRITES and never appends", () => {
    // The binding rule: an append-only mirror becomes an undeletable shadow
    // copy that defeats unsubscribe and the right to deletion.
    expect(SCRIPT).not.toMatch(/values\.append|:append/);
    expect(SCRIPT).toMatch(/:clear/);
    expect(SCRIPT).toMatch(/method: "PUT"/);
  });

  it("is one-way — it never writes to the database", () => {
    expect(SCRIPT).not.toMatch(/method: "POST"[\s\S]{0,200}rest\/v1/);
    expect(SCRIPT).not.toMatch(/\.upsert\(|\.insert\(|\.delete\(/);
    // The only POSTs are Google's token exchange and the sheet clear.
    const posts = SCRIPT.match(/method: "POST"/g) ?? [];
    expect(posts).toHaveLength(2);
  });

  it("refuses to take a credential from an EXPO_PUBLIC_* variable", () => {
    // Expo inlines EXPO_PUBLIC_* into the shipped client bundle, so a
    // credential read from one would be served to every visitor.
    expect(SCRIPT).toMatch(/startsWith\("EXPO_PUBLIC_"\)/);
    expect(SCRIPT).toMatch(/throw new Error\(/);
  });

  it("reads its credentials from a path in the environment, never inline", () => {
    expect(SCRIPT).toMatch(/required\("GOOGLE_SERVICE_ACCOUNT_JSON"\)/);
    expect(SCRIPT).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
    expect(SCRIPT).not.toMatch(/iam\.gserviceaccount\.com/);
  });
});

describe("the credential path is not committable", () => {
  it("gitignores service-account json", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(ignore).toMatch(/service-account.*\.json|\*\.service-account\.json/);
  });

  it("is covered by the secrets guard, by shape and by filename", () => {
    const guard = readFileSync(
      join(ROOT, ".claude", "hooks", "secrets-pii-scan.sh"),
      "utf8",
    );
    expect(guard).toMatch(/service_account/);
    expect(guard).toMatch(/iam\\?\.gserviceaccount\\?\.com/);
  });
});
