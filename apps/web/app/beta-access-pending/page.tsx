import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@onerhythm/ui";

import { SessionActions } from "../../components/session-actions";
import { buildPageMetadata } from "../../lib/metadata";
import { BETA_PENDING_PATH, hasPendingBetaAccess } from "../../lib/beta-access";
import { getAuthenticatedLandingPath, getServerSession } from "../../lib/server-auth";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Beta access pending",
    description:
      "Your account is signed in, but closed beta access is still pending at OneRhythm.",
    path: BETA_PENDING_PATH,
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BetaAccessPendingPage() {
  const session = await getServerSession();

  if (!session.authenticated || !session.user) {
    redirect("/");
  }

  if (!hasPendingBetaAccess(session)) {
    redirect(getAuthenticatedLandingPath(session));
  }

  return (
    <main className="page-shell mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10 lg:px-12">
      <header className="page-header max-w-3xl">
        <p className="page-eyebrow">Closed beta</p>
        <h1 className="page-title mt-4 max-w-2xl">Your beta access is still pending.</h1>
        <p className="page-intro mt-4 max-w-2xl">
          This account is signed in, but it has not been added to the current invite
          list yet. We are opening carefully so the first deployment stays humane,
          stable, and privacy-first.
        </p>
      </header>

      <Card className="max-w-2xl space-y-5">
        <p className="text-base leading-7 text-text-secondary">
          If you joined the waitlist with a different email, sign out and use that
          invited address when you create or access your account. If this address is
          already on the invite list, we will open access from our side without asking
          for more data.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-[0.9rem] border border-token px-4 py-2.5 text-sm text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href="/#waitlist"
          >
            Review the waitlist
          </Link>
          <SessionActions />
        </div>
      </Card>
    </main>
  );
}
