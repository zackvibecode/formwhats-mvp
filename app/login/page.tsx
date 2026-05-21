"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- Reusable class strings -----------------------------------------------

const inputClass =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

const labelClass = "text-sm font-medium text-black";

// --- Page -----------------------------------------------------------------

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // If the user is already logged in, send them straight to the dashboard.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        router.replace("/dashboard");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (email.trim() === "" || password === "") {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      return;
    }

    // mode === "signup"
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    // If a session exists right after signUp, email confirmation is off.
    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setSuccessMessage(
      "Account created. Please check your email if confirmation is required, then login.",
    );
    setPassword("");
    setIsLoading(false);
  }

  const submitLabel = isLoading
    ? "Please wait..."
    : mode === "login"
      ? "Login"
      : "Create account";

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-brand/5 via-white to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Brand */}
          <div className="text-center">
            <span className="text-2xl font-bold tracking-tight text-black">
              Form<span className="text-brand">Whats</span>
            </span>
          </div>

          <header className="mt-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Login or create an account to manage your WhatsApp forms.
            </p>
          </header>

          {/* Mode tabs */}
          <div className="mt-6 grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={
                mode === "login"
                  ? "rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-sm"
                  : "rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:text-black"
              }
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={
                mode === "signup"
                  ? "rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-sm"
                  : "rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:text-black"
              }
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className={inputClass}
                required
              />
              {mode === "signup" && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Use at least 6 characters.
                </p>
              )}
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            <Link
              href="/"
              className="font-medium text-gray-600 transition hover:text-black"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
