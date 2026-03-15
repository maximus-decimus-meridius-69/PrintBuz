"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <form className="space-y-4 rounded-4xl border border-stone-200 bg-white p-8 shadow-[0_20px_80px_rgba(28,25,23,0.08)]" onSubmit={handleSubmit}>
      <label className="space-y-2 text-sm text-stone-700">
        <span>Admin email</span>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="space-y-2 text-sm text-stone-700">
        <span>Password</span>
        <input
          className="field"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <button className="w-full rounded-full bg-stone-950 px-5 py-3 font-medium text-white transition hover:bg-stone-800" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in to admin"}
      </button>
    </form>
  );
}