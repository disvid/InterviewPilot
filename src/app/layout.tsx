import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewPilot — AI Mock Interviews",
  description: "Master your interviews with AI-powered mock sessions, real-time feedback, and personalized career roadmaps.",
  keywords: ["interview", "mock interview", "AI interview", "technical interview", "job preparation"],
  authors: [{ name: "InterviewPilot" }],
  openGraph: {
    title: "InterviewPilot — AI Mock Interviews",
    description: "Practice interviews with AI and get instant expert feedback.",
    images: [{ url: "/og-image.png" }],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
