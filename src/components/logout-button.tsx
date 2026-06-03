"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <button onClick={handleLogout} className="w-full text-left text-sm text-gray-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-800">
      Sign out
    </button>
  );
}