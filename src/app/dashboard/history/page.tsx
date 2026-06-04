import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getSession();
  const db = getDb();
  
  const sessions = db.prepare(`
    SELECT * FROM interview_sessions 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(session!.userId) as any[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="section-title text-3xl">Interview History</h1>
          <p className="text-gray-400 mt-1.5">
            Review all your past and ongoing interview sessions
          </p>
        </div>
        <Link 
          href="/dashboard/interview/setup"
          className="btn-primary flex items-center gap-2"
        >
          + New Interview
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-3xl mb-4">
            📖
          </div>
          <h3 className="text-xl font-medium text-white">No interviews yet</h3>
          <p className="text-gray-400 mt-2 mb-6 max-w-sm mx-auto">
            Start practicing and your interview history will appear here.
          </p>
          <Link 
            href="/dashboard/interview/setup" 
            className="btn-primary inline-flex"
          >
            Start Your First Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s: any) => (
            <div 
              key={s.id} 
              className="card card-hover flex flex-col md:flex-row md:items-center justify-between gap-4 p-6"
            >
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                  {s.interview_type?.includes("technical") || s.job_role?.toLowerCase().includes("engineer") ? "💻" : "🗣️"}
                </div>

                {/* Details */}
                <div>
                  <div className="font-semibold text-lg capitalize">
                    {s.interview_type?.replace("_", " ") || "Mock"} Interview
                  </div>
                  <div className="text-sm text-gray-400 mt-1 flex items-center gap-3">
                    <span>{s.job_role || "General Role"}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="capitalize">{s.difficulty}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span>{s.total_questions} Questions</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} • {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-5">
                {s.overall_score != null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${s.overall_score >= 75 ? "text-emerald-400" : s.overall_score >= 55 ? "text-yellow-400" : "text-red-400"}`}>
                      {Math.round(s.overall_score)}%
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Score</div>
                  </div>
                )}

                <div>
                  <span className={`badge px-4 py-1.5 text-sm font-medium capitalize
                    ${s.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : 
                      s.status === "in_progress" ? "bg-amber-500/10 text-amber-400" : 
                      "bg-gray-700 text-gray-400"}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {s.status === "completed" && (
                    <Link 
                      href={`/dashboard/interview/results/${s.id}`}
                      className="btn-secondary text-sm px-5 py-2.5"
                    >
                      View Results
                    </Link>
                  )}
                  {s.status === "in_progress" && (
                    <Link 
                      href={`/dashboard/interview/session/${s.id}`}
                      className="btn-primary text-sm px-5 py-2.5"
                    >
                      Resume Session
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}