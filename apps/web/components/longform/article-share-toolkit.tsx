"use client";

import { useMemo, useState } from "react";

import type { EditorialShareAtoms } from "@onerhythm/types";

function CopyCard({
  body,
  copied,
  heading,
  onCopy,
}: {
  body: string;
  copied: boolean;
  heading: string;
  onCopy: () => void;
}) {
  return (
    <div className="surface-panel-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{heading}</p>
        <button
          className="rounded-full border border-token px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-text-secondary transition-colors duration-micro hover:bg-nebula focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          onClick={onCopy}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}

export function ArticleShareToolkit({
  share,
  title,
  url,
}: {
  share: EditorialShareAtoms;
  title: string;
  url: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const shareTargets = useMemo(
    () => [
      {
        key: "x",
        label: "Share on X",
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${share.x_post_starter} ${url}`)}`,
      },
      {
        key: "linkedin",
        label: "Share on LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      },
      {
        key: "reddit",
        label: "Share on Reddit",
        href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      },
      {
        key: "threads",
        label: "Share on Threads",
        href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${share.share_captions[0]} ${url}`)}`,
      },
    ],
    [share.share_captions, share.x_post_starter, title, url],
  );

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Clipboard access can fail in hardened browsers.
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {shareTargets.map((target) => (
          <a
            className="action-link action-link-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href={target.href}
            key={target.key}
            rel="noreferrer"
            target="_blank"
          >
            {target.label}
          </a>
        ))}
        <button
          className="action-link action-link-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          onClick={() => void copyText("link", url)}
          type="button"
        >
          {copiedKey === "link" ? "Link copied" : "Copy link"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CopyCard
          body={share.x_post_starter}
          copied={copiedKey === "x"}
          heading="X starter"
          onCopy={() => void copyText("x", share.x_post_starter)}
        />
        <CopyCard
          body={share.linkedin_post}
          copied={copiedKey === "linkedin"}
          heading="LinkedIn"
          onCopy={() => void copyText("linkedin", share.linkedin_post)}
        />
        <CopyCard
          body={share.reddit_tldr}
          copied={copiedKey === "reddit"}
          heading="Reddit TL;DR"
          onCopy={() => void copyText("reddit", share.reddit_tldr)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="surface-panel-soft p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            Pull quotes
          </p>
          <div className="mt-4 space-y-3">
            {share.pull_quotes.map((quote, index) => (
              <CopyCard
                body={quote}
                copied={copiedKey === `quote-${index}`}
                heading={`Quote ${index + 1}`}
                key={quote}
                onCopy={() => void copyText(`quote-${index}`, quote)}
              />
            ))}
          </div>
        </div>

        <div className="surface-panel-soft p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            Image-card text
          </p>
          <div className="mt-4 space-y-3">
            {share.image_card_snippets.map((snippet, index) => (
              <CopyCard
                body={snippet}
                copied={copiedKey === `snippet-${index}`}
                heading={`Snippet ${index + 1}`}
                key={snippet}
                onCopy={() => void copyText(`snippet-${index}`, snippet)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CopyCard
          body={share.short_version}
          copied={copiedKey === "short"}
          heading="Short form"
          onCopy={() => void copyText("short", share.short_version)}
        />
        <CopyCard
          body={share.medium_version}
          copied={copiedKey === "medium"}
          heading="Medium form"
          onCopy={() => void copyText("medium", share.medium_version)}
        />
        <CopyCard
          body={share.long_version}
          copied={copiedKey === "long"}
          heading="Canonical summary"
          onCopy={() => void copyText("long", share.long_version)}
        />
      </div>
    </div>
  );
}
