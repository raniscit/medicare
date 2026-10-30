"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Building,
  Info
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, getStatusStyle } from "@/lib/utils";

export default function ReportAnalysisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get("id");

  const [document, setDocument] = useState<any>(null);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"simple" | "medical">("simple");
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const docs = await api.getDocuments();
        setDocumentsList(docs || []);

        let targetId = documentId ? parseInt(documentId) : (docs?.[0]?.id || null);
        if (targetId) {
          const detail = await api.getDocument(targetId);
          setDocument(detail);
        }
      } catch (err) {
        console.error("Failed to load report analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [documentId]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/report-analysis?id=${newId}`);
  };

  const abnormalParams = (document?.parameters || []).filter(
    (p: any) => p.status === "LOW" || p.status === "HIGH" || p.status === "ABNORMAL"
  );
  const normalParams = (document?.parameters || []).filter(
    (p: any) => p.status === "NORMAL"
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation & Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  AI Report Analyzer
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Feature 1 & 2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-mode clinical explanation and biomarker parameter breakdown
              </p>
            </div>
          </div>

          {/* Report Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Select Report:
            </label>
            <select
              value={document?.id || ""}
              onChange={handleDocumentChange}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 font-semibold focus:outline-teal-600"
            >
              {documentsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_name} ({d.report_date || formatDate(d.upload_date)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-xs text-slate-500">Analyzing medical report...</p>
          </div>
        ) : !document ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-slate-800">No report selected</h3>
            <p className="text-xs text-slate-500 mt-1">Please select a medical report or upload one to view analysis.</p>
          </div>
        ) : (
          <>
            {/* Document Header Card & View Mode Switcher */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {document.document_type}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                  {document.original_name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {document.laboratory_name || "Diagnostic Laboratory"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Report Date: {document.report_date || formatDate(document.upload_date)}
                  </span>
                </div>
              </div>

              {/* View Mode Toggle & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setViewMode("simple")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === "simple"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Simple View
                  </button>
                  <button
                    onClick={() => setViewMode("medical")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === "medical"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Medical View
                  </button>
                </div>

                <a
                  href={api.downloadSummaryUrl(document.id, viewMode)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* AI Summary View Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {viewMode === "simple" ? "AI Patient Summary (Easy Language)" : "Clinical Laboratory Summary (Medical Terminology)"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {viewMode === "simple"
                        ? "Simplified explanations for everyday patient understanding"
                        : "Preserved clinical terminology and numerical metrics for physicians"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/assistant?q=${encodeURIComponent(`Explain this report: ${document.original_name}`)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/80 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI about this report</span>
                </Link>
              </div>

              {viewMode === "simple" ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-800 leading-relaxed font-medium">
                    {document.summary?.simple_summary || "Summary generated successfully."}
                  </div>

                  {document.summary?.important_findings?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Key Takeaways for You:
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {document.summary.important_findings.map((finding: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {document.summary?.medical_summary || "Clinical summary available."}
                </div>
              )}
            </div>

            {/* Abnormal Parameters Highlights */}
            {abnormalParams.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Values Outside Reference Limits ({abnormalParams.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    — Clear visual highlights with simple explanations
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {abnormalParams.map((p: any) => {
                    const style = getStatusStyle(p.status);
                    return (
                      <div
                        key={p.id}
                        className={`p-5 rounded-2xl border ${style.border} ${style.bg} shadow-xs flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-900">{p.parameter_name}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${style.badge}`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                              {p.numeric_value} {p.unit}
                            </span>
                            <span className="text-xs text-slate-500">
                              (Normal: {p.reference_range})
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {p.simple_explanation || "Value is outside standard adult laboratory limits. Discuss with your doctor to assess clinical significance."}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{p.clinical_context || "Physiological Biomarker"}</span>
                          <span className="font-semibold text-slate-700">Lab Reference Preserved</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Normal Parameters Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Normal Reference Parameters ({normalParams.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Within designated healthy ranges</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {normalParams.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.parameter_name}</p>
                      <p className="text-[11px] text-slate-500">Ref: {p.reference_range}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900">
                        {p.numeric_value} {p.unit}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Normal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations, Follow-up & Precautions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Recommendations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-600" />
                  <span>Doctor&apos;s Advice & Follow-Up</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(document.summary?.doctor_recommendations || []).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                  {(document.summary?.follow_up_instructions || []).map((inst: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Precautions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Important Precautions</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(document.summary?.precautions || []).map((prec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{prec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Original Document Extracted Text Dropdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-teal-700"
              >
                <span>View Extracted Source Text (OCR / PDF Parser)</span>
                <span className="text-[11px] font-semibold text-teal-600">
                  {showRawText ? "Hide Source Text" : "Show Full Text"}
                </span>
              </button>

              {showRawText && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {document.raw_text || "No raw text available."}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

