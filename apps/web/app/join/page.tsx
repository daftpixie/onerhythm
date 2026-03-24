import type { Metadata } from "next";

import { MissionJoinShell } from "../../components/mission/mission-join-shell";
import { siteContent } from "../../content/site-copy";
import { buildPageMetadata } from "../../lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: siteContent.metadata.join.title,
  description: siteContent.metadata.join.description,
  path: "/join",
  keywords: [...siteContent.metadata.join.keywords],
});

type JoinPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const referralSource = getSingleParam(resolvedSearchParams.ref);

  return (
    <MissionJoinShell
      botcheckBypassToken={
        process.env.NEXT_PUBLIC_MISSION_BOTCHECK_BYPASS_TOKEN ??
        (process.env.NODE_ENV === "production" ? undefined : "dev-turnstile-pass")
      }
      referralSource={referralSource}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  );
}
