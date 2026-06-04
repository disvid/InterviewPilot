"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all group font-medium"
    >
      <span className="text-sm group-hover:translate-x-0.5 transition-transform">→</span>
      <span>
        {loading ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}
