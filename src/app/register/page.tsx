"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    full_name: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
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
          <h1 className="text-3xl font-semibold text-slate-100">Create your account</h1>
          <p className="text-slate-400 mt-2">
            Join professionals preparing smarter for their next opportunity
          </p>
        </div>

        {/* Register Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="John Doe"
                className="input"
              />
            </div>

            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="johndoe"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Create a strong password"
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
                  Creating account...
                </span>
              ) : (
                "Create Free Account"
              )}
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          By signing up, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}
