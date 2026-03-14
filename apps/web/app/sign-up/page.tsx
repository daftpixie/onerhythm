import type { Metadata } from "next";

import { AuthShell } from "../../components/auth-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return <AuthShell mode="sign-up" />;
}
