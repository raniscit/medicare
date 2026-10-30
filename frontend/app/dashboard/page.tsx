"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  Pill,
  Calendar,
  AlertCircle,
  ArrowRight,
  Upload,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  TrendingDown
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, getStatusStyle } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [hba1cTrend, setHba1cTrend] = useState<any>(null);
  const [glucoseTrend, setGlucoseTrend] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [todayMeds, setTodayMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ovData, hbData, fbsData, docsData, medsData, appsData] = await Promise.all([
          api.getHealthOverview(),
          api.getParameterTrend("HbA1c"),
          api.getParameterTrend("Fasting Blood Glucose"),
          api.getDocuments(),
          api.getTodayMedSchedule(),
          api.getAppointments(),
        ]);
        setOverview(ovData);
        setHba1cTrend(hbData);
        setGlucoseTrend(fbsData);
        setRecentDocs(docsData.slice(0, 4));
        setTodayMeds(medsData);
        setAppointments(appsData.slice(0, 3));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading]);

  const handleMarkDose = async (medId: number) => {
    try {
      await api.logMedication(medId, {
        medication_id: medId,
        scheduled_time: new Date().toISOString(),
        status: "TAKEN",
        notes: "Marked taken from Dashboard",
      });
      // refresh today's schedule
      const updated = await api.getTodayMedSchedule();
      setTodayMeds(updated);
    } catch (err: any) {
      alert(`Could not log dose: ${err.message}`);
    }
  };

  // Combine trend points for chart
  const chartData = (hba1cTrend?.data_points || []).map((pt: any, i: number) => {
    const fbsPt = glucoseTrend?.data_points?.[i];
    return {
      date: formatDate(pt.date),
      hba1c: pt.numeric_value,
      glucose: fbsPt ? fbsPt.numeric_value : null,
    };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                Welcome back, {user?.full_name || "Alex Johnson"}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Patient Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Age: 45</span>
              <span>•</span>
              <span>Blood Group: B+</span>
              <span>•</span>
              <span>Type 2 Diabetes (Controlled)</span>
              <span>•</span>
              <span>Last updated: Oct 2026</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>

        {/* AI Health Insight Alert Banner */}
        {overview?.ai_health_insights?.length > 0 && (
          <div className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-sky-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    AI Health Insight (Progress Analysis)
                  </h3>
                  <span className="text-[10px] text-teal-700 font-medium">Non-diagnostic summary</span>
                </div>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
                  {overview.ai_health_insights[0]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Reports Uploaded</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {overview?.total_reports ?? 4}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Full medical archive</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Tracked Metrics</span>
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {overview?.total_parameters_tracked ?? 12}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Biomarkers monitored</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Latest Out of Range</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600">
              {overview?.abnormal_parameters_count ?? 1}
            </div>
            <span className="text-[10px] text-rose-500 mt-1 block font-medium">HbA1c (Down to 6.9%)</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Medicines</span>
              <Pill className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {overview?.active_medications_count ?? 4}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Prescribed regimens</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Upcoming Visits</span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {overview?.upcoming_appointments_count ?? 2}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Doctor consultations</span>
          </div>
        </div>

        {/* Charts & Key Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Line Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Biomarker Progress Trends (2026 Serial Tracking)
                </h3>
                <p className="text-xs text-slate-500">
                  HbA1c (%) and Fasting Blood Glucose (mg/dL) across consecutive laboratory reports
                </p>
              </div>
              <Link
                href="/health-tracking"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Full Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="hba1c"
                    name="HbA1c (%)"
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#0F766E" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="glucose"
                    name="Fasting Glucose (mg/dL)"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#0EA5E9" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-600" /> HbA1c Target: &lt; 5.7% (Healthy)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Fasting Target: 70 - 99 mg/dL
              </span>
            </div>
          </div>

          {/* Today's Medications Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900">Today&apos;s Medication Schedule</h3>
                <Link
                  href="/medications"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {todayMeds.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No medications scheduled.</p>
                ) : (
                  todayMeds.slice(0, 3).map((m: any) => {
                    const isTaken = m.status === "TAKEN";
                    return (
                      <div
                        key={m.medication_id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                      >
                        <div className="pr-2">
                          <p className="text-xs font-bold text-slate-900">{m.medicine_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.dosage} • {m.timing_food || m.frequency}
                          </p>
                        </div>

                        {isTaken ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkDose(m.medication_id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                          >
                            Mark Taken
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/medications"
                className="text-xs font-medium text-slate-600 hover:text-teal-700 flex items-center justify-between"
              >
                <span>View full adherence logs</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Reports & Upcoming Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reports Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Recent Medical Documents</h3>
              <Link href="/reports" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                View All ({recentDocs.length})
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.original_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.document_type} • {doc.report_date || formatDate(doc.upload_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Processed
                    </span>
                    <Link
                      href={`/report-analysis?id=${doc.id}`}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                    >
                      Analyze
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Consultations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900">Scheduled Consultations & Tests</h3>
              <Link href="/reminders" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                All Reminders
              </Link>
            </div>

            <div className="space-y-3">
              {appointments.map((app: any) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{app.doctor_name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {app.specialty} • {app.hospital_or_clinic}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">
                      {formatDate(app.appointment_date)}
                    </p>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

