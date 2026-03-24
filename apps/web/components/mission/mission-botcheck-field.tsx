"use client";

import { useEffect, useRef } from "react";

import { Input } from "@onerhythm/ui";

declare global {
  interface Window {
    turnstile?: {
      remove: (widgetId: string) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme: "dark";
          action: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
    };
  }
}

type MissionBotcheckFieldProps = {
  disabled?: boolean;
  bypassToken?: string;
  siteKey?: string;
  value: string;
  onChange: (value: string) => void;
};

const TURNSTILE_SCRIPT_ID = "onerhythm-turnstile-script";

export function MissionBotcheckField({
  disabled = false,
  bypassToken,
  siteKey,
  value,
  onChange,
}: MissionBotcheckFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resolvedSiteKey = siteKey ?? "";
    if (!resolvedSiteKey || typeof window === "undefined") {
      return;
    }

    let widgetId: string | null = null;
    let removed = false;

    function mountWidget() {
      if (removed || !containerRef.current || !window.turnstile) {
        return;
      }

      containerRef.current.innerHTML = "";
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: resolvedSiteKey,
        theme: "dark",
        action: "mission_finalize",
        callback: (token) => onChange(token),
        "expired-callback": () => onChange(""),
        "error-callback": () => onChange(""),
      });
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as
      | HTMLScriptElement
      | null;
    if (window.turnstile) {
      mountWidget();
    } else if (existingScript) {
      existingScript.addEventListener("load", mountWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.addEventListener("load", mountWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      removed = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onChange, siteKey]);

  if (!siteKey) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary" htmlFor="mission-botcheck">
          Bot check token
        </label>
        <p className="text-sm leading-6 text-text-secondary">
          Local and test environments use a developer bypass token instead of the live
          Turnstile widget.
        </p>
        <Input
          autoCapitalize="none"
          autoComplete="off"
          disabled={disabled}
          id="mission-botcheck"
          name="mission-botcheck"
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="dev-turnstile-pass"
          spellCheck={false}
          value={value}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">Bot check</p>
      <p className="text-sm leading-6 text-text-secondary">
        One quick check protects the mission from automated spam before your 0.75 m is
        counted.
      </p>
      <div
        className="min-h-20 rounded-[1.1rem] border border-token bg-midnight/70 p-3"
        ref={containerRef}
      />
      {value ? (
        <p className="text-xs uppercase tracking-[0.18em] text-signal-soft">
          Verification ready
        </p>
      ) : null}
    </div>
  );
}
