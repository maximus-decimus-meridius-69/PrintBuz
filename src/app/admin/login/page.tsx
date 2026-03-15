import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-10 md:px-10 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section className="space-y-5">
        <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">Admin</p>
        <h1 className="display-font text-5xl leading-none text-stone-950 md:text-6xl">Poster desk control room.</h1>
        <Link className="text-sm text-stone-500 underline-offset-4 hover:underline" href="/">
          Back
        </Link>
      </section>
      <AdminLoginForm />
    </main>
  );
}