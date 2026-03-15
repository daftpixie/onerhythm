import { requireAuthenticatedPage } from "../../../lib/server-auth";
import { RevealShell } from "../../../components/contribute/reveal-shell";

export const dynamic = "force-dynamic";

export default async function RevealPage() {
  await requireAuthenticatedPage("/contribute/reveal");
  return <RevealShell />;
}
