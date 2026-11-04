/**
 * @jest-environment node
 *
 * Phase 1C invariant: the profile is created EXACTLY ONCE on first sign-in
 * (handle_new_user trigger), with safe, non-identifying defaults.
 */
import { admin, createTestUser, deleteTestUser } from "./helpers";

describe("profile creation on first sign-in", () => {
  it("creates exactly one profile with safe defaults", async () => {
    const user = await createTestUser();
    try {
      const { data, error } = await admin
        .from("profiles")
        .select("id, role, display_name, self_declared")
        .eq("id", user.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].role).toBe("patient");
      expect(data![0].display_name).toBe("New member");
      // no role/self-declaration is assumed before onboarding
      expect(data![0].self_declared).toBeNull();
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("creates an independent single profile per new user", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    try {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .in("id", [a.id, b.id]);
      expect(data).toHaveLength(2);
    } finally {
      await deleteTestUser(a.id);
      await deleteTestUser(b.id);
    }
  });
});
