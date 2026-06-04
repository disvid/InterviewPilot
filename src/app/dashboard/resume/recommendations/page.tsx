"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const PRIORITY_COLOR: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-blue-500/30 bg-blue-500/5",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-blue-500/20 text-blue-400",
};

export default function ResumeRecommendationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resume/recommendations")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load recommendations");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Analyzing your resume with AI...</p>
          <p className="text-xs text-gray-500 mt-2">This usually takes 5-10 seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center py-16">
          <div className="text-5xl mb-6">📄</div>
          <h3 className="text-xl font-medium mb-2">No Resume Found</h3>
          <p className="text-gray-400 mb-8">
            {error === "No resume found" 
              ? "Upload your resume first to get personalized AI recommendations." 
              : error}
          </p>
          <Link href="/dashboard/resume" className="btn-primary">
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  const rec = data?.recommendations;
  if (!rec) return null;

  const scoreColor = (score: number) =>
    score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-title text-3xl">Resume Analysis</h1>
          <p className="text-gray-400 mt-1">{data.resume_filename}</p>
        </div>
        <Link href="/dashboard/resume" className="btn-ghost flex items-center gap-2">
          ← Back to Resume
        </Link>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-hover text-center">
          <div className={`text-5xl font-bold ${scoreColor(rec.overall_score)}`}>
            {rec.overall_score}
          </div>
          <p className="text-sm text-gray-400 mt-3 font-medium">Overall Score</p>
        </div>

        <div className="card card-hover text-center">
          <div className={`text-5xl font-bold ${scoreColor(rec.ats_score)}`}>
            {rec.ats_score}
          </div>
          <p className="text-sm text-gray-400 mt-3 font-medium">ATS Compatibility</p>
        </div>

        <div className="card card-hover text-center">
          <div className="text-5xl font-bold text-red-400">
            {rec.improvements?.filter((i: any) => i.priority === "high").length || 0}
          </div>
          <p className="text-sm text-gray-400 mt-3 font-medium">High Priority Fixes</p>
        </div>

        <div className="card card-hover text-center">
          <div className="text-5xl font-bold text-purple-400">
            {rec.keyword_suggestions?.length || 0}
          </div>
          <p className="text-sm text-gray-400 mt-3 font-medium">Keywords to Add</p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">📋 AI Summary</h3>
        <p className="text-gray-300 leading-relaxed">{rec.summary_feedback}</p>
      </div>

      {/* Strengths */}
      {rec.strengths?.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-5 text-emerald-400 flex items-center gap-2">
            ✅ What You’re Doing Well
          </h3>
          <div className="space-y-4">
            {rec.strengths.map((s: any, i: number) => (
              <div key={i} className="flex gap-4 bg-gray-950 rounded-2xl p-5">
                <span className="text-emerald-400 text-xl mt-0.5">✓</span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {rec.improvements?.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">🔧 Recommended Improvements</h3>
          
          {["high", "medium", "low"].map((priority) => {
            const items = rec.improvements.filter((i: any) => i.priority === priority);
            if (!items.length) return null;

            return (
              <div key={priority} className="mb-8">
                <div className={`uppercase text-xs font-semibold tracking-widest mb-4
                  ${priority === "high" ? "text-red-400" : priority === "medium" ? "text-amber-400" : "text-blue-400"}`}>
                  {priority} Priority
                </div>
                <div className="space-y-4">
                  {items.map((item: any, i: number) => (
                    <div key={i} className={`card border ${PRIORITY_COLOR[priority]} p-6`}>
                      <div className="flex items-start gap-4">
                        <span className={`badge px-3 py-1 ${PRIORITY_BADGE[priority]}`}>
                          {item.section}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-200">{item.issue}</p>
                          <p className="text-sm text-gray-400 mt-3">
                            <span className="text-blue-400 font-medium">Suggested Fix:</span> {item.fix}
                          </p>
                          {item.example && (
                            <div className="mt-4 p-4 bg-gray-950 border border-gray-800 rounded-xl text-sm font-mono text-gray-300">
                              {item.example}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords to Add */}
        {rec.keyword_suggestions?.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold mb-5">🔑 Keywords to Add</h3>
            <div className="flex flex-wrap gap-2">
              {rec.keyword_suggestions.map((kw: string, i: number) => (
                <span key={i} className="badge bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-2 text-sm">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Verbs */}
        {rec.action_verbs_to_add?.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold mb-5">💪 Powerful Action Verbs</h3>
            <div className="flex flex-wrap gap-2">
              {rec.action_verbs_to_add.map((verb: string, i: number) => (
                <span key={i} className="badge bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 text-sm">
                  {verb}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ATS Tips */}
      {rec.ats_tips?.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-5">🤖 ATS Optimization Tips</h3>
          <div className="space-y-4">
            {rec.ats_tips.map((tip: string, i: number) => (
              <div key={i} className="flex gap-4 bg-gray-950 rounded-2xl p-5">
                <span className="text-yellow-400 mt-0.5">→</span>
                <p className="text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Sections */}
      {rec.missing_sections?.length > 0 && (
        <div className="card border border-yellow-500/20">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400">⚠️ Missing Important Sections</h3>
          <div className="flex flex-wrap gap-3">
            {rec.missing_sections.map((section: string, i: number) => (
              <span key={i} className="badge bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-5 py-2">
                {section}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}