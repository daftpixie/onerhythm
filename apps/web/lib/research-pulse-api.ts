import { cookies } from "next/headers";

import type { ResearchPulseDetail, ResearchPulseFeedItem, ResearchPulseQuery } from "@onerhythm/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = "onerhythm_session";

type ResearchPulseFeedResponse = {
  items: ResearchPulseFeedItem[];
  page: number;
  page_size: number;
  total_items: number;
};

export class ResearchPulseRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ResearchPulseRequestError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; code?: string } }
      | null;
    throw new ResearchPulseRequestError(
      payload?.error?.message ?? "The request could not be completed.",
      response.status,
      payload?.error?.code,
    );
  }
  return (await response.json()) as T;
}

function buildQueryString(query: ResearchPulseQuery = {}): string {
  const params = new URLSearchParams();
  if (query.locale) params.set("locale", query.locale);
  if (query.diagnosis_code) params.set("diagnosis_code", query.diagnosis_code);
  if (query.theme_key) params.set("theme_key", query.theme_key);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  return params.toString();
}

async function requestResearchPulseFeed(
  path: string,
  query: ResearchPulseQuery = {},
  init?: RequestInit & { revalidate?: number },
): Promise<ResearchPulseFeedResponse> {
  const queryString = buildQueryString(query);
  const url = queryString ? `${API_BASE_URL}${path}?${queryString}` : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    next: init?.revalidate ? { revalidate: init.revalidate } : undefined,
  });
  return parseResponse<ResearchPulseFeedResponse>(response);
}

export async function listResearchPulse(query: ResearchPulseQuery = {}): Promise<ResearchPulseFeedResponse> {
  return requestResearchPulseFeed("/v1/research-pulse", query, { revalidate: 3600 });
}

export async function listLatestResearchPulse(query: ResearchPulseQuery = {}): Promise<ResearchPulseFeedResponse> {
  return requestResearchPulseFeed("/v1/research-pulse/latest", query, { revalidate: 3600 });
}

export async function listTopicResearchPulse(
  themeKey: NonNullable<ResearchPulseQuery["theme_key"]>,
  query: Omit<ResearchPulseQuery, "theme_key"> = {},
): Promise<ResearchPulseFeedResponse> {
  return requestResearchPulseFeed(`/v1/research-pulse/topics/${encodeURIComponent(themeKey)}`, query, {
    revalidate: 3600,
  });
}

export async function listPersonalizedResearchPulse(
  query: Omit<ResearchPulseQuery, "diagnosis_code"> = {},
): Promise<ResearchPulseFeedResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const headers: HeadersInit = sessionToken
    ? { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` }
    : {};
  return requestResearchPulseFeed("/v1/research-pulse/for-you", query, {
    cache: "no-store",
    headers,
  });
}

export async function getResearchPulseDetail(slug: string, locale = "en-US"): Promise<ResearchPulseDetail> {
  const response = await fetch(
    `${API_BASE_URL}/v1/research-pulse/${slug}?locale=${encodeURIComponent(locale)}`,
    { next: { revalidate: 3600 } },
  );
  return parseResponse<ResearchPulseDetail>(response);
}
