export interface ConfidenceAnalysis {
  score: number; // 0-100
  pace_wpm: number;
  filler_count: number;
  filler_words: string[];
  hesitation_count: number;
  avg_sentence_length: number;
  feedback: string;
  traits: {
    label: string;
    positive: boolean;
  }[];
}

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "basically", "actually",
  "literally", "right", "so", "well", "kind of", "sort of",
  "i mean", "hmm", "err", "ah",
];

const HESITATION_PATTERNS = [
  /\.\.\./g,
  /i (don't|don't) know/gi,
  /not sure/gi,
  /i think maybe/gi,
  /i guess/gi,
  /perhaps maybe/gi,
];

export function analyzeConfidence(
  transcription: string,
  durationSeconds: number
): ConfidenceAnalysis {
  if (!transcription || !transcription.trim()) {
    return {
      score: 0,
      pace_wpm: 0,
      filler_count: 0,
      filler_words: [],
      hesitation_count: 0,
      avg_sentence_length: 0,
      feedback: "No speech detected.",
      traits: [{ label: "No answer provided", positive: false }],
    };
  }

  const lower = transcription.toLowerCase();
  const words = transcription.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Words per minute
  const minutes = Math.max(durationSeconds / 60, 0.1);
  const pace_wpm = Math.round(wordCount / minutes);

  // Filler word detection
  const foundFillers: string[] = [];
  let fillerCount = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      foundFillers.push(filler);
      fillerCount += matches.length;
    }
  }

  // Hesitation detection
  let hesitationCount = 0;
  for (const pattern of HESITATION_PATTERNS) {
    const matches = transcription.match(pattern);
    if (matches) hesitationCount += matches.length;
  }

  // Sentence analysis
  const sentences = transcription.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgSentenceLength =
    sentences.length > 0
      ? Math.round(wordCount / sentences.length)
      : wordCount;

  // Score calculation (0-100)
  let score = 70; 

  // Pace scoring (ideal: 120-160 wpm)
  if (pace_wpm >= 120 && pace_wpm <= 160) score += 10;
  else if (pace_wpm < 80 || pace_wpm > 200) score -= 15;
  else if (pace_wpm < 100 || pace_wpm > 180) score -= 5;

  // Filler penalty
  const fillerRate = fillerCount / Math.max(wordCount, 1);
  if (fillerRate > 0.1) score -= 20;
  else if (fillerRate > 0.05) score -= 10;
  else if (fillerRate < 0.02) score += 10;

  // Hesitation penalty
  score -= Math.min(hesitationCount * 5, 20);

  // Length bonus (longer = more confident)
  if (wordCount >= 80) score += 10;
  else if (wordCount < 20) score -= 15;

  // Sentence structure
  if (avgSentenceLength >= 10 && avgSentenceLength <= 25) score += 5;

  score = Math.max(0, Math.min(100, score));

  // Traits
  const traits: { label: string; positive: boolean }[] = [];

  if (pace_wpm >= 120 && pace_wpm <= 160)
    traits.push({ label: "Good speaking pace", positive: true });
  else if (pace_wpm < 100)
    traits.push({ label: "Speaking too slowly", positive: false });
  else if (pace_wpm > 180)
    traits.push({ label: "Speaking too fast", positive: false });

  if (fillerCount === 0)
    traits.push({ label: "No filler words", positive: true });
  else if (fillerCount <= 2)
    traits.push({ label: "Minimal filler words", positive: true });
  else
    traits.push({ label: `${fillerCount} filler words used`, positive: false });

  if (hesitationCount === 0)
    traits.push({ label: "Spoke with confidence", positive: true });
  else
    traits.push({ label: "Some hesitation detected", positive: false });

  if (wordCount >= 80)
    traits.push({ label: "Detailed and thorough answer", positive: true });
  else if (wordCount < 30)
    traits.push({ label: "Answer was too brief", positive: false });

  if (avgSentenceLength >= 10 && avgSentenceLength <= 25)
    traits.push({ label: "Clear sentence structure", positive: true });

  // Feedback
  const feedbackParts: string[] = [];
  if (pace_wpm < 100) feedbackParts.push("Try speaking a bit faster to sound more confident.");
  if (pace_wpm > 180) feedbackParts.push("Slow down slightly for better clarity.");
  if (fillerCount > 3) feedbackParts.push(`Reduce filler words like "${foundFillers.slice(0, 2).join('", "')}".`);
  if (hesitationCount > 1) feedbackParts.push("Practice answering questions to reduce hesitation.");
  if (wordCount < 30) feedbackParts.push("Provide more detailed answers.");
  if (score >= 75) feedbackParts.push("Overall confident delivery.");

  const feedback =
    feedbackParts.length > 0
      ? feedbackParts.join(" ")
      : "Good vocal confidence. Keep practicing!";

  return {
    score,
    pace_wpm,
    filler_count: fillerCount,
    filler_words: foundFillers,
    hesitation_count: hesitationCount,
    avg_sentence_length: avgSentenceLength,
    feedback,
    traits,
  };
}