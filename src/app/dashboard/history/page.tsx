import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getSession();
  const db = getDb();
  const sessions = db.prepare("SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC").all(session!.userId) as any[];

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Interview History</h1>
      {sessions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No interviews yet. <Link href="/dashboard/interview/setup" className="text-blue-400 hover:underline">Start your first one</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium capitalize">{s.interview_type.replace("_", " ")} Interview</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {s.job_role || "General"} · {s.difficulty} · {s.total_questions}Q · {s.created_at?.slice(0, 10)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {s.overall_score != null && (
                  <span className={`font-bold ${s.overall_score >= 70 ? "text-green-400" : s.overall_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {Math.round(s.overall_score)}%
                  </span>
                )}
                <span className={`badge ${s.status === "completed" ? "bg-green-500/10 text-green-400" : s.status === "in_progress" ? "bg-yellow-500/10 text-yellow-400" : "bg-gray-700 text-gray-400"}`}>
                  {s.status.replace("_", " ")}
                </span>
                {s.status === "completed" && (
                  <Link href={`/dashboard/interview/results/${s.id}`} className="text-sm text-blue-400 hover:underline">Results</Link>
                )}
                {s.status === "in_progress" && (
                  <Link href={`/dashboard/interview/session/${s.id}`} className="text-sm text-blue-400 hover:underline">Resume</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}