import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("waitlist referral proxy route", () => {
  it("forwards the referral status payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          referral_code: "abc123def456",
          referral_count: 3,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://127.0.0.1:3001/api/waitlist/referral/abc123def456"), {
      params: Promise.resolve({ code: "abc123def456" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/beta/waitlist/referrals/abc123def456",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    await expect(response.json()).resolves.toEqual({
      referral_code: "abc123def456",
      referral_count: 3,
    });
  });
});
