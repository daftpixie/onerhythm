import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { code } = await context.params;

  try {
    const upstream = await fetch(
      `${API_BASE_URL}/v1/beta/waitlist/referrals/${encodeURIComponent(code)}`,
      {
        cache: "no-store",
      },
    );
    const payload = await upstream.json().catch(() => null);

    return NextResponse.json(payload, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        message: "The referral service is temporarily unavailable. Please try again shortly.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export const dynamic = "force-dynamic";
