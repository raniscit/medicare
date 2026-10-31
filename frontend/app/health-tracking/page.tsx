"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Activity,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Scale,
  Clock,
  CheckCircle2,
  ChevronRight,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, getStatusStyle } from "@/lib/utils";

export default function HealthTrackingPage() {
  const [selectedParam, setSelectedParam] = useState("HbA1c");
  const [trendData, setTrendData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // 2-Report Comparison States
  const [report1Id, setReport1Id] = useState<number | null>(null);
  const [report2Id, setReport2Id] = useState<number | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [loading, setLoading] = useState(true);

  const trackedParameters = [
    { name: "HbA1c", label: "HbA1c (Average Blood Sugar)", unit: "%" },
    { name: "Fasting Blood Glucose", label: "Fasting Blood Glucose", unit: "mg/dL" },
    { name: "Hemoglobin", label: "Hemoglobin", unit: "g/dL" },
    { name: "Total Cholesterol", label: "Total Cholesterol", unit: "mg/dL" },
    { name: "Serum Creatinine", label: "Serum Creatinine (Kidney)", unit: "mg/dL" },
    { name: "TSH", label: "Thyroid Stimulating Hormone (TSH)", unit: "mIU/L" },
  ];

  // Load trend data for selected parameter
  const loadTrend = async (paramName: string) => {
    try {
      const res = await api.getParameterTrend(paramName);
      setTrendData(res);
    } catch (e) {
      console.error("Error loading trend:", e);
    }
  };

  useEffect(() => {
    loadTrend(selectedParam);
  }, [selectedParam]);

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const [docs, tl] = await Promise.all([
          api.getDocuments(),
          api.getHealthTimeline(),
        ]);
        setDocuments(docs || []);
        setTimeline(tl || []);

        if (docs && docs.length >= 2) {
          // Pre-select earlier and latest
          const r1 = docs[docs.length - 1].id;
          const r2 = docs[0].id;
          setReport1Id(r1);
          setReport2Id(r2);
          runComparison(r1, r2);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const runComparison = async (id1: number, id2: number) => {
    setComparing(true);
    try {
      const res = await api.compareReports(id1, id2);
      setComparison(res);
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  };

  const handleCompareClick = () => {
    if (report1Id && report2Id) {
      runComparison(report1Id, report2Id);
    }
  };

  const chartPoints = (trendData?.data_points || []).map((p: any) => ({
    date: formatDate(p.date),
    value: p.numeric_value,
    status: p.status,
    report: p.report_title,
  }));

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                Health Tracking & Serial Progress
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Biomarker Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-month biomarker trends, direct report comparisons, and clinical timeline
            </p>
          </div>

          {/* Parameter Picker Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Track Parameter:</span>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 focus:outline-teal-600"
            >
              {trackedParameters.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section B: Health Trend Graph */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  {selectedParam} Trajectory
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  ({trendData?.unit || "units"})
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Ref: {trendData?.reference_range || "N/A"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Serial measurements extracted across consecutive diagnostic reports
              </p>
            </div>

            {/* Quick parameter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {trackedParameters.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedParam(p.name)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    selectedParam === p.name
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Area / Line Chart */}
          <div className="h-72 w-full pt-2">
            {chartPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Insufficient historical data recorded for {selectedParam}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paramGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={`${selectedParam} (${trendData?.unit || ""})`}
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#paramGradient)"
                    dot={{ r: 5, fill: "#0F766E" }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Section E: Responsible AI Health Insight Card */}
          {trendData?.ai_insight && (
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  AI Trend Insight
                </h4>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
                  {trendData.ai_insight}
                </p>
                <p className="mt-2 text-[10px] text-slate-500">
                  * Clinical Note: MediCare AI distinguishes numerical trend direction from clinical improvement. Do not alter therapy without your doctor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section C: Two-Report Direct Comparison Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Report Comparison Tool</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select two clinical reports to inspect parameter-by-parameter differences and trends
              </p>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Report A (Earlier):</span>
                <select
                  value={report1Id || ""}
                  onChange={(e) => setReport1Id(parseInt(e.target.value))}
                  className="text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.original_name} ({d.report_date || formatDate(d.upload_date)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Report B (Later):</span>
                <select
                  value={report2Id || ""}
                  onChange={(e) => setReport2Id(parseInt(e.target.value))}
                  className="text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.original_name} ({d.report_date || formatDate(d.upload_date)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompareClick}
                disabled={comparing}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {comparing ? "Comparing..." : "Compare"}
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          {comparison?.comparison_items?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Parameter Name</th>
                    <th className="py-2.5 px-3">
                      Report A ({comparison.report_1_date || "Earlier"})
                    </th>
                    <th className="py-2.5 px-3">
                      Report B ({comparison.report_2_date || "Later"})
                    </th>
                    <th className="py-2.5 px-3">Difference & %</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Reference Range</th>
                    <th className="py-2.5 px-3">Responsible Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.comparison_items.map((item: any, i: number) => {
                    const isDown = item.trend_direction === "DOWN";
                    const isUp = item.trend_direction === "UP";
                    const isIncompatible = item.trend_direction === "INCOMPATIBLE_UNITS";

                    return (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.parameter_name}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {item.previous_value !== null ? (
                            <span>
                              {item.previous_value} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not tested</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.current_value !== null ? (
                            <span>
                              {item.current_value} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not tested</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {item.diff !== null ? (
                            <span
                              className={`font-extrabold ${
                                isDown ? "text-emerald-600" : isUp ? "text-amber-600" : "text-slate-600"
                              }`}
                            >
                              {item.diff > 0 ? `+${item.diff}` : item.diff} {item.unit}{" "}
                              {item.percentage_change !== null && (
                                <span className="text-[11px] font-normal text-slate-500">
                                  ({item.percentage_change > 0 ? `+${item.percentage_change}` : item.percentage_change}%)
                                </span>
                              )}
                            </span>
                          ) : isIncompatible ? (
                            <span className="text-rose-600 font-bold text-[10px]">Incompatible Units</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isDown ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <TrendingDown className="w-3 h-3" /> Downward
                            </span>
                          ) : isUp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <TrendingUp className="w-3 h-3" /> Upward
                            </span>
                          ) : item.trend_direction === "STABLE" ? (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              Stable
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              {item.trend_direction}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {item.reference_range || "N/A"}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                          {item.clinical_note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Select two reports to generate a direct comparison.
            </p>
          )}

          {comparison?.comparison_summary && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              {comparison.comparison_summary}
            </div>
          )}
        </div>

        {/* Section D: Health Timeline (Chronological History) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-base text-slate-900">
                Continuous Patient Health Timeline
              </h3>
            </div>
            <span className="text-xs text-slate-400">Chronological Medical Milestones</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((event, i) => (
              <div key={event.id || i} className="relative">
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded">
                      {event.event_type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{event.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{event.title}</h4>
                  {event.subtitle && (
                    <p className="text-xs text-slate-600 font-medium">{event.subtitle}</p>
                  )}
                  {event.description && (
                    <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

