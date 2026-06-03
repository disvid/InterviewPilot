"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "technical", label: "Technical", desc: "Coding, algorithms, systems" },
  { value: "behavioral", label: "Behavioral", desc: "STAR format situational" },
  { value: "hr", label: "HR", desc: "Culture fit, goals" },
  { value: "system_design", label: "System Design", desc: "Architecture & scalability" },
  { value: "mixed", label: "Mixed", desc: "All of the above" },
];

export default function InterviewSetupPage() {
  const [type, setType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [jobRole, setJobRole] = useState("");
  const [numQ, setNumQ] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/interview/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interview_type: type, job_role: jobRole, difficulty, total_questions: numQ }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return; }
    router.push(`/dashboard/interview/session/${data.session_id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Setup Interview</h1>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      <div className="card space-y-3">
        <h3 className="font-semibold">Interview Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={`p-3 rounded-xl border text-left transition-all text-sm ${type === t.value ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-gray-700 hover:border-gray-600"}`}>
              <div className="font-medium">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Difficulty</h3>
        <div className="flex gap-2">
          {[["easy", "Easy", "text-green-400"], ["medium", "Medium", "text-yellow-400"], ["hard", "Hard", "text-red-400"]].map(([v, l, c]) => (
            <button key={v} onClick={() => setDifficulty(v)}
              className={`px-5 py-2 rounded-lg border text-sm font-medium transition-all ${difficulty === v ? `border-current ${c} bg-current/10` : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold">Details</h3>
        <div>
          <label className="label">Target Role (optional)</label>
          <input className="input" value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder="e.g. Senior Software Engineer" />
        </div>
        <div>
          <label className="label">Questions: <span className="text-blue-400">{numQ}</span></label>
          <input type="range" min={5} max={15} step={1} value={numQ} onChange={e => setNumQ(+e.target.value)}
            className="w-full accent-blue-500 mt-1" />
          <div className="flex justify-between text-xs text-gray-500 mt-1"><span>5</span><span>15</span></div>
        </div>
      </div>

      <button onClick={handleStart} disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? "Generating questions with AI..." : "▶ Start Interview"}
      </button>
    </div>
  );
}