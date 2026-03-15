import type { PublicCommunityStory } from "@onerhythm/types";

const API_BASE_URL =
  process.env.ONERHYTHM_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ONERHYTHM_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function getPublicStories(): Promise<PublicCommunityStory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/stories/public`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as PublicCommunityStory[];
  } catch {
    return [];
  }
}

export async function getPublicStoryBySlug(slug: string): Promise<PublicCommunityStory | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/stories/public/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicCommunityStory;
  } catch {
    return null;
  }
}
