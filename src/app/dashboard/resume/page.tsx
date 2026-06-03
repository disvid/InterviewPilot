"use client";
import { useState, useEffect } from "react";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    fetch("/api/resume").then(r => r.json()).then(d => { if (d.resume) setResume(d.resume); });
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Upload failed"); } else { setResume(data.resume); setFile(null); }
    setUploading(false);
  }

  const skills = resume?.parsed_skills ? JSON.parse(resume.parsed_skills) : [];
  const experience = resume?.parsed_experience ? JSON.parse(resume.parsed_experience) : [];
  const projects = resume?.parsed_projects ? JSON.parse(resume.parsed_projects) : [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Resume</h1>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${drag ? "border-blue-400 bg-blue-400/5" : "border-gray-700 hover:border-gray-600"}`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div className="text-3xl mb-3">{uploading ? "⏳" : "📤"}</div>
        <div className="font-medium">{file ? file.name : "Drag & drop your PDF resume"}</div>
        <div className="text-sm text-gray-500 mt-1">{file ? "Click Upload to parse" : "or click to browse · PDF only · Max 5MB"}</div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {file && (
        <button onClick={handleUpload} disabled={uploading} className="btn-primary">
          {uploading ? "Parsing with AI..." : "Upload & Parse Resume"}
        </button>
      )}

      {resume && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            ✅ Resume Active: {resume.filename}
          </div>

          {resume.summary && (
            <div className="card">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{resume.summary}</p>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span>Experience: <span className="text-gray-300">{resume.experience_years}y</span></span>
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Skills ({skills.length})</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: any, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-lg">
                    {s.skill_name}
                    {s.proficiency_level && <span className="opacity-60"> · {s.proficiency_level}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {experience.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Experience</h3>
              <div className="space-y-3">
                {experience.map((e: any, i: number) => (
                  <div key={i} className="border-l-2 border-blue-500/30 pl-4">
                    <div className="font-medium text-sm">{e.role} at {e.company}</div>
                    <div className="text-xs text-gray-500">{e.start_date} – {e.end_date || "Present"}</div>
                    {e.description && <p className="text-xs text-gray-400 mt-1">{e.description?.slice(0, 200)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Projects</h3>
              <div className="space-y-3">
                {projects.map((p: any, i: number) => (
                  <div key={i}>
                    <div className="font-medium text-sm">{p.name}</div>
                    <p className="text-xs text-gray-400 mt-0.5">{p.description?.slice(0, 150)}</p>
                    {p.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.technologies.slice(0, 6).map((t: string) => (
                          <span key={t} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}