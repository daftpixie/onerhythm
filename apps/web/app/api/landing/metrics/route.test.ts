import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("../../../../lib/rhythm-api", () => ({
  getRhythmDistanceStats: vi.fn().mockResolvedValue({
    total_distance_km: 12.5,
    total_contributions: 50,
    earth_loops: 0.0003,
    current_milestone: null,
    next_milestone: { key: "earth", label: "Around the Earth", distance_km: 40075, description: "" },
    progress_toward_next: 0.01,
    last_contribution_at: null,
  }),
}));

vi.mock("../../../../lib/waitlist-api", () => ({
  getWaitlistStats: vi.fn().mockResolvedValue({
    total_signups: 128,
    last_signup_at: "2026-03-15T00:00:00Z",
  }),
}));

describe("landing metrics route", () => {
  it("returns combined waitlist and rhythm metrics", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      waitlist: {
        total_signups: 128,
        last_signup_at: "2026-03-15T00:00:00Z",
      },
      rhythm: {
        total_distance_km: 12.5,
        total_contributions: 50,
        earth_loops: 0.0003,
        current_milestone: null,
        next_milestone: {
          key: "earth",
          label: "Around the Earth",
          distance_km: 40075,
          description: "",
        },
        progress_toward_next: 0.01,
        last_contribution_at: null,
      },
    });
  });
});
