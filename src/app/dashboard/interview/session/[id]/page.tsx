"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type Evaluation = {
  overall_score: number;
  ai_feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggested_answer: string;
  improvement_tips: string[];
};

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);

  // Recording state
  const [recState, setRecState] = useState<"idle" | "recording" | "processing">("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [transcription, setTranscription] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch(`/api/interview/${id}/questions`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions || []); setLoading(false); });
  }, [id]);

  const currentQ = questions[current];
  const currentEval = currentQ ? evaluations[currentQ.id] : null;

  useEffect(() => {
    setAnswer("");
    setSubmitError("");
    setTranscription("");
  }, [current]);

  // Timer
  useEffect(() => {
    if (recState === "recording") {
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recState !== "recording") setRecSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function startRecording() {
    setSubmitError("");
    setTranscription("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Prefer webm/opus, fall back to whatever browser supports
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find(t => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) {
          setSubmitError("No audio captured. Please try again.");
          setRecState("idle");
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size < 1000) {
          setSubmitError("Recording too short. Please speak for at least 2 seconds.");
          setRecState("idle");
          return;
        }

        await uploadAudio(blob, recorder.mimeType || "audio/webm");
      };

      recorder.start(250); // Collect data every 250ms
      setRecState("recording");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setSubmitError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setSubmitError("No microphone found. Please connect a microphone and try again.");
      } else {
        setSubmitError(`Microphone error: ${err.message}`);
      }
      setRecState("idle");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecState("processing");
    }
  }

  async function uploadAudio(blob: Blob, mimeType: string) {
    if (!currentQ) return;
    setSubmitting(true);

    try {
      const ext = mimeType.includes("ogg") ? ".ogg" :
                  mimeType.includes("mp4") ? ".mp4" : ".webm";
      const file = new File([blob], `recording${ext}`, { type: mimeType });

      const fd = new FormData();
      fd.append("audio", file);
      fd.append("session_id", id);
      fd.append("question_id", currentQ.id);

      const res = await fetch("/api/answer/audio", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Audio submission failed");
        setRecState("idle");
      } else {
        if (data.transcription) setTranscription(data.transcription);
        setEvaluations(prev => ({ ...prev, [currentQ.id]: data.evaluation }));
        setRecState("idle");
      }
    } catch (err: any) {
      setSubmitError(`Upload failed: ${err.message}`);
      setRecState("idle");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTextAnswer() {
    if (!answer.trim() || !currentQ || submitting) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/answer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: id, question_id: currentQ.id, answer_text: answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed");
      } else {
        setEvaluations(prev => ({ ...prev, [currentQ.id]: data.evaluation }));
      }
    } catch (err: any) {
      setSubmitError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (current < questions.length - 1) setCurrent(c => c + 1);
    else router.push(`/dashboard/interview/results/${id}`);
  }

  const scoreColor = (s: number) => s >= 70 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p className="text-gray-400">Loading questions...</p>
      </div>
    </div>
  );

  if (!questions.length) return (
    <div className="text-center py-20 text-gray-400">No questions found for this session.</div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span className="capitalize">{currentQ?.question_type?.replace("_", " ")}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card">
        {currentQ?.skill_tags && (() => {
          try {
            return JSON.parse(currentQ.skill_tags).map((t: string) => (
              <span key={t} className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 mr-1.5 mb-3 inline-block">{t}</span>
            ));
          } catch { return null; }
        })()}
        <h2 className="text-lg font-semibold leading-relaxed">{currentQ?.question_text}</h2>
      </div>

      {/* Evaluation result */}
      {currentEval ? (
        <div className="card border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-green-400 flex items-center gap-2">
              ✅ Evaluated
            </span>
            <span className={`text-3xl font-bold ${scoreColor(currentEval.overall_score)}`}>
              {Math.round(currentEval.overall_score)}%
            </span>
          </div>

          {transcription && (
            <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3 text-xs text-gray-400">
              <span className="text-gray-500">Transcribed: </span>{transcription}
            </div>
          )}

          <p className="text-sm text-gray-300 mb-3">{currentEval.ai_feedback}</p>

          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              {currentEval.strengths?.slice(0, 2).map((s, i) => (
                <div key={i} className="text-green-400 mb-1">✓ {s}</div>
              ))}
            </div>
            <div>
              {currentEval.weaknesses?.slice(0, 2).map((w, i) => (
                <div key={i} className="text-red-400 mb-1">→ {w}</div>
              ))}
            </div>
          </div>

          {currentEval.suggested_answer && (
            <details className="text-xs mt-2">
              <summary className="text-blue-400 cursor-pointer mb-1 select-none">💡 Model Answer</summary>
              <p className="text-gray-400 leading-relaxed mt-2 border-l-2 border-blue-500/30 pl-3">
                {currentEval.suggested_answer}
              </p>
            </details>
          )}

          <button onClick={goNext} className="btn-primary mt-4 w-full">
            {current < questions.length - 1 ? "Next Question →" : "View Results →"}
          </button>
        </div>
      ) : (
        /* Answer input */
        <div className="card space-y-4">
          {/* Error display */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Recording UI */}
          <div className="border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">🎙️ Voice Answer</span>
              {recState === "idle" && (
                <span className="text-xs text-gray-500">Requires microphone + OpenAI key</span>
              )}
              {recState === "recording" && (
                <span className="text-xs text-red-400 font-medium animate-pulse">● REC {recSeconds}s</span>
              )}
              {recState === "processing" && (
                <span className="text-xs text-yellow-400">Transcribing...</span>
              )}
            </div>

            {recState === "idle" && (
              <button
                onClick={startRecording}
                disabled={submitting}
                className="w-full py-3 rounded-lg border border-gray-600 hover:border-blue-500 hover:bg-blue-500/5 text-gray-300 hover:text-blue-400 transition-all text-sm font-medium disabled:opacity-50"
              >
                🎙️ Start Recording
              </button>
            )}

            {recState === "recording" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center py-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${12 + Math.sin(i * 0.8) * 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={stopRecording}
                  className="w-full py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                >
                  ⏹ Stop Recording ({recSeconds}s)
                </button>
              </div>
            )}

            {recState === "processing" && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-yellow-400">Converting and transcribing audio...</p>
                <p className="text-xs text-gray-500 mt-1">This may take 10–20 seconds</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex-1 h-px bg-gray-800" />
            OR TYPE YOUR ANSWER
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Text answer */}
          <div>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={5}
              disabled={submitting || recState !== "idle"}
              placeholder="Type your answer here... be specific, use examples from your experience."
              className="input resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-600">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={submitTextAnswer}
              disabled={!answer.trim() || submitting || recState !== "idle"}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Evaluating with AI...
                </span>
              ) : "Submit Answer"}
            </button>
            <button
              onClick={goNext}
              disabled={submitting || recState !== "idle"}
              className="btn-ghost"
            >
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* Question nav dots */}
      <div className="flex gap-1.5 flex-wrap pt-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => { if (recState === "idle" && !submitting) setCurrent(i); }}
            title={`Question ${i + 1}`}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              i === current
                ? "bg-blue-500 text-white"
                : evaluations[q.id]
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}