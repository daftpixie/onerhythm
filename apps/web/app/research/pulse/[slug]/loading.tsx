import { Card, MedicalDisclaimer } from "@onerhythm/ui";

export default function ResearchPulseDetailLoading() {
  return (
    <main aria-busy="true" aria-label="Loading research summary" className="page-shell mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <header className="page-header">
        <p className="page-eyebrow">Research Pulse</p>
        <div className="mt-4 h-20 w-4/5 rounded-[2rem] bg-[color:color-mix(in_srgb,var(--color-cosmos)_92%,transparent)]" />
        <div className="mt-4 h-5 w-full max-w-3xl rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_76%,transparent)]" />
      </header>

      <MedicalDisclaimer />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem]">
          <div className="space-y-5 animate-pulse">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="space-y-3" key={index}>
                <div className="h-3 w-36 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_78%,transparent)]" />
                <div className="h-4 w-full rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_72%,transparent)]" />
                <div className="h-4 w-5/6 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_72%,transparent)]" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card className="rounded-[2rem]" key={index}>
              <div className="space-y-3 animate-pulse">
                <div className="h-3 w-28 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_78%,transparent)]" />
                <div className="h-4 w-full rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_72%,transparent)]" />
                <div className="h-4 w-4/5 rounded-full bg-[color:color-mix(in_srgb,var(--color-cosmos)_72%,transparent)]" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
