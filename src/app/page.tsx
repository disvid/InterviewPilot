import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
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
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium px-4 py-2 rounded-full mb-8 tracking-widest">
              INTERVIEW PREPARATION PLATFORM
            </div>

            <h1 className="text-7xl md:text-8xl font-bold leading-tight tracking-tighter mb-6 text-slate-100">
              Master Your<br />
              <span className="gradient-text">
                Interview Skills
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Practice with AI-powered interview simulations. Get real-time feedback, track your progress, and land your dream role with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-10 py-4 font-semibold">
                Start Practicing Free
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-10 py-4 font-medium">
                Sign In
              </Link>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="mt-20 text-center">
            <p className="text-xs text-slate-500 font-medium mb-6">TRUSTED BY PROFESSIONALS AT</p>
            <div className="flex gap-12 justify-center opacity-60 flex-wrap">
              <span className="text-sm font-medium text-slate-400">Google</span>
              <span className="text-sm font-medium text-slate-400">Microsoft</span>
              <span className="text-sm font-medium text-slate-400">Amazon</span>
              <span className="text-sm font-medium text-slate-400">Meta</span>
              <span className="text-sm font-medium text-slate-400">Apple</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <div className="bg-slate-900/50 py-24 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-100">Why Choose InterviewPilot</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Comprehensive tools designed for serious professionals preparing for their next opportunity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Interviews",
                desc: "Experience realistic, dynamically-generated interview scenarios tailored to your target role",
              },
              {
                title: "Real-Time Feedback",
                desc: "Receive instant analysis on your responses with actionable insights for improvement",
              },
              {
                title: "Progress Tracking",
                desc: "Monitor your development over time with detailed analytics and performance metrics",
              },
              {
                title: "Resume Analysis",
                desc: "Get AI-powered recommendations to optimize your resume for maximum impact",
              },
              {
                title: "Career Roadmaps",
                desc: "Receive personalized learning paths aligned with your professional goals",
              },
              {
                title: "Multiple Interview Types",
                desc: "Practice technical, behavioral, system design, and HR interviews in one platform",
              },
            ].map((feature, i) => (
              <div key={i} className="card card-hover group p-8">
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600"></div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-100">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-100">Ready to Transform Your Interview Skills?</h2>
          <p className="text-slate-400 text-lg mb-10">Join thousands of professionals preparing smarter, not harder.</p>
          <Link href="/register" className="btn-primary text-lg px-10 py-4 font-semibold inline-block">
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2024 InterviewPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
