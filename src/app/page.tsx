import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
            IP
          </div>
          <span className="text-2xl font-semibold tracking-tight">InterviewPilot</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-ghost text-sm px-6 py-2.5">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-sm px-6 py-2.5">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-5 py-2 rounded-full mb-8">
            ✨ Powered by Advanced AI
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tighter mb-6">
            Master Interviews.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Land Your Dream Job.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Practice with realistic AI interviews, get instant feedback, and track your progress — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-10 py-4 font-semibold">
              Start Practicing Free →
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-10 py-4 font-medium">
              Sign In
            </Link>
          </div>

          {/* Trust Bar */}
          <div className="mt-12 text-xs text-gray-500 flex items-center justify-center gap-8">
            <div>Trusted by job seekers at</div>
            <div className="flex gap-6 opacity-60">
              <span>Google</span>
              <span>Microsoft</span>
              <span>Amazon</span>
              <span>Meta</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3">Everything you need to succeed</h2>
            <p className="text-gray-400">Powerful tools designed for serious interview preparation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🧠",
                title: "Smart AI Questions",
                desc: "Personalized questions based on your resume and target role using advanced AI."
              },
              {
                icon: "🎙️",
                title: "Voice Practice",
                desc: "Record answers naturally. Get transcribed and evaluated instantly with confidence analysis."
              },
              {
                icon: "📊",
                title: "Deep Feedback",
                desc: "Detailed scores, strengths, weaknesses, model answers, and improvement tips."
              },
            ].map((feature, i) => (
              <div key={i} className="card card-hover p-8 text-center group">
                <div className="text-5xl mb-6 transition-transform group-hover:scale-110 inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 border-t border-gray-800">
        <div className="max-w-md mx-auto text-center px-6">
          <h2 className="text-3xl font-semibold mb-4">Ready to improve your interviews?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of candidates preparing smarter with AI.
          </p>
          <Link href="/register" className="btn-primary text-lg px-12 py-4 inline-block">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}