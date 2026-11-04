import {
  EXPORT_FORMAT_VERSION,
  MEMBER_OWNED_TABLES,
  exportFilename,
  serializeExport,
  type ExportDocument,
} from "../../src/lib/rights/export";

function doc(): ExportDocument {
  return {
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: "2026-08-07T12:00:00.000Z",
    member_id: "11111111-1111-1111-1111-111111111111",
    notes: [],
    data: {
      profile: null,
      consent_records: [],
      health_self_id_tags: [],
      memberships: [],
      posts: [],
      comments: [],
      upbeats: [],
      journey_entries: [],
      reports: [],
      member_blocks: [],
      member_bans: [],
      appeals: [],
      second_look_requests: [],
      floor_reexamination_requests: [],
      removed_content: [],
      moderator_grants: [],
      moderator_pseudonyms: [],
    },
  };
}

describe("export document format", () => {
  it("names the file plainly, with the date", () => {
    expect(exportFilename(new Date("2026-08-07T12:00:00.000Z"))).toBe(
      "onerhythm-my-data-2026-08-07.json",
    );
  });

  it("serializes to indented JSON a person could actually read", () => {
    const text = serializeExport(doc());
    expect(text).toContain("\n  ");
    expect(JSON.parse(text).format_version).toBe(EXPORT_FORMAT_VERSION);
  });

  it("carries a version so a later shape change is detectable", () => {
    expect(typeof EXPORT_FORMAT_VERSION).toBe("number");
    expect(EXPORT_FORMAT_VERSION).toBeGreaterThanOrEqual(1);
  });

  it("declares the member-owned tables it covers", () => {
    for (const t of [
      "profiles",
      "consent_records",
      "health_self_ids",
      "memberships",
      "posts",
      "comments",
      "upbeats",
      "journey_entries",
    ]) {
      expect(MEMBER_OWNED_TABLES).toContain(t);
    }
  });

  it("has one data key per declared table — nothing silently missing", () => {
    const keys = Object.keys(doc().data);
    expect(keys).toHaveLength(MEMBER_OWNED_TABLES.length);
  });
});
