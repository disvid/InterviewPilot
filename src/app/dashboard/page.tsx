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
        <h1 className="section-title">
          Hello, {displayName}
        </h1>
        <p className="text-slate-400 mt-2 text-base">
          Continue your interview preparation journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: "Total Interviews", 
            value: totalSessions, 
            icon: "▬",
            color: "from-teal-500/20 to-teal-600/20",
            borderColor: "border-teal-500/20"
          },
          { 
            label: "Average Score", 
            value: avgScore ? `${Math.round(avgScore)}%` : "—", 
            icon: "◆",
            color: "from-emerald-500/20 to-emerald-600/20",
            borderColor: "border-emerald-500/20"
          },
          { 
            label: "Resume Status", 
            value: hasResume ? "Active" : "Pending", 
            icon: "■",
            color: hasResume ? "from-teal-500/20 to-teal-600/20" : "from-amber-500/20 to-amber-600/20",
            borderColor: hasResume ? "border-teal-500/20" : "border-amber-500/20"
          },
        ].map((stat, i) => (
          <div key={i} className={`card card-hover bg-gradient-to-br ${stat.color} border-2 ${stat.borderColor}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="stat-value">
                  {stat.value}
                </div>
                <p className="text-slate-400 mt-3 text-sm font-medium">{stat.label}</p>
              </div>
              <div className="text-3xl opacity-60">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/dashboard/interview/setup" 
          className="card card-hover group flex flex-col justify-between h-full p-8 border-2 border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5"
        >
          <div>
            <div className="text-3xl mb-6 opacity-70 group-hover:opacity-100">▶</div>
            <h3 className="text-2xl font-semibold group-hover:text-teal-400 transition-colors text-slate-100">
              Start New Interview
            </h3>
            <p className="text-slate-400 mt-3 leading-relaxed">
              Configure and begin a new AI-powered interview session
            </p>
          </div>
          <div className="mt-8 text-teal-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
            Begin Now →
          </div>
        </Link>

        {!hasResume && (
          <Link 
            href="/dashboard/resume" 
            className="card card-hover group flex flex-col justify-between h-full p-8 border-2 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5"
          >
            <div>
              <div className="text-3xl mb-6 opacity-70 group-hover:opacity-100">■</div>
              <h3 className="text-2xl font-semibold group-hover:text-amber-400 transition-colors text-slate-100">
                Upload Your Resume
              </h3>
              <p className="text-slate-400 mt-3 leading-relaxed">
                Add your resume to get personalized interview questions
              </p>
            </div>
            <div className="mt-8 text-amber-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
              Upload Resume →
            </div>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-100">Recent Interviews</h3>
            <Link href="/dashboard/history" className="text-sm text-teal-400 hover:text-teal-300">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {sessions.map((s: any) => (
              <div 
                key={s.id} 
                className="flex items-center justify-between bg-slate-900/50 rounded-lg p-5 hover:bg-slate-800/50 transition-colors border border-slate-800/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <span className="text-lg">■</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100 capitalize">
                      {s.interview_type?.replace("_", " ") || "Mock"} Interview
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.job_role || "General Role"} • {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  {s.overall_score != null && (
                    <div className={`text-lg font-bold ${s.overall_score >= 75 ? "text-emerald-400" : s.overall_score >= 55 ? "text-amber-400" : "text-red-400"}`}>
                      {Math.round(s.overall_score)}%
                    </div>
                  )}

                  <span className={`badge px-3 py-1 text-xs capitalize
                    ${s.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                      s.status === "in_progress" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                      "bg-slate-700 text-slate-400 border border-slate-600"}`}>
                    {s.status.replace("_", " ")}
                  </span>

                  {s.status === "in_progress" && (
                    <Link 
                      href={`/dashboard/interview/session/${s.id}`} 
                      className="btn-secondary text-xs px-4 py-2 whitespace-nowrap"
                    >
                      Resume
                    </Link>
                  )}

                  {s.status === "completed" && (
                    <Link 
                      href={`/dashboard/interview/results/${s.id}`} 
                      className="btn-secondary text-xs px-4 py-2 whitespace-nowrap"
                    >
                      Results
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="card text-center py-16 border-2 border-slate-800">
          <div className="text-5xl mb-6 opacity-30">▬</div>
          <h3 className="text-lg font-semibold text-slate-100">No interviews yet</h3>
          <p className="text-slate-400 mt-2 text-sm">Start your first interview to begin tracking your progress</p>
        </div>
      )}
    </div>
  );
}
