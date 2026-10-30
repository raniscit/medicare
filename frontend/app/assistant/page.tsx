"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  FileText,
  ShieldAlert,
  Languages,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface SourceCitation {
  document_id?: number;
  document_name: string;
  document_type?: string;
  report_date?: string;
  page_number?: number;
  excerpt?: string;
  snippet?: string;
}

interface ChatMessage {
  id?: number;
  sender: "USER" | "ASSISTANT";
  role?: string;
  message: string;
  content?: string;
  source_citations?: SourceCitation[];
  sources_json?: SourceCitation[];
  created_at?: string;
}

const SUGGESTED_QUESTIONS = [
  "What does my latest blood report indicate?",
  "Why is my hemoglobin below the reference range?",
  "What precautions are mentioned in my discharge summary?",
  "When is my next doctor appointment?",
  "What medicines have been prescribed to me?",
  "How has my HbA1c changed over the last six months?",
  "Explain my thyroid report in simple language.",
];

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialQuery);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Load chat sessions
  const loadSessions = async () => {

    setLoading(true);
    try {
      const list = await api.getChatSessions();
      setSessions(list || []);
      if (list && list.length > 0 && !currentSessionId) {
        setCurrentSessionId(list[0].id);
        loadSessionMessages(list[0].id);
      } else if (!list || list.length === 0) {
        // Create initial default session
        handleNewSession();
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const history = await api.getSessionMessages(sessionId);
      const formatted = (history || []).map((m: any) => ({
        id: m.id,
        sender: (m.role === "assistant" ? "ASSISTANT" : "USER") as "USER" | "ASSISTANT",
        role: m.role,
        message: m.content || m.message || "",
        source_citations: m.sources_json || m.source_citations || [],
        created_at: m.created_at,
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    loadSessionMessages(sessionId);
  };

  const handleNewSession = async () => {
    try {
      const newSession = await api.createChatSession("New Conversation", language);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([
        {
          sender: "ASSISTANT",
          message:
            language === "hi"
              ? "नमस्ते! मैं आपका मेडिकेयर एआई सहायक हूँ। अपनी मेडिकल रिपोर्ट, दवाओं या स्वास्थ्य के बारे में कोई भी प्रश्न पूछें।"
              : "Hello! I am your MediCare AI Health Assistant. Ask me anything about your uploaded medical documents, lab tests, medications, or health trends.",
        },
      ]);
    } catch (err: any) {
      console.warn("Failed to create chat session:", err);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          handleNewSession();
        }
      }
    } catch (err: any) {
      alert("Failed to delete session: " + err.message);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      sender: "USER",
      message: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSending(true);

    try {
      const res = await api.sendChatQuery({
        message: textToSend.trim(),
        session_id: currentSessionId || undefined,
        language: language,
      });

      if (!currentSessionId && res.session_id) {
        setCurrentSessionId(res.session_id);
      }

      const answerText = res.answer || res.message?.content || res.content || "Information retrieved.";
      const citations = res.citations || res.sources || res.message?.sources_json || [];

      const botMsg: ChatMessage = {
        sender: "ASSISTANT",
        message: answerText,
        source_citations: citations,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Refresh sessions to get updated title
      const updatedSessions = await api.getChatSessions();
      setSessions(updatedSessions || []);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        sender: "ASSISTANT",
        message: err.message
          ? `Error: ${err.message}`
          : "I encountered an error retrieving your records. Please ensure your query is clear or check the server status.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:px-6 sm:py-4 rounded-2xl border border-slate-200 shadow-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Interactive AI Health Assistant
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Feature 7 (RAG)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grounding answers directly in your uploaded laboratory reports, prescriptions & history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${language === "en" ? "bg-white text-teal-800 shadow-xs font-bold" : "text-slate-600"
                  }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${language === "hi" ? "bg-white text-teal-800 shadow-xs font-bold" : "text-slate-600"
                  }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>

            <button
              onClick={handleNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between text-xs text-teal-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              <strong>Clinical Guardrail: </strong>
              MediCare AI provides informational summaries from your medical records and does not diagnose diseases or prescribe treatment.
            </span>
          </div>
          <span className="text-[11px] font-bold text-teal-700 hidden md:inline">
            Gemini API + Semantic RAG Retrieval
          </span>
        </div>

        {/* Chat Main Container */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat Sessions Sidebar (Desktop) */}
          <div className="hidden lg:flex flex-col w-64 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 overflow-hidden">
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Conversations
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{sessions.length} chats</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`group w-full p-2.5 rounded-xl text-xs text-left flex items-center justify-between cursor-pointer transition-all ${currentSessionId === sess.id
                      ? "bg-teal-50/80 border border-teal-200 text-teal-900 font-bold"
                      : "text-slate-700 hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-teal-600" />
                    <span className="truncate">{sess.title || "Health Chat"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages and Input Pane */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      How can I help with your health records?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Ask me about any uploaded report, blood biomarker, prescription instructions, or doctor advice.
                    </p>
                  </div>

                  {/* Suggested Questions Grid */}
                  <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-xs text-slate-700 font-medium transition-all flex items-start gap-2"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.sender === "USER" || msg.role === "user";
                  const text = msg.message || msg.content || "";
                  const citations = msg.source_citations || msg.sources_json || [];

                  return (
                    <div
                      key={index}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${isUser
                            ? "bg-teal-700 text-white rounded-tr-none shadow-xs"
                            : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none"
                          }`}
                      >
                        <div className="whitespace-pre-wrap font-medium">{text}</div>

                        {/* Citations / Sources for Assistant Responses */}
                        {!isUser && citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                              Source Citations ({citations.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {citations.map((c: any, ci: number) => (
                                <div
                                  key={ci}
                                  className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-700 shadow-2xs font-semibold"
                                  title={c.excerpt || c.snippet || ""}
                                >
                                  <FileText className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                  <span>{c.document_name}</span>
                                  {c.report_date && (
                                    <span className="text-slate-400 font-normal">({c.report_date})</span>
                                  )}
                                  {c.page_number && (
                                    <span className="text-teal-700 font-mono text-[10px]">p.{c.page_number}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing your medical records with Gemini AI...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Chips Bar when in active chat */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">
                  Quick prompts:
                </span>
                {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 text-[11px] text-slate-600 hover:text-teal-700 border border-slate-200 flex-shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    language === "hi"
                      ? "अपनी मेडिकल रिपोर्ट या दवाओं के बारे में पूछें..."
                      : "Ask about your medical reports, test results, or medications..."
                  }
                  className="flex-1 text-xs rounded-xl border border-slate-300 px-4 py-3 bg-white text-slate-800 focus:outline-teal-600 placeholder:text-slate-400 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading AI Assistant...</p>
          </div>
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
