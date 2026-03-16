import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("waitlist proxy route", () => {
  it("forwards the upstream payload without wrapping it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "joined",
          message: "Thanks. You're on the beta waitlist.",
          referral_code: "abc123def456",
          referral_count: 0,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_ONERHYTHM_SITE_URL = "https://onerhythm.org";

    const response = await POST(
      new Request("http://127.0.0.1:3001/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "vitest",
          "X-Forwarded-For": "203.0.113.4",
        },
        body: JSON.stringify({
          email: "person@example.com",
          source: "landing-page",
          website: "",
          referral_code: "ref-source",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/beta/waitlist",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          source: "landing-page",
          website: "",
          referral_code: "ref-source",
        }),
      }),
    );
    expect(response.status).toBe(201);

    await expect(response.json()).resolves.toEqual({
      status: "joined",
      message: "Thanks. You're on the beta waitlist.",
      referral_code: "abc123def456",
      referral_count: 0,
      referral_url: "https://onerhythm.org/join?ref=abc123def456",
    });
  });
});
