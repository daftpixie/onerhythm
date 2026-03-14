"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "onerhythm-contrast";

export function ContrastToggle() {
  const [high, setHigh] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "high") {
      setHigh(true);
      document.documentElement.setAttribute("data-contrast", "high");
    }
  }, []);

  const toggle = useCallback(() => {
    setHigh((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.setAttribute("data-contrast", "high");
        localStorage.setItem(STORAGE_KEY, "high");
      } else {
        document.documentElement.removeAttribute("data-contrast");
        localStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }, []);

  return (
    <button
      aria-label={high ? "Switch to standard contrast" : "Switch to high contrast"}
      aria-pressed={high}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-token text-text-secondary transition-colors duration-micro ease-out hover:bg-cosmos-nebula/80 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void"
      onClick={toggle}
      title={high ? "Standard contrast" : "High contrast"}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4.5 w-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
      </svg>
    </button>
  );
}
