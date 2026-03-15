import { requireAuthenticatedPage } from "../../../lib/server-auth";
import { UploadShell } from "../../../components/contribute/upload-shell";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requireAuthenticatedPage("/contribute/upload");
  return <UploadShell />;
}
