import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              IP
            </div>
            <div>
              <span className="text-2xl font-semibold tracking-tight text-white">InterviewPilot</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">AI-Powered Interview Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {[
            { href: "/dashboard", label: "Dashboard", icon: "📊" },
            { href: "/dashboard/resume", label: "My Resume", icon: "📄" },
            { href: "/dashboard/resume/recommendations", label: "AI Resume Analysis", icon: "🔍" },
            { href: "/dashboard/interview/setup", label: "New Interview", icon: "🚀" },
            { href: "/dashboard/history", label: "Interview History", icon: "🕒" },
            { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
            { href: "/dashboard/roadmap", label: "Career Roadmap", icon: "🗺️" },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="nav-link flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/80 transition-all group"
            >
              <span className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
              {session.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.email}</p>
            </div>
          </div>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <div className="p-8 lg:p-10 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}