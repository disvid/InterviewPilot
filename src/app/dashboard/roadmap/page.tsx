"use client";
import { useState, useEffect } from "react";

export default function RoadmapPage() {
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/roadmap").then(r => r.json()).then(d => setRoadmaps(d.roadmaps || []));
  }, []);

  async function generate() {
    if (!targetRole.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/roadmap/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role: targetRole }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); } else { setRoadmap(data.roadmap); setRoadmaps(p => [data.roadmap, ...p]); }
    setLoading(false);
  }

  const current = roadmap || roadmaps[0];
  const weeklyPlan = current?.weekly_plan ? JSON.parse(current.weekly_plan) : [];
  const missingSkills = current?.missing_skills ? JSON.parse(current.missing_skills) : [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Career Roadmap</h1>

      <div className="card space-y-3">
        <h3 className="font-semibold">Generate New Roadmap</h3>
        <input className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)}
          placeholder="Target role e.g. Senior Backend Engineer" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={generate} disabled={loading || !targetRole.trim()} className="btn-primary">
          {loading ? "Generating with AI..." : "Generate Roadmap"}
        </button>
      </div>

      {current && (
        <>
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{current.target_role}</h3>
                <p className="text-sm text-gray-400 mt-1">{current.estimated_weeks} weeks estimated</p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${(current.readiness_score || 0) >= 70 ? "text-green-400" : (current.readiness_score || 0) >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                  {Math.round(current.readiness_score || 0)}%
                </div>
                <div className="text-xs text-gray-500">readiness</div>
              </div>
            </div>
            {missingSkills.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-300 mb-2">Skills to acquire:</div>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((s: string) => (
                    <span key={s} className="badge bg-red-500/10 border border-red-500/20 text-red-400">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {weeklyPlan.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Weekly Plan</h3>
              {weeklyPlan.map((week: any, i: number) => (
                <div key={i} className="card p-0 overflow-hidden">
                  <button onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors">
                    <span><span className="text-blue-400 font-medium text-sm">Week {week.week}</span> <span className="text-sm ml-2">{week.title}</span></span>
                    <span className="text-gray-500 text-sm">{expanded === i ? "▲" : "▼"}</span>
                  </button>
                  {expanded === i && (
                    <div className="px-4 pb-4 space-y-3">
                      {week.tasks?.length > 0 && (
                        <ul className="space-y-1">
                          {week.tasks.map((t: string, j: number) => (
                            <li key={j} className="text-sm text-gray-400 flex gap-2"><span className="text-blue-400">•</span>{t}</li>
                          ))}
                        </ul>
                      )}
                      {week.resources?.length > 0 && (
                        <div className="space-y-1">
                          {week.resources.map((r: any, j: number) => (
                            <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="block text-sm text-blue-400 hover:underline">
                              {r.type && <span className="badge bg-blue-500/10 text-blue-400 mr-1">{r.type}</span>}
                              {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}