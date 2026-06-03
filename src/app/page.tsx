import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <span className="text-xl font-bold text-blue-400">InterviewPilot</span>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
          <Link href="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-block bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-8">
          AI-Powered Interview Preparation
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl">
          Ace Your Next Interview with <span className="text-blue-400">AI Coaching</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Upload your resume. Get personalized questions. Practice with voice or text. Get instant AI feedback.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className="btn-primary text-base px-8 py-3">Start Free →</Link>
          <Link href="/login" className="btn-ghost text-base px-8 py-3">Sign In</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full text-left">
          {[
            { icon: "🧠", title: "AI Questions", desc: "Personalized questions from your resume and target role via Gemini AI" },
            { icon: "🎙️", title: "Voice Answers", desc: "Record voice answers — transcribed and evaluated instantly" },
            { icon: "📊", title: "Real Feedback", desc: "Scores, strengths, weaknesses, and model answers for every question" },
          ].map((f) => (
            <div key={f.title} className="card">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-2">{f.title}</div>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}