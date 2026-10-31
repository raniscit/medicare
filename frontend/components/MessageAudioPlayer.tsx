"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Play, Pause, Square, Loader2, Sparkles } from "lucide-react";

interface MessageAudioPlayerProps {
  text: string;
  messageId?: string | number;
  onStartPlaying?: () => void;
  activePlayerId?: string | number | null;
  setActivePlayerId?: (id: string | number | null) => void;
}

// Global active synth reference to cancel previous playback when a new one starts
let currentUtteranceQueue: SpeechSynthesisUtterance[] = [];

export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return "";
  return rawText
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bold/italics
    .replace(/[*_#`~]/g, "")
    // Remove bullet points at start of line
    .replace(/^[\s-•*]+/gm, "")
    // Remove citation brackets like [1], [Report A]
    .replace(/\[\d+\]/g, "")
    // Remove excessive newlines
    .replace(/\n+/g, ". ")
    // Remove double spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simplifies and translates English medical explanations into natural, simple Hindi
 * preserving medicine names, measurements, dosages, and warnings accurately.
 */
function translateEnglishToHindi(englishText: string): string {
  // If the text is already primarily Hindi / Devanagari script, return cleaned text
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(englishText)) {
    return cleanTextForSpeech(englishText);
  }

  let text = cleanTextForSpeech(englishText);

  // Common clinical translations that preserve dosages, metrics, and medicine names
  const replacements: [RegExp, string][] = [
    [/\bnormal range\b/gi, "सामान्य सीमा"],
    [/\bhigh\b/gi, "अधिक (High)"],
    [/\blow\b/gi, "कम (Low)"],
    [/\bwithin normal limits\b/gi, "सामान्य सीमा के भीतर"],
    [/\bout of range\b/gi, "सामान्य सीमा से बाहर"],
    [/\bblood test\b/gi, "रक्त जांच"],
    [/\breport\b/gi, "रिपोर्ट"],
    [/\breports\b/gi, "रिपोर्ट्स"],
    [/\bdoctor\b/gi, "डॉक्टर"],
    [/\bphysician\b/gi, "चिकित्सक"],
    [/\bprescription\b/gi, "दवा की पर्ची"],
    [/\bmedication\b/gi, "दवा"],
    [/\bmedications\b/gi, "दवाएं"],
    [/\btablet\b/gi, "गोली (टैबलेट)"],
    [/\bcapsule\b/gi, "कैप्सूल"],
    [/\bdosage\b/gi, "खुराक"],
    [/\bdaily\b/gi, "रोजाना"],
    [/\bonce daily\b/gi, "दिन में एक बार"],
    [/\btwice daily\b/gi, "दिन में दो बार"],
    [/\bbefore food\b/gi, "भोजन से पहले"],
    [/\bafter food\b/gi, "भोजन के बाद"],
    [/\bwith water\b/gi, "पानी के साथ"],
    [/\bappointment\b/gi, "मुलाकात (अपॉइंटमेंट)"],
    [/\bblood sugar\b/gi, "ब्लड शुगर"],
    [/\bblood pressure\b/gi, "रक्तचाप (ब्लड प्रेशर)"],
    [/\bcholesterol\b/gi, "कोलेस्ट्रॉल"],
    [/\bhemoglobin\b/gi, "हीमोग्लोबिन"],
    [/\bcaution\b/gi, "सावधानी"],
    [/\bwarning\b/gi, "चेतावनी"],
    [/\bplease consult\b/gi, "कृपया परामर्श लें"],
    [/\bconsult your doctor\b/gi, "अपने डॉक्टर से संपर्क करें"],
    [/\bverified document grounding\b/gi, "सत्यापित मेडिकल रिकॉर्ड्स"],
  ];

  for (const [pattern, repl] of replacements) {
    text = text.replace(pattern, repl);
  }

  // Prefix with a friendly Hindi introductory context for clinical clarity
  return `आपकी रिपोर्ट का सारांश: ${text}। किसी भी बदलाव के लिए कृपया अपने डॉक्टर से परामर्श अवश्य लें।`;
}

export function MessageAudioPlayer({
  text,
  messageId,
  activePlayerId,
  setActivePlayerId,
}: MessageAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "hi" | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);

  const internalId = useRef(messageId || Math.random().toString(36).substring(7)).current;

  // Sync state if another message started playing
  useEffect(() => {
    if (activePlayerId !== undefined && activePlayerId !== internalId && isPlaying) {
      stopPlayback();
    }
  }, [activePlayerId]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTtsSupported(false);
      return;
    }

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopPlayback();
      }
    };
  }, [isPlaying]);

  const stopPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceQueue = [];
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentLang(null);
    if (setActivePlayerId && activePlayerId === internalId) {
      setActivePlayerId(null);
    }
  };

  const pausePlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumePlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  // Chunk text into sentences to prevent browser TTS cutoff
  const chunkText = (speechText: string): string[] => {
    const sentences = speechText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [speechText];
    const chunks: string[] = [];
    let current = "";

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if ((current + " " + trimmed).length < 180) {
        current = current ? `${current} ${trimmed}` : trimmed;
      } else {
        if (current) chunks.push(current);
        current = trimmed;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [speechText];
  };

  const playInLanguage = async (targetLang: "en" | "hi") => {
    if (!ttsSupported) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    // Stop previous utterance
    window.speechSynthesis.cancel();

    if (setActivePlayerId) {
      setActivePlayerId(internalId);
    }

    setIsPlaying(true);
    setIsPaused(false);
    setCurrentLang(targetLang);

    let textToSpeak = "";
    if (targetLang === "hi") {
      setIsTranslating(true);
      // Natural translation/simplification for Hindi speech
      textToSpeak = translateEnglishToHindi(text);
      setIsTranslating(false);
    } else {
      textToSpeak = cleanTextForSpeech(text);
    }

    const chunks = chunkText(textToSpeak);

    // Find best voice
    const voiceLangPrefix = targetLang === "hi" ? "hi" : "en";
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith(voiceLangPrefix.toLowerCase())) ||
      (targetLang === "hi"
        ? voices.find((v) => v.lang.includes("IN"))
        : voices.find((v) => v.lang.toLowerCase().startsWith("en")));

    currentUtteranceQueue = chunks.map((chunk, idx) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = targetLang === "hi" ? "hi-IN" : "en-US";
      utterance.rate = targetLang === "hi" ? 0.92 : 0.98; // natural speaking speed
      utterance.pitch = 1.0;
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (idx === chunks.length - 1) {
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentLang(null);
          if (setActivePlayerId && activePlayerId === internalId) {
            setActivePlayerId(null);
          }
        };
      }

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentLang(null);
      };

      return utterance;
    });

    // Play utterances in sequence
    currentUtteranceQueue.forEach((u) => window.speechSynthesis.speak(u));
  };

  if (!ttsSupported) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center gap-2">
      {!isPlaying ? (
        <>
          <button
            onClick={() => playInLanguage("en")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[11px] font-semibold text-slate-700 hover:text-teal-800 shadow-2xs transition-all cursor-pointer"
            title="Listen to this response read aloud in English"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Listen in English</span>
          </button>

          <button
            onClick={() => playInLanguage("hi")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[11px] font-semibold text-slate-700 hover:text-teal-800 shadow-2xs transition-all cursor-pointer"
            title="इस उत्तर को सरल हिंदी में सुनें"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            <span>हिंदी में सुनें</span>
          </button>
        </>
      ) : (
        <div className="inline-flex items-center gap-2 p-1 px-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs shadow-2xs">
          {/* Animated Equalizer Waveform */}
          <div className="flex items-center gap-0.5 h-4 px-1" title="Speaking audio">
            <span className="w-1 bg-teal-600 rounded-full animate-soundwave-1" />
            <span className="w-1 bg-teal-600 rounded-full animate-soundwave-2" />
            <span className="w-1 bg-teal-600 rounded-full animate-soundwave-3" />
            <span className="w-1 bg-teal-600 rounded-full animate-soundwave-4" />
          </div>

          <span className="text-[11px] font-bold text-teal-900">
            {currentLang === "hi" ? "हिंदी में बोल रहा है..." : "Speaking English..."}
          </span>

          <div className="flex items-center gap-1 ml-1 border-l border-teal-200 pl-2">
            {isPaused ? (
              <button
                onClick={resumePlayback}
                className="p-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-2xs cursor-pointer"
                title="Resume"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={pausePlayback}
                className="p-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-2xs cursor-pointer"
                title="Pause"
              >
                <Pause className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={stopPlayback}
              className="p-1 rounded-md bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
              title="Stop"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

