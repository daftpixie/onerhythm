import type { Metadata } from "next";

import { requireAuthenticatedPage } from "../../../lib/server-auth";
import { DataControlsShell } from "./data-controls-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DataControlsPage() {
  await requireAuthenticatedPage("/account/data");
  return <DataControlsShell />;
}
