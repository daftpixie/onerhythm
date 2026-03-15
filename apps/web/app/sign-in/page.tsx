import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "../../components/auth-shell";
import { getAuthenticatedLandingPath, getServerSession } from "../../lib/server-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage() {
  const session = await getServerSession();

  if (session.authenticated && session.user) {
    redirect(getAuthenticatedLandingPath(session));
  }

  return <AuthShell mode="sign-in" />;
}
