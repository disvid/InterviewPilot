import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  const db = getDb();

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session!.userId) as any;
  const sessions = db.prepare(`
    SELECT * FROM interview_sessions 
    WHERE user_id = ? 
    ORDER BY created_at DESC LIMIT 5
  `).all(session!.userId) as any[];

  const totalSessions = (db.prepare(`
    SELECT COUNT(*) as c FROM interview_sessions WHERE user_id = ?
  `).get(session!.userId) as any)?.c || 0;

  const avgScore = (db.prepare(`
    SELECT AVG(overall_score) as avg 
    FROM interview_sessions 
    WHERE user_id = ? AND status = 'completed'
  `).get(session!.userId) as any)?.avg;

  const hasResume = !!(db.prepare(`
    SELECT id FROM resumes WHERE user_id = ? AND is_active = 1
  `).get(session!.userId));

  const displayName = user?.full_name?.split(" ")[0] || user?.username || "there";

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div>
        <h1 className="section-title text-4xl">
          Hello, {displayName} 👋
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Let's sharpen your interview skills today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: "Total Interviews", 
            value: totalSessions, 
            icon: "🎯" 
          },
          { 
            label: "Average Score", 
            value: avgScore ? `${Math.round(avgScore)}%` : "—", 
            icon: "📊" 
          },
          { 
            label: "Resume Status", 
            value: hasResume ? "Active" : "Upload Needed", 
            icon: hasResume ? "✅" : "📄" 
          },
        ].map((stat, i) => (
          <div key={i} className="card card-hover">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-4xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <p className="text-gray-400 mt-2 font-medium">{stat.label}</p>
              </div>
              <div className="text-4xl opacity-75">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/dashboard/interview/setup" 
          className="card card-hover group flex flex-col justify-between h-full p-8 hover:border-blue-500/50"
        >
          <div>
            <div className="text-5xl mb-6">🚀</div>
            <h3 className="text-2xl font-semibold group-hover:text-blue-400 transition-colors">
              Start New Interview
            </h3>
            <p className="text-gray-400 mt-3">
              Practice with AI-generated questions tailored to your role
            </p>
          </div>
          <div className="mt-8 text-blue-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
            Begin Interview →
          </div>
        </Link>

        {!hasResume && (
          <Link 
            href="/dashboard/resume" 
            className="card card-hover group flex flex-col justify-between h-full p-8 hover:border-yellow-500/50"
          >
            <div>
              <div className="text-5xl mb-6">📄</div>
              <h3 className="text-2xl font-semibold group-hover:text-yellow-400 transition-colors">
                Upload Your Resume
              </h3>
              <p className="text-gray-400 mt-3">
                Get personalized questions and AI-powered recommendations
              </p>
            </div>
            <div className="mt-8 text-yellow-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              Upload Resume →
            </div>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Recent Interviews</h3>
            <Link href="/dashboard/history" className="text-sm text-blue-400 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {sessions.map((s: any) => (
              <div 
                key={s.id} 
                className="flex items-center justify-between bg-gray-950 rounded-2xl p-5 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl">
                    {s.interview_type?.includes("technical") ? "💻" : "🗣️"}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {s.interview_type?.replace("_", " ") || "Mock"} Interview
                    </p>
                    <p className="text-sm text-gray-500">
                      {s.job_role || "General Role"} • {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  {s.overall_score != null && (
                    <div className={`text-2xl font-bold ${s.overall_score >= 75 ? "text-emerald-400" : s.overall_score >= 55 ? "text-amber-400" : "text-red-400"}`}>
                      {Math.round(s.overall_score)}%
                    </div>
                  )}

                  <span className={`badge px-4 py-1.5 capitalize
                    ${s.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : 
                      s.status === "in_progress" ? "bg-amber-500/10 text-amber-400" : 
                      "bg-gray-700 text-gray-400"}`}>
                    {s.status.replace("_", " ")}
                  </span>

                  {s.status === "in_progress" && (
                    <Link 
                      href={`/dashboard/interview/session/${s.id}`} 
                      className="btn-secondary text-sm px-6 py-2"
                    >
                      Resume
                    </Link>
                  )}

                  {s.status === "completed" && (
                    <Link 
                      href={`/dashboard/interview/results/${s.id}`} 
                      className="btn-secondary text-sm px-6 py-2"
                    >
                      View Results
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-6xl mb-6 opacity-40">🎯</div>
          <h3 className="text-xl font-medium">No interviews yet</h3>
          <p className="text-gray-400 mt-2">Start your first AI interview to track your progress</p>
        </div>
      )}
    </div>
  );
}