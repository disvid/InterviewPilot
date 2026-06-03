import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  const db = getDb();

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session!.userId) as any;
  const sessions = db.prepare("SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5").all(session!.userId) as any[];
  const totalSessions = (db.prepare("SELECT COUNT(*) as c FROM interview_sessions WHERE user_id = ?").get(session!.userId) as any)?.c || 0;
  const avgScore = (db.prepare("SELECT AVG(overall_score) as avg FROM interview_sessions WHERE user_id = ? AND status = 'completed'").get(session!.userId) as any)?.avg;
  const hasResume = !!(db.prepare("SELECT id FROM resumes WHERE user_id = ? AND is_active = 1").get(session!.userId));

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.full_name?.split(" ")[0] || user?.username} 👋</h1>
        <p className="text-gray-400 mt-1">Ready to practice?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Interviews", value: totalSessions },
          { label: "Average Score", value: avgScore ? `${Math.round(avgScore)}%` : "—" },
          { label: "Resume Status", value: hasResume ? "✅ Active" : "❌ Missing" },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl font-bold text-blue-400">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/interview/setup" className="card hover:border-blue-500/50 transition-colors group">
          <div className="text-2xl mb-3">▶️</div>
          <div className="font-semibold group-hover:text-blue-400 transition-colors">Start New Interview</div>
          <p className="text-sm text-gray-400 mt-1">Generate AI-personalized questions</p>
        </Link>
        {!hasResume && (
          <Link href="/dashboard/resume" className="card hover:border-yellow-500/50 transition-colors group">
            <div className="text-2xl mb-3">📄</div>
            <div className="font-semibold group-hover:text-yellow-400 transition-colors">Upload Resume</div>
            <p className="text-sm text-gray-400 mt-1">Required for personalized questions</p>
          </Link>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div>
                  <div className="text-sm font-medium capitalize">{s.interview_type.replace("_", " ")} Interview</div>
                  <div className="text-xs text-gray-500">{s.job_role || "General"} · {s.created_at?.slice(0, 10)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {s.overall_score != null && (
                    <span className={`font-semibold text-sm ${s.overall_score >= 70 ? "text-green-400" : s.overall_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {Math.round(s.overall_score)}%
                    </span>
                  )}
                  <span className={`badge ${s.status === "completed" ? "bg-green-500/10 text-green-400" : s.status === "in_progress" ? "bg-yellow-500/10 text-yellow-400" : "bg-gray-700 text-gray-400"}`}>
                    {s.status.replace("_", " ")}
                  </span>
                  {s.status === "in_progress" && (
                    <Link href={`/dashboard/interview/session/${s.id}`} className="text-xs text-blue-400 hover:underline">Resume</Link>
                  )}
                  {s.status === "completed" && (
                    <Link href={`/dashboard/interview/results/${s.id}`} className="text-xs text-blue-400 hover:underline">Results</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}