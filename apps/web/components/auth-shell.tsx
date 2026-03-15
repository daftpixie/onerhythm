"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";

import { Button, Card, FieldWrapper, Input } from "@onerhythm/ui";

import { signIn, signUp, type SessionResponse } from "../lib/auth-api";
import { BETA_PENDING_PATH, hasPendingBetaAccess } from "../lib/beta-access";
import { PublicSiteFooter } from "./public-site-footer";

type AuthMode = "sign-in" | "sign-up";

function normalizeRequestedNextPath(requestedNextPath: string | null): string | null {
  if (!requestedNextPath || !requestedNextPath.startsWith("/")) {
    return null;
  }

  if (requestedNextPath.startsWith("//")) {
    return null;
  }

  return requestedNextPath;
}

export function resolvePostAuthPath({
  mode,
  requestedNextPath,
  session,
}: {
  mode: AuthMode;
  requestedNextPath: string | null;
  session: SessionResponse;
}): string {
  if (hasPendingBetaAccess(session)) {
    return BETA_PENDING_PATH;
  }

  const safeNextPath = normalizeRequestedNextPath(requestedNextPath);
  if (safeNextPath) {
    return safeNextPath;
  }

  if (mode === "sign-up") {
    return "/onboarding";
  }

  return session.user?.profile_id ? "/account/data" : "/onboarding";
}

export function AuthShell({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams?.get("next") ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en-US");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords need to match before you create the account.");
      return;
    }

    startTransition(async () => {
      try {
        const session =
          mode === "sign-up"
            ? await signUp({ email, password, preferred_language: preferredLanguage })
            : await signIn({ email, password });

        router.push(resolvePostAuthPath({ mode, requestedNextPath, session }));
        router.refresh();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
      }
    });
  }

  return (
    <>
      <main className="page-shell mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
        <header className="page-header">
          <p className="page-eyebrow">Account access</p>
          <h1 className="page-title mt-4 max-w-3xl">
            {mode === "sign-up"
              ? "Closed beta accounts are invite-only. If your email is approved, create your account here."
              : "Welcome back. Your profile, guidance, and controls are here."}
          </h1>
          <p className="page-intro mt-4 max-w-2xl">
            {mode === "sign-up"
              ? "OneRhythm is opening carefully. Accounts keep ownership boundaries explicit across self-reported profiles, uploads, consent, educational guidance, and export or delete requests."
              : "Accounts keep ownership boundaries explicit across self-reported profiles, uploads, consent, educational guidance, and export or delete requests."}
          </p>
        </header>

        <Card className="max-w-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldWrapper htmlFor="email" label="Email">
              <Input
                autoComplete="email"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </FieldWrapper>

            <FieldWrapper
              description="Use 12 to 128 characters with letters plus at least one number or symbol."
              htmlFor="password"
              label="Password"
            >
              <Input
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
                maxLength={128}
              />
            </FieldWrapper>

            {mode === "sign-up" ? (
              <FieldWrapper htmlFor="confirm-password" label="Confirm password">
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  name="confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                  maxLength={128}
                />
              </FieldWrapper>
            ) : null}

            {mode === "sign-up" ? (
              <FieldWrapper htmlFor="preferred-language" label="Preferred language">
                <Input
                  id="preferred-language"
                  name="preferred-language"
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                  value={preferredLanguage}
                />
              </FieldWrapper>
            ) : null}

            <Button
              disabled={
                isPending ||
                !email ||
                !password ||
                (mode === "sign-up" && !confirmPassword)
              }
              type="submit"
            >
              {isPending
                ? mode === "sign-up"
                  ? "Creating your account..."
                  : "Signing in..."
                : mode === "sign-up"
                  ? "Create beta account"
                  : "Sign in"}
            </Button>

            <p aria-live="polite" className="text-sm text-pulse">
              {error}
            </p>
          </form>

          <p className="mt-6 text-sm leading-6 text-text-secondary">
            {mode === "sign-up" ? (
              <>
                Already have an account?{" "}
                <Link className="text-signal" href="/sign-in">
                  Sign in.
                </Link>
                {" "}No invite yet?{" "}
                <Link className="text-signal" href="/#waitlist">
                  Join the waitlist.
                </Link>
              </>
            ) : (
              <>
                New to OneRhythm?{" "}
                <Link className="text-signal" href="/sign-up">
                  Use your invite.
                </Link>
                {" "}Need beta access first?{" "}
                <Link className="text-signal" href="/#waitlist">
                  Join the waitlist.
                </Link>
              </>
            )}
          </p>
        </Card>
      </main>
      <PublicSiteFooter className="mt-10" />
    </>
  );
}
