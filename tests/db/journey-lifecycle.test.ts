/**
 * @jest-environment node
 *
 * Phase 1E: the journey-entry lifecycle is member-owned end to end —
 * create (draft by default) → edit → publish → unpublish → delete — and
 * draft privacy is enforced at the DB LAYER (RLS + grants), never by
 * client-side filtering: another member cannot read a draft even with a
 * raw query, and anon is denied at the table gate (42501).
 */
import { anonClient, createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  createJourneyEntry,
  updateJourneyEntry,
  setJourneyPublished,
  deleteJourneyEntry,
  getJourneyEntry,
  listMyJourneyEntries,
  listMemberJourneyEntries,
} from "../../src/lib/social";

describe("journey entry lifecycle (owner)", () => {
  it("create draft → edit → publish → unpublish → delete", async () => {
    const author = await createTestUser();
    const reader = await createTestUser();
    try {
      const authorClient = await signInAs(author.email, author.password);
      const readerClient = await signInAs(reader.email, reader.password);

      // create — a new entry is a DRAFT by default
      const { id } = await createJourneyEntry(authorClient, {
        title: "Five years, three ablations",
        body: "When I was first diagnosed I thought my life was over.",
      });
      const draft = await getJourneyEntry(authorClient, id);
      expect(draft).not.toBeNull();
      expect(draft!.is_published).toBe(false);

      // the owner sees their draft in their own list
      const mine = await listMyJourneyEntries(authorClient);
      expect(mine.some((e) => e.id === id)).toBe(true);

      // ...but nobody else does — RLS, not client filtering
      expect(await getJourneyEntry(readerClient, id)).toBeNull();
      const theirView = await listMemberJourneyEntries(readerClient, author.id);
      expect(theirView.every((e) => e.id !== id)).toBe(true);
      const { data: rawDraft, error: rawErr } = await readerClient
        .from("journey_entries")
        .select("id")
        .eq("id", id);
      expect(rawErr).toBeNull();
      expect(rawDraft).toEqual([]);

      // edit
      await updateJourneyEntry(authorClient, id, {
        title: "Five years, three ablations, one steady heart",
        body: "When I was first diagnosed I thought my life was over. It wasn't.",
      });
      const edited = await getJourneyEntry(authorClient, id);
      expect(edited!.title).toBe(
        "Five years, three ablations, one steady heart",
      );

      // publish — now visible to another authenticated member
      await setJourneyPublished(authorClient, id, true);
      const published = await getJourneyEntry(readerClient, id);
      expect(published).not.toBeNull();
      expect(published!.is_published).toBe(true);
      const visibleList = await listMemberJourneyEntries(
        readerClient,
        author.id,
      );
      expect(visibleList.some((e) => e.id === id)).toBe(true);

      // unpublish — invisible to others again
      await setJourneyPublished(authorClient, id, false);
      expect(await getJourneyEntry(readerClient, id)).toBeNull();

      // delete — gone for the owner too
      await deleteJourneyEntry(authorClient, id);
      expect(await getJourneyEntry(authorClient, id)).toBeNull();
    } finally {
      await deleteTestUser(author.id);
      await deleteTestUser(reader.id);
    }
  });
});

describe("journey entry boundaries", () => {
  it("anon is denied at the table gate (no grant → 42501)", async () => {
    const anon = anonClient();
    const { error } = await anon.from("journey_entries").select("id").limit(1);
    expect(error?.code).toBe("42501");
  });

  it("an author cannot be spoofed (RLS WITH CHECK)", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    try {
      const clientA = await signInAs(a.email, a.password);
      const { error } = await clientA.from("journey_entries").insert({
        author_id: b.id,
        title: "not mine to write",
        body: "spoofed",
      });
      expect(error?.code).toBe("42501");
    } finally {
      await deleteTestUser(a.id);
      await deleteTestUser(b.id);
    }
  });
});
