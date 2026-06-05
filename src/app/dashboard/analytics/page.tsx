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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="section-title">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1.5">
            Monitor your growth and interview performance
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: "Total Completed", 
            value: totalSessions,
            icon: "●",
            gradient: "from-teal-500/20 to-teal-600/20",
            accent: "text-teal-400"
          },
          { 
            label: "Average Score", 
            value: `${Math.round(avgScore)}%`,
            icon: "◈",
            gradient: "from-emerald-500/20 to-emerald-600/20",
            accent: "text-emerald-400"
          },
          { 
            label: "Best Score", 
            value: `${Math.round(bestScore)}%`,
            icon: "★",
            gradient: "from-amber-500/20 to-amber-600/20",
            accent: "text-amber-400"
          },
        ].map((stat, i) => (
          <div key={i} className={`card card-hover bg-gradient-to-br ${stat.gradient} border-2 border-${i===0 ? 'teal' : i===1 ? 'emerald' : 'amber'}-500/20`}>
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-4xl font-bold ${stat.accent}`}>
                  {stat.value}
                </div>
                <p className="text-slate-400 mt-3 font-medium text-sm">{stat.label}</p>
              </div>
              <div className={`text-3xl opacity-60 ${stat.accent}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <AnalyticsCharts scoreTrend={scoreTrend} byType={byType} />
      </div>

      {completedSessions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-5 text-slate-100">Recent Interviews</h2>
          <div className="space-y-3">
            {completedSessions.slice(0, 6).map((session: any, index: number) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-slate-900/50 rounded-lg p-5 hover:bg-slate-800/50 transition-colors border border-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg border border-slate-700">
                    {session.interview_type?.includes("technical") ? "▧" : "◆"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 capitalize">
                      {session.interview_type?.replace("_", " ") || "Mock Interview"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(session.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`badge font-semibold text-base ${
                    session.overall_score >= 75 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    session.overall_score >= 55 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  } px-4 py-1.5`}>
                    {session.overall_score || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
