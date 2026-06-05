import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = getDb();
  
  const session = db.prepare("SELECT * FROM interview_sessions WHERE id = ?").get(id) as any;
  
  const questions = db.prepare(`
    SELECT q.*, a.answer_text, a.word_count,
      e.overall_score, e.technical_score, e.relevance_score,
      e.communication_score, e.structure_score,
      e.strengths, e.weaknesses, e.suggested_answer, e.ai_feedback,
      e.improvement_tips
    FROM questions q
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN evaluations e ON e.answer_id = a.id
    WHERE q.session_id = ?
    ORDER BY q.order_index
  `).all(id) as any[];

  const answered = questions.filter((q) => q.overall_score != null);
  const avgScore = answered.length
    ? answered.reduce((s, q) => s + q.overall_score, 0) / answered.length
    : 0;

  const scoreColor = (s: number) =>
    s >= 75 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";
  
  const scoreBg = (s: number) =>
    s >= 75 ? "bg-emerald-400" : s >= 50 ? "bg-amber-400" : "bg-red-400";

  const grade = avgScore >= 85 ? "A" 
              : avgScore >= 70 ? "B" 
              : avgScore >= 55 ? "C" 
              : avgScore >= 40 ? "D" : "F";

  const gradeColor = avgScore >= 85 ? "text-emerald-400" 
                   : avgScore >= 70 ? "text-teal-400" 
                   : avgScore >= 55 ? "text-amber-400" 
                   : "text-red-400";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}\n      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title\">Interview Results</h1>
          <p className="text-slate-400 mt-1 capitalize">
            {session?.interview_type?.replace("_", " ") || "Mock"} Interview
            {session?.job_role ? ` • ${session.job_role}` : ""}
          </p>
        </div>
        <Link href="/dashboard/history" className="btn-ghost flex items-center gap-2">
          ← Back to History
        </Link>
      </div>

      <div className="card relative overflow-hidden border-2 border-slate-800">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500" />
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-8">
          <div className="text-center">
            <div className={`text-7xl font-bold tracking-tighter ${scoreColor(avgScore)}`}>
              {Math.round(avgScore)}
              <span className="text-4xl">%</span>
            </div>
            <p className="text-slate-400 mt-2 font-medium\">Overall Performance</p>
          </div>

          <div className="text-center border-l border-slate-700 pl-10">
            <div className={`text-7xl font-bold ${gradeColor}`}>{grade}</div>
            <p className="text-slate-400 mt-2 font-medium\">Letter Grade</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-slate-800 pt-6 text-center">
          <div>
            <div className="text-2xl font-semibold text-slate-100">{questions.length}</div>
            <div className="text-xs text-slate-500 tracking-widest\">TOTAL QUESTIONS</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-100">{answered.length}</div>
            <div className="text-xs text-slate-500 tracking-widest\">ANSWERED</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-100 capitalize">{session?.difficulty}</div>
            <div className="text-xs text-slate-500 tracking-widest\">DIFFICULTY</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-5 text-slate-100\">Question Breakdown</h2>
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="card border-2 border-slate-800">
              <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-slate-900/50 text-xs font-mono rounded-lg text-slate-400 border border-slate-800\">Q{i + 1}</span>
                    <span className="badge bg-slate-800 text-slate-400\">
                      {q.question_type?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-100 leading-relaxed\">{q.question_text}</p>
                </div>

                {q.overall_score !== null && (
                  <div className={`text-4xl font-bold shrink-0 ${scoreColor(q.overall_score)}`}>
                    {Math.round(q.overall_score)}%
                  </div>
                )}
              </div>

              {q.overall_score !== null ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Relevance", value: q.relevance_score },
                      { label: "Communication", value: q.communication_score },
                      { label: "Structure", value: q.structure_score },
                      ...(q.technical_score != null ? [{ label: "Technical", value: q.technical_score }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800\">
                        <div className="text-xs text-slate-500 mb-2\">{label}</div>
                        <div className="flex items-end gap-2">
                          <span className={`text-3xl font-semibold ${scoreColor(value)}`}>
                            {Math.round(value)}
                          </span>
                          <span className="text-slate-500 text-sm\">/100</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden\">
                          <div 
                            className={`h-full ${scoreBg(value)} transition-all`} 
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {q.ai_feedback && (
                    <div className="mb-5 p-5 bg-slate-900/50 rounded-lg border border-slate-800\">
                      <p className="text-sm text-slate-300 leading-relaxed\">{q.ai_feedback}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-6 text-sm">
                    {q.strengths && JSON.parse(q.strengths).length > 0 && (
                      <div>
                        <p className="text-emerald-400 text-xs font-medium mb-2 uppercase tracking-widest\">Strengths</p>
                        {JSON.parse(q.strengths).slice(0, 2).map((s: string, j: number) => (
                          <p key={j} className="text-emerald-400/90\">✓ {s}</p>
                        ))}
                      </div>
                    )}

                    {q.weaknesses && JSON.parse(q.weaknesses).length > 0 && (
                      <div>
                        <p className="text-red-400 text-xs font-medium mb-2 uppercase tracking-widest\">Areas to Improve</p>
                        {JSON.parse(q.weaknesses).slice(0, 2).map((w: string, j: number) => (
                          <p key={j} className="text-red-400/90\">→ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {q.suggested_answer && (
                    <details className="mt-6 group\">
                      <summary className="text-teal-400 text-sm flex items-center gap-2 cursor-pointer hover:text-teal-300 font-medium\">
                        View Model Answer
                      </summary>
                      <div className="mt-4 p-5 bg-slate-900/50 border border-teal-500/20 rounded-lg text-sm leading-relaxed text-slate-300\">
                        {q.suggested_answer}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic text-sm\">Question was skipped</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <Link href="/dashboard/interview/setup" className="btn-primary\">
          Practice Similar Interview
        </Link>
        <Link href="/dashboard/analytics" className="btn-secondary\">
          View Analytics
        </Link>
        <Link href="/dashboard/history" className="btn-ghost\">
          Back to History
        </Link>
      </div>
    </div>
  );
}