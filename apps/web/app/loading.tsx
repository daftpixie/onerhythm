export default function AppLoading() {
  return (
    <main aria-busy="true" aria-label="Loading page content" className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <section aria-hidden="true" className="page-header rounded-[2rem] sm:py-10 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-4">
            <div className="h-4 w-52 rounded-full bg-cosmos-nebula" />
            <div className="h-16 max-w-3xl rounded-[1.5rem] bg-cosmos-nebula" />
            <div className="h-24 max-w-2xl rounded-[1.5rem] bg-cosmos-nebula" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="h-36 rounded-[1.5rem] bg-cosmos-nebula" />
            <div className="h-36 rounded-[1.5rem] bg-cosmos-nebula" />
            <div className="h-36 rounded-[1.5rem] bg-cosmos-nebula" />
          </div>
        </div>
      </section>

      <section
        aria-label="Loading public heart mosaic"
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="surface-2 rounded-[2rem] border border-token p-6 shadow-surface">
          <div className="h-6 w-40 rounded-full bg-cosmos-nebula" />
          <div className="mt-4 h-12 max-w-2xl rounded-[1rem] bg-cosmos-nebula" />
          <div className="mt-8 min-h-[28rem] rounded-[1.75rem] border border-token bg-void-midnight/70" />
        </div>
        <div className="space-y-6">
          <div className="surface-2 h-56 rounded-[2rem] border border-token shadow-surface" />
          <div className="surface-2 h-64 rounded-[2rem] border border-token shadow-surface" />
        </div>
      </section>
    </main>
  );
}
