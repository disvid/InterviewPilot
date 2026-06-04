"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Invalid credentials");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white">
              IP
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-100">Welcome back</h1>
          <p className="text-slate-400 mt-2">
            Sign in to your interview preparation platform
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-teal-400 hover:text-teal-300 font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          By signing in, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}
