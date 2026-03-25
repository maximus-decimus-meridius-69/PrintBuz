import Link from "next/link";
import { PosterUploadForm } from "@/components/poster-upload-form";
import { ActionPrintsLogo } from "@/components/logo";

export default function CeerPage() {
  return (
    <main className="relative overflow-hidden px-6 py-8 md:px-10 lg:px-16">
      <div className="grain glass absolute inset-4 -z-10 rounded-[2.5rem] border border-white/40" />

      <section className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
        {/* Branded nav */}
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Action Prints — home">
            <ActionPrintsLogo className="w-28" />
          </Link>
          <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">CEER</p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_20px_60px_rgba(28,25,23,0.08)] backdrop-blur">
          <div className="mb-6 space-y-3">
            <h1 className="display-font text-4xl text-stone-950 md:text-5xl">Poster upload form</h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-500">
              We ensure the best possible print quality. Even if the source is slightly blurry, we upscale and optimize it before printing.
            </p>
          </div>
          <PosterUploadForm />
        </div>

        <div>
          <Link className="text-sm text-stone-500 underline-offset-4 hover:underline" href="/">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}