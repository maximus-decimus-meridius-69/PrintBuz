import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden px-6 py-8 md:px-10 lg:px-16">
      <div className="grain glass absolute inset-4 -z-10 rounded-[2.5rem] border border-white/40" />

      <section className="mx-auto flex max-w-7xl flex-col gap-6 py-12">
        <p className="display-font text-center text-xs uppercase tracking-[0.5em] text-amber-700">Poster Desk</p>
        <h1 className="display-font text-center text-5xl leading-none text-stone-950 md:text-7xl">Choose a section</h1>
      </section>

      <section className="mx-auto mt-4 grid max-w-7xl gap-8 md:grid-cols-2">
        <Link
          className="group rounded-4xl border border-stone-200 bg-white/85 p-4 shadow-[0_30px_100px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_35px_110px_rgba(28,25,23,0.12)]"
          href="/azura"
        >
          <div className="rounded-[1.7rem] bg-stone-950 p-8 text-stone-50">
            <p className="display-font text-sm uppercase tracking-[0.4em] text-amber-300">AZURA</p>
            <h2 className="display-font mt-4 text-4xl">Available soon</h2>
            <p className="mt-8 text-sm text-amber-300 transition group-hover:translate-x-1">Open AZURA</p>
          </div>
        </Link>

        <Link
          className="group rounded-4xl border border-white/70 bg-white/85 p-8 shadow-[0_30px_100px_rgba(28,25,23,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_35px_110px_rgba(28,25,23,0.12)]"
          href="/ceer"
        >
          <p className="display-font text-sm uppercase tracking-[0.4em] text-amber-700">CEER</p>
          <h2 className="display-font mt-4 text-4xl text-stone-950">Poster upload form</h2>
          <p className="mt-8 text-sm text-amber-700 transition group-hover:translate-x-1">Open CEER</p>
        </Link>
      </section>
    </main>
  );
}