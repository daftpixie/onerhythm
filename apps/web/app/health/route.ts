import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "web",
      beta_mode: process.env.BETA_MODE ?? "open",
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
