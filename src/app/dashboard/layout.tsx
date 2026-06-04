import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800/50 flex flex-col shrink-0 backdrop-blur-sm">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
              IP
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-slate-100">InterviewPilot</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Preparation Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {[
            { href: "/dashboard", label: "Dashboard", icon: "Dashboard" },
            { href: "/dashboard/resume", label: "My Resume", icon: "Resume" },
            { href: "/dashboard/resume/recommendations", label: "Resume Analysis", icon: "Analysis" },
            { href: "/dashboard/interview/setup", label: "New Interview", icon: "Interview" },
            { href: "/dashboard/history", label: "Interview History", icon: "History" },
            { href: "/dashboard/analytics", label: "Analytics", icon: "Analytics" },
            { href: "/dashboard/roadmap", label: "Career Roadmap", icon: "Roadmap" },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-all group"
            >
              <span className="w-4 h-4 rounded bg-teal-500/30 group-hover:bg-teal-500/50 transition-colors"></span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              {session.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {session.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{session.email}</p>
            </div>
          </div>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
