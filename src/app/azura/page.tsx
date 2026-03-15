import Link from "next/link";

export default function AzuraPage() {
  return (
    <main className="relative overflow-hidden px-6 py-8 md:px-10 lg:px-16">
      <div className="grain glass absolute inset-4 -z-10 rounded-[2.5rem] border border-white/40" />

      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-start justify-center gap-6 py-12">
        <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">AZURA</p>
        <h1 className="display-font text-5xl leading-none text-stone-950 md:text-7xl">Available soon.</h1>
        <p className="max-w-2xl text-lg leading-8 text-stone-700">
          This section is not open yet. It is reserved for a future release.
        </p>
        <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800" href="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}