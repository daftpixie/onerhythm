"use client";

import { useState } from "react";

export function ArticleDocumentActions({
  printLabel,
}: {
  printLabel: string;
}) {
  const [printed, setPrinted] = useState(false);

  function handlePrint() {
    setPrinted(true);
    window.print();
    window.setTimeout(() => setPrinted(false), 1800);
  }

  return (
    <div className="surface-panel-soft article-print-exclude p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
        Document mode
      </p>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        This page is designed to print cleanly so it can be saved as a branded document or shared
        as a reading copy without leaving the platform.
      </p>
      <button
        className="action-link action-link-secondary mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        onClick={handlePrint}
        type="button"
      >
        {printed ? "Preparing print view..." : printLabel}
      </button>
    </div>
  );
}
