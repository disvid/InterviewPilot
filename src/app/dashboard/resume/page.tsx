"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((d) => {
        if (d.resume) setResume(d.resume);
      });
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/resume/upload", { 
      method: "POST", 
      body: fd 
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      setError(data.error || "Upload failed");
    } else {
      setResume(data.resume);
      setFile(null);
    }
    setUploading(false);
  }

  const skills = resume?.parsed_skills ? JSON.parse(resume.parsed_skills) : [];
  const experience = resume?.parsed_experience ? JSON.parse(resume.parsed_experience) : [];
  const projects = resume?.parsed_projects ? JSON.parse(resume.parsed_projects) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="section-title">My Resume</h1>
          <p className="text-slate-400 mt-1">Upload and manage your resume</p>
        </div>
        {resume && (
          <Link href="/dashboard/resume/recommendations" className="btn-primary flex items-center gap-2">
            Analysis
          </Link>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setDrag(false); 
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile?.type === "application/pdf") setFile(droppedFile);
        }}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`card border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${
          drag ? "border-teal-500 bg-teal-500/5 scale-[1.02]" : "border-slate-700 hover:border-teal-500/50"
        }`}
      >
        <input 
          id="file-input" 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
        />

        <div className="mx-auto w-20 h-20 rounded-lg bg-slate-900/50 flex items-center justify-center text-4xl mb-6 border border-slate-800">
          {uploading ? "⟳" : "▢"}
        </div>

        <div className="text-xl font-medium text-slate-100">
          {file ? file.name : "Drag & drop your resume PDF"}
        </div>
        
        <p className="text-slate-400 mt-2 text-sm">
          {file 
            ? "Ready to upload • Click the button below" 
            : "or click to browse • PDF only • Max 5MB"}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-lg">
          {error}
        </div>
      )}

      {file && (
        <button 
          onClick={handleUpload} 
          disabled={uploading} 
          className="btn-primary w-full py-4 text-lg font-semibold"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Parsing Resume with AI...
            </span>
          ) : "Upload & Parse Resume"}
        </button>
      )}

      {/* Parsed Resume Content */}
      {resume && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-5 py-4">
            <div className="text-2xl">✓</div>
            <div>
              <p className="font-medium text-emerald-400">Resume Successfully Parsed</p>
              <p className="text-sm text-slate-400">{resume.filename}</p>
            </div>
          </div>

          {/* Summary */}
          {resume.summary && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4 text-slate-100">Professional Summary</h3>
              <p className="text-slate-300 leading-relaxed">{resume.summary}</p>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Experience:</span>{" "}
                  <span className="font-medium text-slate-100">{resume.experience_years || "N/A"} years</span>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-5 text-slate-100">Skills ({skills.length})</h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((s: any, i: number) => (
                  <span 
                    key={i} 
                    className="px-5 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm hover:border-teal-500/50 transition-colors text-slate-200"
                  >
                    {s.skill_name}
                    {s.proficiency_level && (
                      <span className="text-teal-400 ml-1.5">• {s.proficiency_level}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-6 text-slate-100">Experience</h3>
              <div className="space-y-8">
                {experience.map((e: any, i: number) => (
                  <div key={i} className="border-l-2 border-teal-500/30 pl-6">
                    <div className="flex justify-between">
                      <div className="font-semibold text-slate-100">{e.role}</div>
                      <div className="text-xs text-slate-500 text-right">
                        {e.start_date} — {e.end_date || "Present"}
                      </div>
                    </div>
                    <div className="text-teal-400 text-sm mt-0.5">{e.company}</div>
                    {e.description && (
                      <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-6 text-slate-100">Projects</h3>
              <div className="space-y-6">
                {projects.map((p: any, i: number) => (
                  <div key={i} className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
                    <div className="font-medium text-lg text-slate-100">{p.name}</div>
                    {p.description && (
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    {p.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {p.technologies.slice(0, 8).map((tech: string) => (
                          <span 
                            key={tech} 
                            className="text-xs px-3 py-1 bg-slate-900 rounded-full text-slate-300 border border-slate-700"
                          >
                            {tech}
                          </span>
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
