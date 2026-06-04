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
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="section-title text-3xl">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1.5">
            Monitor your growth and interview performance
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: "Total Completed", 
            value: totalSessions,
            icon: "📊",
            color: "from-blue-500 to-cyan-500"
          },
          { 
            label: "Average Score", 
            value: `${Math.round(avgScore)}%`,
            icon: "🎯",
            color: "from-indigo-500 to-purple-500"
          },
          { 
            label: "Best Score", 
            value: `${Math.round(bestScore)}%`,
            icon: "🏆",
            color: "from-amber-500 to-orange-500"
          },
        ].map((stat, i) => (
          <div key={i} className="card card-hover group">
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-4xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <p className="text-gray-400 mt-3 font-medium">{stat.label}</p>
              </div>
              <div className="text-3xl opacity-70 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="card">
        <AnalyticsCharts scoreTrend={scoreTrend} byType={byType} />
      </div>

      {/* Recent Activity */}
      {completedSessions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-5">Recent Interviews</h2>
          <div className="space-y-3">
            {completedSessions.slice(0, 6).map((session: any, index: number) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-gray-950 rounded-2xl p-5 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xl">
                    {session.interview_type?.includes("technical") ? "💻" : "🗣️"}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">
                      {session.interview_type?.replace("_", " ") || "Mock Interview"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="badge bg-emerald-500/10 text-emerald-400 px-4 py-1.5 text-sm">
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