"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/firebase";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || email);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-sm border border-stone-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-stone-900">Task Do</h1>
        <p className="mt-1 text-sm text-stone-500">Sign in or create an account</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-stone-600">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="border border-amber-600 bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 text-sm text-stone-500 hover:text-stone-700"
        >
          {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
