"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "technical", label: "Technical", desc: "Coding, algorithms, system design", icon: "💻" },
  { value: "behavioral", label: "Behavioral", desc: "STAR method & situational", icon: "🗣️" },
  { value: "hr", label: "HR & Culture", desc: "Fit, motivation, experience", icon: "🤝" },
  { value: "system_design", label: "System Design", desc: "Architecture & scalability", icon: "🏗️" },
  { value: "mixed", label: "Mixed", desc: "Balanced experience", icon: "🔀" },
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
      body: JSON.stringify({ 
        interview_type: type, 
        job_role: jobRole.trim(), 
        difficulty, 
        total_questions: numQ 
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      setError(data.error || "Failed to create interview");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/interview/session/${data.session_id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="section-title text-4xl">Create New Interview</h1>
        <p className="text-gray-400 mt-2 text-lg">
          Configure your personalized AI interview session
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Interview Type Selection */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">Interview Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`p-6 rounded-2xl border text-left transition-all group hover:-translate-y-0.5 ${
                type === t.value 
                  ? "border-blue-500 bg-blue-500/10" 
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="text-3xl mb-4">{t.icon}</div>
              <div className="font-semibold text-lg">{t.label}</div>
              <div className="text-sm text-gray-400 mt-2 leading-snug">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-5">Difficulty Level</h3>
        <div className="flex gap-3">
          {[
            { value: "easy", label: "Easy", color: "emerald" },
            { value: "medium", label: "Medium", color: "amber" },
            { value: "hard", label: "Hard", color: "red" },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setDifficulty(value)}
              className={`flex-1 py-4 rounded-2xl border font-medium transition-all ${
                difficulty === value
                  ? `border-${color}-500 bg-${color}-500/10 text-${color}-400`
                  : "border-gray-700 hover:border-gray-600 text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">Interview Details</h3>
        
        <div className="space-y-8">
          <div>
            <label className="label">Target Job Role (Optional)</label>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, Product Manager, Backend Developer"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-2">
              This helps tailor questions to your role
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label">Number of Questions</label>
              <span className="text-2xl font-semibold text-blue-400">{numQ}</span>
            </div>
            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={numQ}
              onChange={(e) => setNumQ(+e.target.value)}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5</span>
              <span>15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-70"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating AI Interview...
          </>
        ) : (
          "🚀 Start Interview Now"
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Your interview will be powered by AI. Speak clearly and take your time.
      </p>
    </div>
  );
}