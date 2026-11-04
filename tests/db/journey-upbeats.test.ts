/**
 * @jest-environment node
 *
 * Phase 1E: journey upbeats mirror the 1D contract exactly — presence/absence
 * row, duplicate impossible at the DB (23505) and resolved as a handled
 * state, count = presence rows, and deleting the entry deletes its upbeats
 * (cascade). Structurally NO negative state.
 */
import { createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  createJourneyEntry,
  setJourneyPublished,
  deleteJourneyEntry,
  addUpbeat,
  removeUpbeat,
  listMyUpbeats,
} from "../../src/lib/social";

describe("journey upbeats (presence/absence only)", () => {
  it("adds, refuses duplicates as a handled state, removes, and cascades on entry delete", async () => {
    const author = await createTestUser();
    const fan = await createTestUser();
    try {
      const authorClient = await signInAs(author.email, author.password);
      const fanClient = await signInAs(fan.email, fan.password);

      const { id: entryId } = await createJourneyEntry(authorClient, {
        title: "What my ICD taught me about fear",
        body: "A long story, honestly told.",
      });
      await setJourneyPublished(authorClient, entryId, true);

      // add
      await expect(
        addUpbeat(fanClient, { journeyEntryId: entryId }),
      ).resolves.toBe("added");
      const countAfterAdd = await fanClient
        .from("upbeats")
        .select("*", { count: "exact", head: true })
        .eq("journey_entry_id", entryId);
      expect(countAfterAdd.count).toBe(1);

      // a raw duplicate dies on the unique constraint — the DB is the arbiter
      const { error: dup } = await fanClient
        .from("upbeats")
        .insert({ member_id: fan.id, journey_entry_id: entryId });
      expect(dup?.code).toBe("23505");

      // the helper resolves the same race as "already", never a crash
      await expect(
        addUpbeat(fanClient, { journeyEntryId: entryId }),
      ).resolves.toBe("already");

      // presence is reflected in my-upbeats
      const mine = await listMyUpbeats(fanClient, {
        journeyEntryIds: [entryId],
      });
      expect(mine.journeyEntryIds).toContain(entryId);

      // remove is idempotent deletion
      await removeUpbeat(fanClient, { journeyEntryId: entryId });
      const countAfterRemove = await fanClient
        .from("upbeats")
        .select("*", { count: "exact", head: true })
        .eq("journey_entry_id", entryId);
      expect(countAfterRemove.count).toBe(0);

      // cascade: re-add, then deleting the ENTRY deletes the upbeat row
      await expect(
        addUpbeat(fanClient, { journeyEntryId: entryId }),
      ).resolves.toBe("added");
      await deleteJourneyEntry(authorClient, entryId);
      const countAfterEntryDelete = await fanClient
        .from("upbeats")
        .select("*", { count: "exact", head: true })
        .eq("journey_entry_id", entryId);
      expect(countAfterEntryDelete.count).toBe(0);
    } finally {
      await deleteTestUser(author.id);
      await deleteTestUser(fan.id);
    }
  });
});
