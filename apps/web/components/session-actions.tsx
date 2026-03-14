"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@onerhythm/ui";

import { signOut } from "../lib/auth-api";

export function SessionActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          router.push("/sign-in");
          router.refresh();
        })
      }
      type="button"
      variant="ghost"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
