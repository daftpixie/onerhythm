import { ConsentShell } from "../../../components/contribute";
import { requireAuthenticatedPage } from "../../../lib/server-auth";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  await requireAuthenticatedPage("/contribute/consent");
  return <ConsentShell />;
}
