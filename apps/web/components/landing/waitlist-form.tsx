"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, FieldWrapper, Input } from "@onerhythm/ui";

type WaitlistResponse = {
  status: "joined" | "already_joined";
  message: string;
};

type WaitlistState = "idle" | "submitting" | "success" | "duplicate" | "error";
const DEFAULT_MESSAGE =
  "We only store your email for beta updates. No health data. No ECG upload.";

function isWaitlistResponse(payload: unknown): payload is WaitlistResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "status" in payload &&
      typeof payload.status === "string" &&
      "message" in payload &&
      typeof payload.message === "string",
  );
}

function resolveButtonLabel(state: WaitlistState): string {
  if (state === "submitting") return "Joining...";
  if (state === "success") return "You're on the list";
  if (state === "duplicate") return "Already joined";
  if (state === "error") return "Try again";
  return "Join the beta waitlist";
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [state, setState] = useState<WaitlistState>("idle");
  const [isPending, startTransition] = useTransition();

  function resetFeedback() {
    if (state === "idle") {
      return;
    }

    setState("idle");
    setMessage(DEFAULT_MESSAGE);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    startTransition(async () => {
      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            source: "landing-page",
            website,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | WaitlistResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          setState("error");
          setMessage(
            payload && "message" in payload && typeof payload.message === "string"
              ? payload.message
              : "The waitlist could not be updated right now. Please try again in a moment.",
          );
          return;
        }

        if (isWaitlistResponse(payload) && payload.status === "already_joined") {
          setState("duplicate");
          setMessage(payload.message);
          return;
        }

        setState("success");
        setMessage(
          isWaitlistResponse(payload)
            ? payload.message
            : "Thanks. You're on the beta waitlist.",
        );
        setEmail("");
        setWebsite("");
      } catch {
        setState("error");
        setMessage("The waitlist could not be updated right now. Please try again in a moment.");
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FieldWrapper
        description="Closed beta updates only. We will not mix this with profile or ECG data."
        htmlFor="waitlist-email"
        label="Email"
      >
        <Input
          autoComplete="email"
          disabled={isPending}
          id="waitlist-email"
          name="email"
          onChange={(event) => {
            resetFeedback();
            setEmail(event.target.value);
          }}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </FieldWrapper>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="waitlist-website">Website</label>
        <input
          autoComplete="off"
          id="waitlist-website"
          name="website"
          onChange={(event) => {
            resetFeedback();
            setWebsite(event.target.value);
          }}
          tabIndex={-1}
          type="text"
          value={website}
        />
      </div>

      <Button
        className="w-full"
        disabled={isPending || !email}
        type="submit"
      >
        {resolveButtonLabel(state)}
      </Button>

      <p
        aria-live="polite"
        className={[
          "min-h-12 text-sm leading-6",
          state === "error"
            ? "text-pulse"
            : state === "success" || state === "duplicate"
              ? "text-signal-soft"
              : "text-text-secondary",
        ].join(" ")}
      >
        {message}
      </p>
    </form>
  );
}
