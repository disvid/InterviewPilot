import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <span className="text-lg font-bold text-blue-400">InterviewPilot</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/dashboard", label: "Dashboard", icon: "📊" },
            { href: "/dashboard/resume", label: "Resume", icon: "📄" },
            { href: "/dashboard/interview/setup", label: "New Interview", icon: "▶️" },
            { href: "/dashboard/history", label: "History", icon: "🕐" },
            { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
            { href: "/dashboard/roadmap", label: "Roadmap", icon: "🗺️" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors">
              <span>{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}