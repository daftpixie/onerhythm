import { Card } from "@onerhythm/ui";

import type { ResearchStatHighlight as ResearchStatHighlightData } from "@onerhythm/types";

export function ResearchStatHighlight({
  highlight,
}: {
  highlight: ResearchStatHighlightData;
}) {
  return (
    <Card className="surface-3 h-full rounded-[1.25rem] p-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">Research signal</p>
      <p className="mt-4 font-display text-4xl tracking-[-0.05em] text-text-primary">
        {highlight.value}
      </p>
      <h3 className="mt-3 text-lg text-text-primary">{highlight.label}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{highlight.context}</p>
    </Card>
  );
}
