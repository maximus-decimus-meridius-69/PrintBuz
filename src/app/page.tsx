import Link from "next/link";
import { ActionPrintsLogo } from "@/components/logo";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-6 py-10 md:px-10 lg:px-16">
      <div className="grain glass absolute inset-4 -z-10 rounded-[2.5rem] border border-white/40" />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 py-12 md:py-16">
        <ActionPrintsLogo className="logo-float w-64 md:w-[22rem] lg:w-[26rem]" />
        <p className="text-[0.62rem] uppercase tracking-[0.65em] text-stone-400">
          Professional printing portal
        </p>
      </section>

      {/* Divider */}
      <div className="mx-auto w-full max-w-7xl">
        <div className="section-divider" />
      </div>

      {/* Section cards */}
      <section className="mx-auto mb-10 mt-10 grid w-full max-w-7xl gap-6 md:grid-cols-2">
        <Link
          className="group relative overflow-hidden rounded-[2rem] bg-stone-950 p-8 shadow-[0_20px_60px_rgba(28,25,23,0.18)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(28,25,23,0.26)]"
          href="/azura"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.18),transparent_55%)]" />
          <h2 className="display-font relative mt-2 text-5xl leading-none text-stone-50 md:text-6xl">AZURA</h2>
          <p className="relative mt-10 text-xs tracking-wide text-amber-400/75 transition duration-300 group-hover:translate-x-2">
            Open AZURA →
          </p>
        </Link>

        <Link
          className="group relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white/80 p-8 shadow-[0_20px_60px_rgba(28,25,23,0.07)] backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(28,25,23,0.13)]"
          href="/ceer"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.08),transparent_55%)]" />
          <h2 className="display-font relative mt-2 text-5xl leading-none text-stone-950 md:text-6xl">CEER</h2>
          <p className="relative mt-10 text-xs tracking-wide text-amber-700/75 transition duration-300 group-hover:translate-x-2">
            Open CEER →
          </p>
        </Link>
      </section>
    </main>
  );
}