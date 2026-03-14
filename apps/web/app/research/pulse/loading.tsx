import { MedicalDisclaimer } from "@onerhythm/ui";

import { ResearchPulseLoadingGrid } from "../../../components/research-pulse-feed";

export default function ResearchPulseLoading() {
  return (
    <main aria-busy="true" aria-label="Loading Research Pulse">
      <section className="bg-midnight py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded-full bg-cosmos" />
            <div className="mt-4 h-12 w-3/4 max-w-2xl rounded-xl bg-cosmos" />
            <div className="mt-4 h-5 w-full max-w-3xl rounded-full bg-cosmos/70" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <MedicalDisclaimer />

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="animate-pulse rounded-xl border border-token bg-cosmos p-6">
              <div className="h-4 w-40 rounded-full bg-midnight/50" />
              <div className="mt-3 h-6 w-full rounded-lg bg-midnight/50" />
              <div className="mt-3 h-4 w-5/6 rounded-full bg-midnight/40" />
            </div>
            <div className="animate-pulse rounded-xl border border-token bg-cosmos p-6">
              <div className="h-4 w-32 rounded-full bg-midnight/50" />
              <div className="mt-3 h-4 w-full rounded-full bg-midnight/40" />
              <div className="mt-3 h-4 w-4/5 rounded-full bg-midnight/40" />
            </div>
          </div>

          <div className="mt-8">
            <ResearchPulseLoadingGrid />
          </div>
        </div>
      </section>
    </main>
  );
}
