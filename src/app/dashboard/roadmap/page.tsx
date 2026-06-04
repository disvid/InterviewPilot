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
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((d) => setRoadmaps(d.roadmaps || []));
  }, []);

  async function generate() {
    if (!targetRole.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/roadmap/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role: targetRole }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      setError(data.error || "Failed to generate roadmap");
    } else {
      setRoadmap(data.roadmap);
      setRoadmaps((prev) => [data.roadmap, ...prev]);
      setExpanded(0);
    }
    setLoading(false);
  }

  const current = roadmap || roadmaps[0];
  const weeklyPlan = current?.weekly_plan ? JSON.parse(current.weekly_plan) : [];
  const missingSkills = current?.missing_skills ? JSON.parse(current.missing_skills) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="section-title text-3xl">Career Roadmap</h1>
        <p className="text-gray-400 mt-2">
          Get a personalized learning path to achieve your target role
        </p>
      </div>

      {/* Generate New Roadmap */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-5">Generate New Roadmap</h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Target Role</label>
            <input
              className="input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer, Product Manager, AI Engineer"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading || !targetRole.trim()}
            className="btn-primary w-full py-4 text-lg font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating AI Roadmap...
              </span>
            ) : (
              "✨ Generate Personalized Roadmap"
            )}
          </button>
        </div>
      </div>

      {current && (
        <>
          {/* Roadmap Overview */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold">{current.target_role}</h2>
                <p className="text-gray-400 mt-2">
                  Estimated Duration: <span className="text-white font-medium">{current.estimated_weeks} weeks</span>
                </p>
              </div>

              <div className="text-center md:text-right">
                <div className={`text-5xl font-bold tracking-tighter ${
                  (current.readiness_score || 0) >= 70 ? "text-emerald-400" :
                  (current.readiness_score || 0) >= 40 ? "text-amber-400" : "text-red-400"
                }`}>
                  {Math.round(current.readiness_score || 0)}%
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Readiness Score</p>
              </div>
            </div>

            {missingSkills.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-medium text-red-400 mb-3">Skills You Need to Acquire</h4>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill: string, i: number) => (
                    <span key={i} className="badge bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Plan */}
          {weeklyPlan.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">📅 Weekly Learning Plan</h3>
              <div className="space-y-4">
                {weeklyPlan.map((week: any, i: number) => (
                  <div key={i} className="card p-0 overflow-hidden card-hover">
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-sm">
                          W{week.week}
                        </div>
                        <div>
                          <p className="font-medium">{week.title}</p>
                          <p className="text-xs text-gray-500">Week {week.week}</p>
                        </div>
                      </div>
                      <span className="text-xl text-gray-400 transition-transform">
                        {expanded === i ? "−" : "+"}
                      </span>
                    </button>

                    {expanded === i && (
                      <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                        {week.tasks?.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Key Tasks</h5>
                            <ul className="space-y-2">
                              {week.tasks.map((task: string, j: number) => (
                                <li key={j} className="flex gap-3 text-sm text-gray-300">
                                  <span className="text-blue-400 mt-1.5">•</span>
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {week.resources?.length > 0 && (
                          <div>
                            <h5 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Recommended Resources</h5>
                            <div className="space-y-3">
                              {week.resources.map((resource: any, j: number) => (
                                <a
                                  key={j}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block bg-gray-950 hover:bg-gray-900 p-4 rounded-2xl transition-colors group"
                                >
                                  <div className="flex items-start gap-3">
                                    {resource.type && (
                                      <span className="badge bg-blue-500/10 text-blue-400 text-xs mt-0.5">
                                        {resource.type}
                                      </span>
                                    )}
                                    <div className="flex-1">
                                      <p className="group-hover:text-blue-400 transition-colors">{resource.title}</p>
                                      {resource.description && (
                                        <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!current && (
        <div className="card text-center py-20">
          <div className="text-6xl mb-6 opacity-50">🗺️</div>
          <h3 className="text-xl font-medium">No Roadmap Yet</h3>
          <p className="text-gray-400 mt-2 max-w-xs mx-auto">
            Generate your first personalized career roadmap by entering a target role above.
          </p>
        </div>
      )}
    </div>
  );
}