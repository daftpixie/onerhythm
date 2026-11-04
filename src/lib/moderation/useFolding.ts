import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { PostFold } from "../../components/PostCard";
import { publishedCrisisTerms } from "./api";
import { firstMatch } from "./match";
import { listMutedWords } from "./mutedWords";

// The two lists a screen folds posts with, matched on this device (Q6, Q8).
// The crisis list is the same published list for every reader, read once per
// screen; nothing about the reader is sent.
// Returns the fold function and whether both lists have loaded. A screen holds
// its list until `ready`, so a folded post's title never flashes on screen (or
// to a screen reader) before the lists arrive.
export function useFolding(): {
  ready: boolean;
  foldFor: (post: { title: string; body: string; author_id?: string }, me?: string) => PostFold | null;
} {
  const [muted, setMuted] = useState<string[] | null>(null);
  const [crisis, setCrisis] = useState<string[] | null>(null);

  useEffect(() => {
    let live = true;
    listMutedWords().then((w) => live && setMuted(w));
    publishedCrisisTerms(supabase)
      .then((t) => live && setCrisis(t))
      .catch(() => live && setCrisis([]));
    return () => {
      live = false;
    };
  }, []);

  const foldFor = (post: { title: string; body: string; author_id?: string }, me?: string): PostFold | null => {
    if (me && post.author_id === me) return null;
    const text = `${post.title} ${post.body}`;
    const word = firstMatch(text, muted ?? []);
    if (word) return { kind: "muted", word };
    if (firstMatch(text, crisis ?? [])) return { kind: "crisis" };
    return null;
  };
  return { ready: muted !== null && crisis !== null, foldFor };
}
