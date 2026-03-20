import Link from "next/link";
import { AzuraOrderForm } from "@/components/azura-order-form";

export default function AzuraPage() {
  return (
    <main className="relative overflow-hidden px-6 py-8 md:px-10 lg:px-16">
      <div className="grain glass absolute inset-4 -z-10 rounded-[2.5rem] border border-white/40" />

      <section className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
        <div className="rounded-4xl border border-white/70 bg-white/85 p-8 shadow-[0_30px_100px_rgba(28,25,23,0.08)] backdrop-blur">
          <div className="mb-6 space-y-3">
            <p className="display-font text-sm uppercase tracking-[0.4em] text-amber-700">AZURA</p>
            <h1 className="display-font text-4xl text-stone-950 md:text-5xl">Poster link submission</h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              Width is fixed at 6. Choose the height, paste the Google Drive link for the poster file, and complete the payment.
            </p>
          </div>
          <AzuraOrderForm />
        </div>

        <div>
          <Link className="inline-block text-sm text-stone-600 underline-offset-4 hover:underline" href="/">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}