import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { ActionPrintsLogo } from "@/components/logo";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-10 md:px-10 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="space-y-5">
        <Link href="/" aria-label="Action Prints — home">
          <ActionPrintsLogo className="mb-4 w-36" />
        </Link>
        <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">Admin</p>
        <h1 className="display-font text-5xl leading-none text-stone-950 md:text-6xl">Action Prints control room.</h1>
        <p className="max-w-2xl text-sm leading-7 text-stone-500">
          We ensure the best possible print quality. Even if the source is slightly blurry, we upscale and optimize it before printing.
        </p>
        <Link className="text-sm text-stone-500 underline-offset-4 hover:underline" href="/">
          Back
        </Link>
      </section>
      <AdminLoginForm />
    </main>
  );
}