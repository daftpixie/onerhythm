// The moderator console route's pure helpers (build step 5). Written after
// src/lib/moderation/console.ts, not before it; recorded as such on PR #12.
import { ageText, banTermDays, consoleAccess, toQueueItem } from "../../src/lib/moderation/console";

const row = {
  item_id: "i1",
  post_id: "p1",
  comment_id: null,
  category: "harassment",
  tier: 3,
  state: "queued",
  reported: true,
  age_hours: 22,
};

describe("toQueueItem", () => {
  it("keeps only words, the tier and the age: no content id, no report flag or count (ADR 0019, T6)", () => {
    const item = toQueueItem(row, new Date(2026, 9, 30, 10, 42));
    expect(Object.keys(item).sort()).toEqual(
      ["ageText", "category", "categoryKey", "id", "subjectKind", "tier", "tierLabel"].sort(),
    );
    expect(JSON.stringify(item)).not.toMatch(/p1|report/i);
    expect(item.ageText).toBe("waiting 22 hours, as of 10:42");
    expect(item.tier).toBe(3);
    expect(item.subjectKind).toBe("post");
  });

  it("an unknown category is still named in words, and Tier 3 unless the row says 1", () => {
    const item = toQueueItem({ ...row, category: "something_new", tier: 2 }, new Date());
    expect(item.category).toBe("A safety question");
    expect(item.tier).toBe(3);
  });
});

describe("banTermDays fails closed", () => {
  it.each([
    [null, null],
    ["", null],
    ["7 days", 7],
    ["1 day", 1],
    ["0 days", null],
    ["1 mon", null],
    ["12:00:00", null],
    ["7 days 12:00:00", null],
  ])("%p -> %p", (value, days) => {
    expect(banTermDays(value as string | null)).toBe(days);
  });
});

describe("consoleAccess", () => {
  it("G4 unmet always means no moderators", () => {
    expect(consoleAccess({ G4: "unmet", queue: "ok" })).toBe("no_moderators");
  });
});

describe("ageText", () => {
  it("is static words", () => {
    expect(ageText(0.2, new Date(2026, 0, 1, 9, 5))).toBe("waiting less than an hour, as of 09:05");
    expect(ageText(1, new Date(2026, 0, 1, 9, 5))).toBe("waiting 1 hour, as of 09:05");
  });
});
