import { NextResponse } from "next/server";

import { getRhythmDistanceStats } from "../../../../lib/rhythm-api";
import { getWaitlistStats } from "../../../../lib/waitlist-api";

export async function GET() {
  const [waitlist, rhythm] = await Promise.all([
    getWaitlistStats(),
    getRhythmDistanceStats(),
  ]);

  return NextResponse.json(
    {
      waitlist,
      rhythm,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export const dynamic = "force-dynamic";
