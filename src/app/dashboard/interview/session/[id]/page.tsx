"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions
  useEffect(() => {
    fetch(`/api/interview/${id}/questions`)
      .then(r => r.json())
      .then(d => {
        setQuestions(d.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setEvaluation(evaluations[questions[current]?.id] || null);
    setAnswer("");
  }, [current, questions, evaluations]);

  // Timer for recording
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  const submitAnswer = async (text: string) => {
    if (!text.trim() || !questions[current]) return;
    setSubmitting(true);

    const res = await fetch("/api/answer/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: id, question_id: questions[current].id, answer_text: text }),
    });

    const data = await res.json();
    if (res.ok) {
      setEvaluations(prev => ({ ...prev, [questions[current].id]: data.evaluation }));
      setEvaluation(data.evaluation);
    }
    setSubmitting(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        setSubmitting(true);
        const fd = new FormData();
        fd.append("audio", blob, "answer.webm");
        fd.append("session_id", id);
        fd.append("question_id", questions[current].id);

        const res = await fetch("/api/answer/audio", { method: "POST", body: fd });
        const data = await res.json();

        if (res.ok && data.transcription) {
          setAnswer(data.transcription);
          if (data.evaluation) {
            setEvaluations(prev => ({ ...prev, [questions[current].id]: data.evaluation }));
            setEvaluation(data.evaluation);
          }
        } else {
          alert(data.error || "Voice transcription failed. Try text answer.");
        }
        setSubmitting(false);
      };

      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current) {
      mediaRef.current.stop();
      setRecording(false);
    }
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      router.push(`/dashboard/interview/results/${id}`);
    }
  };

  const q = questions[current];

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading interview...</div>;
  if (!q) return <div className="text-center py-20 text-gray-400">No questions found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span className="capitalize">{q.question_type?.replace("_", " ")}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full">
          <div className="h-full bg-blue-500 rounded-full transition-all" 
               style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="card">
        {q.skill_tags && JSON.parse(q.skill_tags || "[]").map((t: string, i: number) => (
          <span key={i} className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 mr-2 mb-3 inline-block">
            {t}
          </span>
        ))}
        <h2 className="text-lg font-semibold leading-relaxed">{q.question_text}</h2>
      </div>

      {evaluation ? (
        <div className="card border-green-500/30">
          <div className="flex justify-between mb-4">
            <span className="text-green-400 font-semibold">✅ Evaluated</span>
            <span className={`text-3xl font-bold ${evaluation.overall_score >= 70 ? "text-green-400" : "text-yellow-400"}`}>
              {Math.round(evaluation.overall_score)}%
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-4">{evaluation.ai_feedback}</p>

          <button onClick={goNext} className="btn-primary w-full">
            {current < questions.length - 1 ? "Next Question →" : "See Final Results →"}
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <label className="label">Your Answer</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={6}
            disabled={submitting || recording}
            placeholder="Type your answer here or use voice recording..."
            className="input resize-y"
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => submitAnswer(answer)}
              disabled={!answer.trim() || submitting}
              className="btn-primary flex-1"
            >
              {submitting ? "Evaluating..." : "Submit Answer"}
            </button>

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={submitting}
              className={`btn-ghost flex-1 ${recording ? "border-red-500 text-red-400" : ""}`}
            >
              {recording ? `⏹️ Stop Recording (${recTime}s)` : "🎙️ Voice Answer"}
            </button>

            <button onClick={goNext} className="text-sm text-gray-400 hover:text-gray-200 px-4">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Progress Dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
              i === current ? "bg-blue-600 text-white" :
              evaluations[questions[i]?.id] ? "bg-green-600/20 text-green-400" :
              "bg-gray-800 hover:bg-gray-700 text-gray-400"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}