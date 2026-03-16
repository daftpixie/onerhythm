import { NextResponse } from "next/server";

import { getSiteUrl } from "../../../lib/site";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";

type WaitlistRequestBody = {
  email?: unknown;
  source?: unknown;
  website?: unknown;
  referral_code?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WaitlistRequestBody | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const source = typeof body?.source === "string" ? body.source : "landing-page";
  const website = typeof body?.website === "string" ? body.website : "";
  const referral_code =
    typeof body?.referral_code === "string" ? body.referral_code : undefined;

  if (!email.trim()) {
    return NextResponse.json(
      { message: "Enter a valid email address." },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/v1/beta/waitlist`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Origin: getSiteUrl(),
        "User-Agent": request.headers.get("user-agent") ?? "onerhythm-web/waitlist",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({
          email,
          source,
          website,
          referral_code,
        }),
      });
    const payload = await upstream.json().catch(() => null);
    const referralCode =
      payload &&
      typeof payload === "object" &&
      "referral_code" in payload &&
      typeof payload.referral_code === "string"
        ? payload.referral_code
        : null;
    const responsePayload =
      payload && typeof payload === "object"
        ? {
            ...payload,
            referral_url: referralCode ? `${getSiteUrl()}/join?ref=${referralCode}` : null,
          }
        : payload;

    return NextResponse.json(responsePayload, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message: "The waitlist service is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export const dynamic = "force-dynamic";
