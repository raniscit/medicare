"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  Pill,
  Bell,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
  HelpCircle,
  Lock,
  ChevronDown,
  Upload
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { loginAsDemo, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does MediCare AI diagnose medical conditions?",
      a: "No. MediCare AI explains clinical terms, reference ranges, and numerical trends in simple everyday language. It does not diagnose diseases or prescribe treatments. All insights are designed to help you have better, more informed conversations with your licensed healthcare provider.",
    },
    {
      q: "What types of medical reports can I upload?",
      a: "You can upload Blood Test Reports, Complete Blood Counts (CBC), Lipid Profiles, Liver Function Tests (LFT), Kidney Function Tests (KFT), Thyroid Profiles, Urine Reports, Hospital Discharge Summaries, and Medical Prescriptions in PDF, PNG, JPG, and JPEG formats.",
    },
    {
      q: "How does the Historical Health Tracking work?",
      a: "Whenever you upload a new lab report, MediCare AI automatically detects key health parameters (like HbA1c, Hemoglobin, Fasting Glucose, Cholesterol) and plots them chronologically. You can select any two reports to see the exact numerical change, percentage difference, and trend direction.",
    },
    {
      q: "Can my family members or caregivers see my records?",
      a: "Only if you explicitly invite them. You have 100% granular control to choose whether a caregiver can view lab reports, see medication schedules, or receive emergency reminder alerts. You can revoke access anytime with one click.",
    },
    {
      q: "Is my medical data secure and private?",
      a: "Yes. MediCare AI applies strict patient-level data isolation and encryption. Your medical documents, extracted health parameters, and AI conversation histories are completely isolated to your personal account.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                MediCare <span className="text-teal-600">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Healthcare SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loginAsDemo()}
              disabled={isLoading}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Explore Demo Account</span>
            </button>
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-teal-50/40 via-[#F8FAFC] to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 text-teal-800 text-xs font-bold mb-6 border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>AI-Powered Personal Health Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Your Health Records, <br className="hidden sm:inline" />
            <span className="text-teal-700">Finally Made Understandable.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Understand medical reports, track your health progress, manage medications, and stay connected with your loved ones – all in one intelligent healthcare assistant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => loginAsDemo()}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Try Demo Patient Profile (1-Click)</span>
            </button>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Upload Medical Report</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> End-to-End Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Multi-Year Trend Charts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> RAG Assistant in English & Hindi
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Granular Caregiver Controls
            </span>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="max-w-5xl mx-auto px-4 mt-12">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-mono ml-2">
                  medicare.ai/dashboard — Alex Johnson (45, Male)
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Live Interactive System
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50">
              {/* Card 1 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter Tracker</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">Elevated</span>
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">HbA1c: 6.9 %</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Decreased from 8.5% (Jan 2026) to 6.9% (Oct 2026).
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-600">
                  <span>Down 1.6% (Positive Trend)</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Simplification</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Normalized</span>
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">Hemoglobin: 12.5 g/dL</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Reference: 12.0 - 16.0 g/dL. Within standard healthy range.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Optimal Oxygen Transport</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Medication</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800">Scheduled</span>
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">Metformin 500mg</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Take with water after dinner. Prescribed for glycemic balance.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Evening Dose</span>
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Core Features Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-2">
              Comprehensive Health Management
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Seven Integrated Pillars of Modern Healthcare
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Engineered end-to-end to empower patients, caregivers, and families with clarity and peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Medical Report Simplification</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Transforms complex numerical reports, reference ranges, and clinical jargon into clear everyday language. Highlights abnormal parameters without making autonomous diagnoses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. AI-Powered Medical Summaries</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Automatically synthesizes important findings, doctor recommendations, precautions, and follow-ups. Provides a Medical View for clinicians and a Simple View for patients.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. Medication & Precaution Care</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Extracts dosages, meal timings, durations, and dietary precautions from prescriptions. Track taken and missed doses with a dedicated medication adherence dashboard.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">4. Smart Reminders & Follow-ups</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Detects follow-up consultations and repeats in medical records. Automatically stages reminders and asks the patient to confirm dates before activating notifications.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">5. Health Tracking & 2-Report Comparison</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Interactive charts for HbA1c, Fasting Glucose, Hemoglobin, Cholesterol, and Creatinine. Select any two reports to view deltas, % changes, and responsible AI insights.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">6. Family & Caregiver Integration</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Invite trusted family members via email. Grant granular permissions to view medication schedules or receive alert notifications. Revoke access instantly whenever needed.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all group lg:col-span-3">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900">7. Context-Aware RAG AI Health Assistant</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Chat with an intelligent assistant that understands your entire uploaded medical history. Answers in simple English or Hindi (हिंदी) with direct source document citations. Strictly adheres to clinical guardrails against independent disease diagnosis.
                  </p>
                </div>
                <button
                  onClick={() => loginAsDemo()}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <span>Test AI Assistant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-2">
              Intuitive Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">How MediCare AI Works</h2>
            <p className="mt-2 text-slate-600 text-sm">
              Four seamless steps from confusing paperwork to actionable health peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center mb-4">
                01
              </span>
              <h4 className="font-bold text-base text-slate-900">Upload Reports</h4>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Upload your blood test, discharge summary, or prescription as a PDF or photo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center mb-4">
                02
              </span>
              <h4 className="font-bold text-base text-slate-900">OCR & Extraction</h4>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Our pipeline extracts biomarkers, laboratory reference ranges, medications, and dates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center mb-4">
                03
              </span>
              <h4 className="font-bold text-base text-slate-900">Trend Comparison</h4>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Biomarkers are compared with prior measurements to reveal multi-month physiological trends.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center mb-4">
                04
              </span>
              <h4 className="font-bold text-base text-slate-900">Action & Care</h4>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Confirm extracted reminders, track daily medicine doses, and involve family caregivers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Banner */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-teal-900 text-white rounded-3xl p-8 sm:p-12 shadow-elevated flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-800/80 text-teal-300 flex items-center justify-center flex-shrink-0">
              <Lock className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold">Privacy-by-Design & Data Isolation</h3>
              <p className="mt-2 text-teal-100 text-xs sm:text-sm leading-relaxed">
                Your health data is strictly isolated. We never cross-share medical histories or vector embeddings between patients. All AI summaries and reminders preserve original laboratory units and respect medical non-diagnostic boundaries.
              </p>
            </div>
            <button
              onClick={() => loginAsDemo()}
              className="px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs transition-colors flex-shrink-0"
            >
              Experience Platform
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-2">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Everything You Need to Know</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:text-teal-700"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900">MediCare AI</span>
              <p className="text-[11px] text-slate-500">
                AI-Powered Personal Health Intelligence Platform
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-xs text-slate-500">
            <p>© 2026 MediCare AI Inc. All rights reserved.</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-md">
              Disclaimer: MediCare AI is designed for informational and organizational purposes only. It is not intended to replace professional medical diagnosis, advice, or treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

