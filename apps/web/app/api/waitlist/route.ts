import { NextResponse } from "next/server";

import { getSiteUrl } from "../../../lib/site";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";

type WaitlistRequestBody = {
  email?: unknown;
  source?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WaitlistRequestBody | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const source = typeof body?.source === "string" ? body.source : "landing-page";
  const website = typeof body?.website === "string" ? body.website : "";

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
      }),
    });
    const payload = await upstream.json().catch(() => null);

    return NextResponse.json(payload, {
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
