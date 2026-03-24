import Link from "next/link";

import { crisisResources } from "../../content/partials/disclaimers";

export function CrisisResourcesCard() {
  return (
    <section className="rounded-[1.5rem] border border-warning/28 bg-cosmos-nebula/92 px-5 py-5 shadow-panel sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-warning">
        Crisis support
      </p>
      <h2 className="mt-3 font-display text-2xl leading-tight text-text-primary">
        Crisis support
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
        {crisisResources.intro}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {crisisResources.resources.map((resource) => (
          <Link
            className="surface-panel-soft block rounded-[1.1rem] border px-4 py-4 text-sm leading-6 text-text-secondary transition-colors duration-micro hover:bg-nebula focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            href={resource.href}
            key={`${resource.name}-${resource.region}`}
          >
            <strong className="block text-text-primary">{resource.name}</strong>
            <span className="mt-1 block">{resource.action}</span>
            <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {resource.region}
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-text-secondary">
        {crisisResources.nonTherapeuticBoundary}
      </p>
    </section>
  );
}
