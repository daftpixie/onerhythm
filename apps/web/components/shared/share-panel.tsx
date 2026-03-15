"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type SharePanelProps = {
  sharePageUrl: string;
  distanceKm: number;
  earthPercent: number;
  contributorCount: number;
  headline?: string;
  subline?: string;
  /** "contribution" shows Download Art; "story" omits it */
  variant?: "contribution" | "story";
  storyTitle?: string;
  artTileUrl?: string;
  contributionId?: string;
};

function ShareButton({
  label,
  icon,
  onClick,
  ariaLabel,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-token bg-cosmos px-4 py-3 transition-colors duration-micro hover:bg-nebula hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      onClick={onClick}
    >
      <span className="text-text-secondary">{icon}</span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </button>
  );
}

const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

export function SharePanel({
  sharePageUrl,
  distanceKm,
  earthPercent,
  contributorCount,
  headline = "Share Your Rhythm",
  subline = "Let someone know they're not alone.",
  variant = "contribution",
  storyTitle,
  artTileUrl,
  contributionId,
}: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const twitterText =
    variant === "story"
      ? `A story from the OneRhythm community: "${storyTitle}" — personal narratives from people living with arrhythmia.\n\n#OneRhythm #InvisibleBears`
      : `My heart rhythm just became art.\n\nIt joined ${contributorCount.toLocaleString()} others in the OneRhythm mosaic — ${distanceKm.toLocaleString()} km of shared rhythm, ${earthPercent.toFixed(1)}% of the way around the world.\n\nYou are not alone in this.\n\n#OneRhythm #InvisibleBears`;

  const redditTitle =
    variant === "story"
      ? `"${storyTitle}" — a story from the OneRhythm arrhythmia community`
      : `My heart rhythm became art — joined ${contributorCount.toLocaleString()} others in a mosaic circling the Earth [OneRhythm]`;

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(sharePageUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sharePageUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePageUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  function shareReddit() {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(sharePageUrl)}&title=${encodeURIComponent(redditTitle)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(sharePageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text from a temporary input
    }
  }

  function downloadArt() {
    if (!artTileUrl || !contributionId) return;
    const a = document.createElement("a");
    a.href = artTileUrl;
    a.download = `onerhythm-rhythm-${contributionId.slice(0, 8)}.png`;
    a.click();
  }

  const xIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const linkedInIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );

  const facebookIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  const redditIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );

  const copyIcon = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );

  const downloadIcon = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: EASE_REVEAL as unknown as [number, number, number, number] }}
    >
      <h3 className="font-display text-lg font-semibold text-text-primary">{headline}</h3>
      <p className="mt-1 text-sm text-text-secondary">{subline}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <ShareButton label="X" icon={xIcon} onClick={shareTwitter} ariaLabel="Share on X (Twitter)" />
        <ShareButton label="LinkedIn" icon={linkedInIcon} onClick={shareLinkedIn} ariaLabel="Share on LinkedIn" />
        <ShareButton label="Facebook" icon={facebookIcon} onClick={shareFacebook} ariaLabel="Share on Facebook" />
        <ShareButton label="Reddit" icon={redditIcon} onClick={shareReddit} ariaLabel="Share on Reddit" />
        <ShareButton
          label={copied ? "Copied!" : "Copy Link"}
          icon={copyIcon}
          onClick={copyLink}
          ariaLabel="Copy share link to clipboard"
        />
        {variant === "contribution" && artTileUrl && contributionId && (
          <ShareButton label="Download" icon={downloadIcon} onClick={downloadArt} ariaLabel="Download your art tile" />
        )}
      </div>
    </motion.div>
  );
}
