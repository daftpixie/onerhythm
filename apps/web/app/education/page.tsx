import type { Metadata } from "next";

import { requireAuthenticatedPage } from "../../lib/server-auth";
import { EducationShell } from "./education-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EducationPage() {
  await requireAuthenticatedPage("/education");
  return <EducationShell />;
}
