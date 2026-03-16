import type { WaitlistStats } from "@onerhythm/types";

const API_BASE_URL =
  process.env.ONERHYTHM_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ??
  "http://127.0.0.1:8000";
const FETCH_TIMEOUT_MS = 2000;

const EMPTY_STATS: WaitlistStats = {
  total_signups: 0,
  last_signup_at: null,
};

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  return Promise.race([
    fetch(url, { cache: "no-store", signal: controller.signal }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error("fetch timeout"));
      }, ms);
    }),
  ]);
}

export async function getWaitlistStats(): Promise<WaitlistStats> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/beta/waitlist/stats`,
      FETCH_TIMEOUT_MS,
    );
    if (!response.ok) return EMPTY_STATS;
    return (await response.json()) as WaitlistStats;
  } catch {
    return EMPTY_STATS;
  }
}
