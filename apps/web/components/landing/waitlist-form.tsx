"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  Compass,
  Copy,
  Map,
  Rocket,
  Shield,
  Send,
  Share2,
} from "lucide-react";

import { Button, FieldWrapper, Input } from "@onerhythm/ui";
import type { WaitlistReferralStatus, WaitlistSignupResponse } from "@onerhythm/types";

type WaitlistState = "idle" | "submitting" | "success" | "duplicate" | "error";

type WaitlistFormProps = {
  buttonLabel?: string;
  className?: string;
  idPrefix?: string;
  initialReferralCode?: string | null;
  source?: string;
};

type StoredWaitlistSubmission = WaitlistSignupResponse & {
  updated_at: string;
};

const STORAGE_KEY = "onerhythm.waitlist-submission.v1";
const STORAGE_EVENT = "onerhythm:waitlist-submission";
const DEFAULT_MESSAGE =
  "No spam. No data extraction. Unsubscribe anytime.";

function isStoredSubmission(payload: unknown): payload is StoredWaitlistSubmission {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "status" in payload &&
      typeof payload.status === "string" &&
      "message" in payload &&
      typeof payload.message === "string" &&
      "referral_count" in payload &&
      typeof payload.referral_count === "number",
  );
}

function readStoredSubmission(): StoredWaitlistSubmission | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStoredSubmission(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredSubmission(payload: StoredWaitlistSubmission | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (payload) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(
    new CustomEvent<StoredWaitlistSubmission | null>(STORAGE_EVENT, {
      detail: payload,
    }),
  );
}

function resolveButtonLabel(state: WaitlistState, buttonLabel: string): string {
  if (state === "submitting") return "Joining...";
  if (state === "success") return "You're on the list";
  if (state === "duplicate") return "Already joined";
  if (state === "error") return "Try again";
  return buttonLabel;
}

function buildRedditShareUrl(url: string): string {
  const title =
    "I just joined the @OneRhythm beta - a community platform for arrhythmia patients that's tracking our collective ECG distance to the Moon. 88.3% of us report severe anxiety. Nobody is screening for it. We're changing that. Join me:";
  return `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
}

function buildXShareUrl(url: string): string {
  const text =
    "I just joined the @OneRhythm beta - a community platform for arrhythmia patients tracking our collective ECG distance to the Moon. 88.3% of us report severe anxiety. Nobody is screening for it. We're changing that.";
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url} #InvisibleBears`)}`;
}

function badgeForReferralCount(referralCount: number) {
  if (referralCount >= 10) {
    return {
      label: "Mission Commander",
      icon: Rocket,
      className: "border-pulse/35 bg-pulse/10 text-pulse-glow shadow-pulse",
    };
  }

  if (referralCount >= 5) {
    return {
      label: "Navigator",
      icon: Map,
      className: "border-aurora/35 bg-aurora/10 text-aurora-glow shadow-aurora",
    };
  }

  if (referralCount >= 1) {
    return {
      label: "Scout",
      icon: Compass,
      className: "border-signal/35 bg-signal/10 text-signal-soft shadow-signal",
    };
  }

  return null;
}

export function WaitlistForm({
  buttonLabel = "Join the Mission",
  className = "",
  idPrefix = "waitlist",
  initialReferralCode = null,
  source = "landing-page",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [state, setState] = useState<WaitlistState>("idle");
  const [submission, setSubmission] = useState<StoredWaitlistSubmission | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const copyFeedbackTimeout = useRef<number | null>(null);

  useEffect(() => {
    setSubmission(readStoredSubmission());

    function syncSubmission(event: Event) {
      const customEvent = event as CustomEvent<StoredWaitlistSubmission | null>;
      if (customEvent.detail !== undefined) {
        setSubmission(customEvent.detail);
        return;
      }

      setSubmission(readStoredSubmission());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setSubmission(readStoredSubmission());
      }
    }

    window.addEventListener(STORAGE_EVENT, syncSubmission as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(STORAGE_EVENT, syncSubmission as EventListener);
      window.removeEventListener("storage", handleStorage);
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentSubmission = submission;
    const referralCode = currentSubmission?.referral_code;
    if (!currentSubmission || !referralCode) {
      return;
    }
    const confirmedSubmission: StoredWaitlistSubmission = currentSubmission;
    const confirmedReferralCode: string = referralCode;

    let cancelled = false;

    async function refreshReferralCount() {
      try {
        const response = await fetch(
          `/api/waitlist/referral/${encodeURIComponent(confirmedReferralCode)}`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as WaitlistReferralStatus;
        if (
          cancelled ||
          typeof payload.referral_count !== "number" ||
          payload.referral_count === confirmedSubmission.referral_count
        ) {
          return;
        }

        const nextSubmission: StoredWaitlistSubmission = {
          status: confirmedSubmission.status,
          message: confirmedSubmission.message,
          referral_code: confirmedSubmission.referral_code,
          referral_url: confirmedSubmission.referral_url ?? null,
          referral_count: payload.referral_count,
          updated_at: new Date().toISOString(),
        };
        writeStoredSubmission(nextSubmission);
        setSubmission(nextSubmission);
      } catch {
        // Keep the last confirmed referral state visible.
      }
    }

    void refreshReferralCount();
    const interval = window.setInterval(() => {
      void refreshReferralCount();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [submission]);

  function resetFeedback() {
    if (state !== "idle") {
      setState("idle");
      setMessage(DEFAULT_MESSAGE);
    }
  }

  function clearSubmission() {
    writeStoredSubmission(null);
    setSubmission(null);
    setState("idle");
    setMessage(DEFAULT_MESSAGE);
    setCopyState("idle");
  }

  function openShareWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyReferralUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (copyFeedbackTimeout.current) {
      window.clearTimeout(copyFeedbackTimeout.current);
    }

    copyFeedbackTimeout.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);
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
            source,
            website,
            referral_code: initialReferralCode,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | (WaitlistSignupResponse & { referral_url?: string | null })
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

        if (
          payload &&
          typeof payload === "object" &&
          "status" in payload &&
          typeof payload.status === "string" &&
          "message" in payload &&
          typeof payload.message === "string"
        ) {
          const nextSubmission: StoredWaitlistSubmission = {
            status: payload.status,
            message: payload.message,
            referral_code:
              "referral_code" in payload && typeof payload.referral_code === "string"
                ? payload.referral_code
                : null,
            referral_count:
              "referral_count" in payload && typeof payload.referral_count === "number"
                ? payload.referral_count
                : 0,
            referral_url:
              "referral_url" in payload && typeof payload.referral_url === "string"
                ? payload.referral_url
                : null,
            updated_at: new Date().toISOString(),
          };

          writeStoredSubmission(nextSubmission);
          setSubmission(nextSubmission);
          setState(payload.status === "already_joined" ? "duplicate" : "success");
          setMessage(payload.message);
          setEmail("");
          setWebsite("");
          return;
        }

        setState("success");
        setMessage("Thanks. You're on the beta waitlist.");
      } catch {
        setState("error");
        setMessage("The waitlist could not be updated right now. Please try again in a moment.");
      }
    });
  }

  if (submission) {
    const referralUrl = submission.referral_url ?? null;
    const badge = badgeForReferralCount(submission.referral_count);

    return (
      <div className={["space-y-5", className].join(" ")}>
        <div className="rounded-[1.5rem] border border-pulse/30 bg-[linear-gradient(180deg,rgba(37,43,72,0.78),rgba(17,24,39,0.9))] p-5 shadow-panel">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-pulse-glow">
            Mission confirmed
          </p>
          <h3 className="mt-3 font-display text-2xl leading-tight text-text-primary">
            You&apos;re in. Welcome to the mission.
          </h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {submission.message} Your founding member spot is reserved. Now help us
            reach the English Channel, one 25 centimeter promise at a time.
          </p>
        </div>

        {referralUrl ? (
          <div className="space-y-3 rounded-[1.35rem] border border-signal/25 bg-midnight/80 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-soft">
              Your referral link
            </p>
            <code className="block overflow-x-auto rounded-[1rem] border border-token bg-deep-void/85 px-4 py-3 font-mono text-sm leading-6 text-signal-soft">
              {referralUrl}
            </code>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                className="landing-share-button"
                onClick={() => openShareWindow(buildRedditShareUrl(referralUrl))}
                type="button"
              >
                <Share2 className="h-4 w-4" />
                Share on Reddit
              </button>
              <button
                className="landing-share-button"
                onClick={() => openShareWindow(buildXShareUrl(referralUrl))}
                type="button"
              >
                <Send className="h-4 w-4" />
                Share on X
              </button>
              <button
                className={[
                  "landing-share-button",
                  copyState === "copied" ? "border-aurora/40 text-aurora-glow shadow-aurora" : "",
                ].join(" ")}
                onClick={() => {
                  void copyReferralUrl(referralUrl);
                }}
                type="button"
              >
                <Copy className="h-4 w-4" />
                {copyState === "copied"
                  ? "Copied!"
                  : copyState === "error"
                    ? "Copy failed"
                    : "Copy link"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.35rem] border border-token bg-midnight/75 p-4">
          <p className="text-sm leading-7 text-text-secondary">
            You&apos;ve brought{" "}
            <span className="font-medium text-text-primary">
              {submission.referral_count.toLocaleString()}
            </span>{" "}
            people aboard. That&apos;s{" "}
            <span className="font-medium text-text-primary">
              {(submission.referral_count * 0.25).toLocaleString(undefined, {
                maximumFractionDigits: submission.referral_count > 0 ? 2 : 0,
              })}
              m
            </span>{" "}
            added to the mission projection.
          </p>
          {badge ? (
            <div
              className={[
                "mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium",
                badge.className,
              ].join(" ")}
            >
              <badge.icon className="h-4 w-4" />
              {badge.label}
            </div>
          ) : (
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-text-tertiary">
              First badge unlocks at one confirmed referral.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            className="rounded-[0.9rem] border border-token px-4 py-2.5 text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            onClick={clearSubmission}
            type="button"
          >
            Use another email
          </button>
          <Link
            className="link-row"
            href="/about"
          >
            Review privacy and consent
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={["space-y-4", className].join(" ")} onSubmit={handleSubmit}>
      <FieldWrapper
        description="Closed beta updates only."
        htmlFor={`${idPrefix}-email`}
        label="Email"
      >
        <Input
          autoComplete="email"
          disabled={isPending}
          id={`${idPrefix}-email`}
          name="email"
          onChange={(event) => {
            resetFeedback();
            setEmail(event.target.value);
          }}
          placeholder="Your email address"
          type="email"
          value={email}
        />
      </FieldWrapper>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          autoComplete="off"
          id={`${idPrefix}-website`}
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

      {initialReferralCode ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-aurora/30 bg-aurora/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-aurora-glow">
          <Compass className="h-3.5 w-3.5" />
          Referred by a founding member
        </div>
      ) : null}

      <Button className="w-full" disabled={isPending || !email.trim()} type="submit">
        {resolveButtonLabel(state, buttonLabel)}
      </Button>

      <p
        aria-live="polite"
        className={[
          "min-h-10 text-sm leading-6",
          state === "error"
            ? "text-pulse"
            : state === "success" || state === "duplicate"
              ? "text-signal-soft"
              : "text-text-secondary",
        ].join(" ")}
      >
        {message}
      </p>

      <div className="space-y-3 text-sm text-text-tertiary">
        <p>
          {" "}
          <Link className="text-signal-soft" href="/about">
            Full privacy policy {"->"}
          </Link>
        </p>
      </div>
    </form>
  );
}
