import { getDb } from "@/lib/db";
import Link from "next/link";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;   // ← This is the fix

  const db = getDb();
  const session = db.prepare("SELECT * FROM interview_sessions WHERE id = ?").get(id) as any;
  
  const questions = db.prepare(`
    SELECT q.*, a.answer_text, e.overall_score, e.technical_score, 
           e.relevance_score, e.communication_score, e.structure_score, 
           e.strengths, e.weaknesses, e.suggested_answer, e.ai_feedback 
    FROM questions q 
    LEFT JOIN answers a ON a.question_id = q.id 
    LEFT JOIN evaluations e ON e.answer_id = a.id 
    WHERE q.session_id = ? 
    ORDER BY q.order_index
  `).all(id) as any[];

  const answered = questions.filter(q => q.overall_score != null);
  const avgScore = answered.length 
    ? answered.reduce((s: number, q: any) => s + (q.overall_score || 0), 0) / answered.length 
    : 0;

  const scoreColor = avgScore >= 70 ? "text-green-400" : avgScore >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Interview Results</h1>
      <p className="text-gray-400 capitalize">
        {session?.interview_type?.replace("_", " ")} Interview
        {session?.job_role ? ` · ${session.job_role}` : ""}
      </p>

      <div className="card text-center">
        <div className={`text-7xl font-bold ${scoreColor}`}>{Math.round(avgScore)}</div>
        <div className="text-gray-400 mt-1">Overall Score</div>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div><div className="font-semibold">{questions.length}</div><div className="text-gray-500">Questions</div></div>
          <div><div className="font-semibold">{answered.length}</div><div className="text-gray-500">Answered</div></div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="card">
            <div className="flex justify-between items-start gap-4 mb-2">
              <div className="text-sm font-medium text-gray-300 flex-1">
                Q{i + 1}. {q.question_text}
              </div>
              {q.overall_score != null && (
                <span className={`font-bold shrink-0 ${q.overall_score >= 70 ? "text-green-400" : q.overall_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {Math.round(q.overall_score)}%
                </span>
              )}
            </div>

            {q.ai_feedback && <p className="text-xs text-gray-400 mb-2">{q.ai_feedback}</p>}

            {q.answer_text && (
              <details className="text-xs">
                <summary className="text-gray-500 cursor-pointer mb-1">Your answer</summary>
                <p className="text-gray-400">{q.answer_text}</p>
              </details>
            )}

            {q.suggested_answer && (
              <details className="text-xs mt-1">
                <summary className="text-blue-400 cursor-pointer mb-1">Model answer</summary>
                <p className="text-gray-400 leading-relaxed">{q.suggested_answer}</p>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/dashboard/interview/setup" className="btn-primary">Practice Again</Link>
        <Link href="/dashboard" className="btn-ghost">Back to Dashboard</Link>
      </div>
    </div>
  );
}