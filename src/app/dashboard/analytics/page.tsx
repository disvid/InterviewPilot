import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AnalyticsCharts } from "@/components/analytics-charts";

export default async function AnalyticsPage() {
  const session = await getSession();
  const db = getDb();

  const completedSessions = db.prepare(`
    SELECT * FROM interview_sessions 
    WHERE user_id = ? AND status = 'completed' 
    ORDER BY completed_at DESC
  `).all(session!.userId) as any[];

  const totalSessions = completedSessions.length;
  const avgScore = totalSessions 
    ? completedSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / totalSessions 
    : 0;

  const bestScore = totalSessions 
    ? Math.max(...completedSessions.map((s: any) => s.overall_score || 0)) 
    : 0;

  const scoreTrend = completedSessions.map((s: any) => ({
    date: s.completed_at?.slice(0, 10) || "",
    score: Math.round(s.overall_score || 0)
  })).reverse();

  const byType = Object.entries(
    completedSessions.reduce((acc: any, s: any) => {
      const type = s.interview_type || "mixed";
      if (!acc[type]) acc[type] = { count: 0, total: 0 };
      acc[type].count++;
      acc[type].total += s.overall_score || 0;
      return acc;
    }, {})
  ).map(([type, data]: any) => ({
    type: type.replace("_", " "),
    avgScore: Math.round(data.total / data.count)
  }));

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Completed", value: totalSessions },
          { label: "Average Score", value: `${Math.round(avgScore)}%` },
          { label: "Best Score", value: `${Math.round(bestScore)}%` },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="text-3xl font-bold text-blue-400">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <AnalyticsCharts scoreTrend={scoreTrend} byType={byType} />
    </div>
  );
}