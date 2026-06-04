"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type Evaluation = {
  overall_score: number;
  technical_score: number | null;
  relevance_score: number;
  communication_score: number;
  structure_score: number;
  ai_feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggested_answer: string;
  improvement_tips: string[];
};

type Confidence = {
  score: number;
  pace_wpm: number;
  filler_count: number;
  filler_words: string[];
  hesitation_count: number;
  feedback: string;
  traits: { label: string; positive: boolean }[];
};

type QuestionResult = {
  evaluation: Evaluation;
  confidence: Confidence;
  transcription?: string;
};

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [loading, setLoading] = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Recording States
  const [recState, setRecState] = useState<"idle" | "recording" | "processing">("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Questions
  useEffect(() => {
    fetch(`/api/interview/${id}/questions`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions || []);
        setLoading(false);
      });
  }, [id]);

  const currentQ = questions[current];
  const currentResult = currentQ ? results[currentQ.id] : null;

  // Auto-speak current question
  useEffect(() => {
    if (!currentQ || !ttsEnabled) return;
    setAnswer("");
    setSubmitError("");
    speakQuestion(currentQ.question_text);
  }, [current, currentQ?.id]);

  // Recording Timer
  useEffect(() => {
    if (recState === "recording") {
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recState === "idle") setRecSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  async function speakQuestion(text: string) {
    stopAudio();
    setTtsLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        browserSpeak(text);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setTtsPlaying(true);
      audio.onended = () => { setTtsPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => browserSpeak(text);

      await audio.play();
    } catch {
      browserSpeak(text);
    } finally {
      setTtsLoading(false);
    }
  }

  function browserSpeak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.onstart = () => setTtsPlaying(true);
    utt.onend = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utt);
  }

  function stopAudio() {
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis?.cancel();
    setTtsPlaying(false);
  }

  async function startRecording() {
    setSubmitError("");
    stopAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = ["audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        
        if (blob.size < 1500) {
          setSubmitError("Recording too short. Please speak for at least 3 seconds.");
          setRecState("idle");
          return;
        }
        await uploadAudio(blob, recorder.mimeType || "audio/webm");
      };

      recorder.start(250);
      setAnswerStartTime(Date.now());
      setRecState("recording");
    } catch (err: any) {
      const msg = err.name === "NotAllowedError" 
        ? "Microphone access denied. Please allow microphone permission." 
        : "Failed to access microphone.";
      setSubmitError(msg);
      setRecState("idle");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
      setRecState("processing");
    }
  }

  async function uploadAudio(blob: Blob, mimeType: string) {
    if (!currentQ) return;
    setSubmitting(true);

    try {
      const durationSeconds = Math.round((Date.now() - answerStartTime) / 1000);
      const file = new File([blob], `answer_${Date.now()}.webm`, { type: mimeType });

      const fd = new FormData();
      fd.append("audio", file);
      fd.append("session_id", id);
      fd.append("question_id", currentQ.id);
      fd.append("duration_seconds", String(durationSeconds));

      const res = await fetch("/api/answer/audio", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to process answer");
      } else {
        setResults((prev) => ({
          ...prev,
          [currentQ.id]: {
            evaluation: data.evaluation,
            confidence: data.confidence,
            transcription: data.transcription
          }
        }));
      }
    } catch (err: any) {
      setSubmitError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
      setRecState("idle");
    }
  }

  async function submitTextAnswer() {
    if (!answer.trim() || !currentQ) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const durationSeconds = answerStartTime ? Math.round((Date.now() - answerStartTime) / 1000) : 45;
      const res = await fetch("/api/answer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: id,
          question_id: currentQ.id,
          answer_text: answer,
          duration_seconds: durationSeconds
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed");
      } else {
        setResults((prev) => ({
          ...prev,
          [currentQ.id]: { evaluation: data.evaluation, confidence: data.confidence }
        }));
      }
    } catch (err) {
      setSubmitError("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      router.push(`/dashboard/interview/results/${id}`);
    }
  }

  const scoreColor = (s: number) =>
    s >= 75 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";

  const scoreBg = (s: number) =>
    s >= 75 ? "bg-emerald-400" : s >= 50 ? "bg-amber-400" : "bg-red-400";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your interview session...</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(results).length;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Progress Header */}
      <div className="card">
        <div className="flex justify-between items-center mb-3 px-1">
          <div>
            <span className="text-sm text-gray-400">Question </span>
            <span className="text-2xl font-semibold text-white">{current + 1}</span>
            <span className="text-sm text-gray-400"> / {questions.length}</span>
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="btn-ghost text-sm px-4 py-2"
          >
            {ttsEnabled ? "🔊 Audio Enabled" : "🔇 Audio Disabled"}
          </button>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* AI Interviewer */}
      <div className="card p-8">
        <div className="flex gap-6">
          <div className="shrink-0 pt-1">
            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-4xl transition-all ${ttsPlaying ? "border-blue-400 shadow-xl shadow-blue-500/30" : "border-gray-700"}`}>
              {ttsPlaying ? "🟢" : "🤖"}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xl leading-relaxed text-gray-100">{currentQ?.question_text}</p>
            <div className="mt-6">
              {ttsPlaying ? (
                <button onClick={stopAudio} className="text-red-400 hover:text-red-500 transition-colors flex items-center gap-2">
                  ⏹ Stop Audio
                </button>
              ) : (
                <button onClick={() => speakQuestion(currentQ?.question_text)} className="btn-ghost">
                  🔊 Replay Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {currentResult ? (
        <div className="space-y-6">
          {/* Evaluation Card */}
          <div className="card p-8">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-2xl font-semibold">Answer Evaluation</h3>
              <div className={`text-6xl font-bold ${scoreColor(currentResult.evaluation.overall_score)}`}>
                {Math.round(currentResult.evaluation.overall_score)}%
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Relevance", val: currentResult.evaluation.relevance_score },
                { label: "Communication", val: currentResult.evaluation.communication_score },
                { label: "Structure", val: currentResult.evaluation.structure_score },
                ...(currentResult.evaluation.technical_score ? [{ label: "Technical", val: currentResult.evaluation.technical_score }] : []),
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-950 rounded-2xl p-5">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-4xl font-semibold mt-1 ${scoreColor(val)}`}>{Math.round(val)}</p>
                  <div className="h-1.5 bg-gray-800 mt-4 rounded">
                    <div className={`h-full ${scoreBg(val)}`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-200 leading-relaxed">{currentResult.evaluation.ai_feedback}</p>

            <div className="grid md:grid-cols-2 gap-8 mt-10">
              <div>
                <p className="uppercase text-emerald-400 text-xs tracking-widest mb-3">Strengths</p>
                {currentResult.evaluation.strengths?.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-emerald-400/90 mb-1">• {s}</p>
                ))}
              </div>
              <div>
                <p className="uppercase text-red-400 text-xs tracking-widest mb-3">Areas to Improve</p>
                {currentResult.evaluation.weaknesses?.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-red-400/90 mb-1">• {w}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Confidence Analysis - FULLY RESTORED */}
          {currentResult.confidence && (
            <div className="card p-8">
              <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">🎤 Confidence & Delivery Analysis</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-950 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-blue-400">{currentResult.confidence.pace_wpm}</div>
                  <div className="text-xs text-gray-500 mt-1">Words/min</div>
                </div>
                <div className="bg-gray-950 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-yellow-400">{currentResult.confidence.filler_count}</div>
                  <div className="text-xs text-gray-500 mt-1">Filler Words</div>
                </div>
                <div className="bg-gray-950 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-bold text-purple-400">{currentResult.confidence.hesitation_count}</div>
                  <div className="text-xs text-gray-500 mt-1">Hesitations</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {currentResult.confidence.traits.map((t, i) => (
                  <span key={i} className={`badge ${t.positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"} border`}>
                    {t.positive ? "✓" : "→"} {t.label}
                  </span>
                ))}
              </div>

              {currentResult.confidence.feedback && (
                <p className="text-sm text-gray-300 bg-gray-950 p-4 rounded-2xl">{currentResult.confidence.feedback}</p>
              )}

              {currentResult.transcription && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200">📝 View Full Transcription</summary>
                  <p className="mt-3 text-sm text-gray-400 italic border-l-2 border-gray-700 pl-4">
                    "{currentResult.transcription}"
                  </p>
                </details>
              )}
            </div>
          )}

          <button onClick={goNext} className="btn-primary w-full py-4 text-lg font-semibold">
            {current < questions.length - 1 ? "Next Question →" : "Complete Interview & View Results"}
          </button>
        </div>
      ) : (
        /* Answer Input Section */
        <div className="card p-8 space-y-8">
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl">
              {submitError}
            </div>
          )}

          {/* Voice Recorder */}
          <div className="border border-gray-700 rounded-3xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <span className="font-medium">Voice Response</span>
              {recState === "recording" && (
                <span className="text-red-400 flex items-center gap-2">
                  <span className="animate-pulse">●</span> Recording ({recSeconds}s)
                </span>
              )}
            </div>

            <div className="p-8">
              {recState === "idle" && (
                <button
                  onClick={startRecording}
                  className="w-full py-16 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-2xl hover:bg-blue-500/5 transition-all group"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎙️</div>
                  <p className="font-medium">Start Recording Your Answer</p>
                  <p className="text-sm text-gray-500 mt-1">Speak naturally • AI will transcribe and evaluate</p>
                </button>
              )}

              {recState === "recording" && (
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-8">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-red-500 rounded-full animate-pulse w-3" style={{ height: 20 + Math.random() * 50 }} />
                    ))}
                  </div>
                  <button onClick={stopRecording} className="btn-primary w-full py-4 text-lg">
                    Stop Recording & Submit
                  </button>
                </div>
              )}

              {recState === "processing" && (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Analyzing your response...</p>
                </div>
              )}
            </div>
          </div>

          {/* Text Answer */}
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Or type your answer</div>
            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (!answerStartTime) setAnswerStartTime(Date.now());
              }}
              rows={6}
              placeholder="Type your detailed answer here..."
              className="input resize-y min-h-[140px]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{answer.trim().split(/\s+/).length} words</span>
              <span>Recommended: 80–180 words</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={submitTextAnswer}
              disabled={!answer.trim() || submitting}
              className="btn-primary flex-1 py-4"
            >
              {submitting ? "Evaluating Answer..." : "Submit Answer"}
            </button>
            <button onClick={goNext} className="btn-ghost px-8">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 pt-4">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => {
              if (recState === "idle" && !submitting) setCurrent(i);
            }}
            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
              i === current
                ? "bg-blue-600 text-white scale-110"
                : results[q.id]
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-gray-900 hover:bg-gray-800 text-gray-400"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <div className="ml-auto self-center text-sm text-gray-500">
          {answeredCount} / {questions.length} answered
        </div>
      </div>
    </div>
  );
}