"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  Utensils,
  X,
  History,
  Check,
  XCircle
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    duration: "14 days",
    timing: "AFTER_FOOD",
    schedule_times: ["08:00"],
    special_instructions: "",
    precautions: "",
    dietary_recommendations: "",
    prescribed_by: "",
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMeds, todaySched] = await Promise.all([
        api.getMedications(filterActive),
        api.getTodayMedSchedule(),
      ]);
      setMedications(allMeds || []);
      setTodaySchedule(todaySched || []);
    } catch (err) {
      console.error("Failed to load medication data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterActive]);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      name: "",
      dosage: "",
      frequency: "Once daily",
      duration: "14 days",
      timing: "AFTER_FOOD",
      schedule_times: ["08:00"],
      special_instructions: "",
      precautions: "",
      dietary_recommendations: "",
      prescribed_by: "",
      is_active: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (med: any) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration || "",
      timing: med.timing || "AFTER_FOOD",
      schedule_times: med.schedule_times || ["08:00"],
      special_instructions: med.special_instructions || "",
      precautions: med.precautions || "",
      dietary_recommendations: med.dietary_recommendations || "",
      prescribed_by: med.prescribed_by || "",
      is_active: med.is_active ?? true,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dosage) {
      alert("Please provide the medication name and dosage.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingMed) {
        await api.updateMedication(editingMed.id, formData);
      } else {
        await api.createMedication(formData);
      }
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save medication");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this medication from your schedule?")) return;
    try {
      await api.deleteMedication(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete medication");
    }
  };

  const handleLogStatus = async (medId: number, status: "TAKEN" | "MISSED") => {
    try {
      await api.logMedication(medId, {
        medication_id: medId,
        status: status,
        scheduled_for: new Date().toISOString(),
        notes: `Marked as ${status.toLowerCase()} by patient`,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to log medication dose");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Medication & Precaution Management
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Daily Regimen & Prescriptions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prescription tracking, dietary precautions, daily dose logging, and timing guidelines
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterActive(!filterActive)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                filterActive
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterActive ? "Active Medications" : "All Medications"}</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>
        </div>

        {/* Clinical Safety & Regulatory Notice */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Medical Safety Protocol: </span>
            MediCare AI helps organize schedules and extract instructions from your doctor&apos;s prescriptions.
            The AI does not prescribe, adjust doses, or substitute medications. Never change dosages without consulting
            your healthcare provider.
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Today&apos;s Medication Schedule</h3>
                <p className="text-[11px] text-slate-500">Record your daily compliance</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading schedule...</div>
          ) : todaySchedule.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No active medications scheduled for today</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload a prescription report or add a medicine manually.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaySchedule.map((item: any, idx: number) => {
                const isTaken = item.today_log?.status === "TAKEN";
                const isMissed = item.today_log?.status === "MISSED";

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isTaken
                        ? "bg-emerald-50/50 border-emerald-200"
                        : isMissed
                        ? "bg-rose-50/50 border-rose-200"
                        : "bg-slate-50/50 border-slate-200 hover:border-teal-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{item.name}</h4>
                        <p className="text-[11px] font-semibold text-teal-700 mt-0.5">
                          {item.dosage} • {item.frequency}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-slate-400" />
                          {item.timing === "BEFORE_FOOD"
                            ? "Before food"
                            : item.timing === "AFTER_FOOD"
                            ? "After food"
                            : item.timing === "WITH_FOOD"
                            ? "With meals"
                            : "As instructed"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {item.time || "Daily"}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      {isTaken ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Taken ({item.today_log?.taken_time ? formatDateTime(item.today_log.taken_time) : "Today"})
                        </span>
                      ) : isMissed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Missed Dose
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 w-full justify-end">
                          <button
                            onClick={() => handleLogStatus(item.id, "MISSED")}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-600"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => handleLogStatus(item.id, "TAKEN")}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            Mark Taken
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prescriptions & Detailed Medications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Prescribed Medications Catalog ({medications.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Extracted from prescriptions & clinical records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading medications...</div>
          ) : medications.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">No medications found matching filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((med: any) => (
                <div
                  key={med.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{med.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              med.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {med.is_active ? "Active" : "Archived"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-teal-700 mt-0.5">
                          {med.dosage} • {med.frequency}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Meal Timing</span>
                        <p className="text-slate-700 font-medium">
                          {med.timing === "BEFORE_FOOD"
                            ? "Before food"
                            : med.timing === "AFTER_FOOD"
                            ? "After food"
                            : med.timing === "WITH_FOOD"
                            ? "With food"
                            : "Flexible"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                        <p className="text-slate-700 font-medium">{med.duration || "Ongoing"}</p>
                      </div>
                    </div>

                    {med.special_instructions && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block text-[11px] mb-0.5">
                          Special Instructions:
                        </span>
                        {med.special_instructions}
                      </div>
                    )}

                    {med.dietary_recommendations && (
                      <div className="mt-2 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-700">
                        <span className="font-bold text-teal-900 block text-[11px] mb-0.5">
                          Dietary Recommendations:
                        </span>
                        {med.dietary_recommendations}
                      </div>
                    )}

                    {med.precautions && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                        <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                          Precautions:
                        </span>
                        {med.precautions}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Prescribed by: {med.prescribed_by || "Physician"}</span>
                    {med.logs?.length > 0 && (
                      <span className="text-teal-600 font-semibold">{med.logs.length} logged doses</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Medication Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-base text-slate-900">
                    {editingMed ? "Edit Medication" : "Add Medication"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Metformin Hydrochloride"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Dosage *</label>
                    <input
                      type="text"
                      required
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g. 500 mg"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed (PRN)">As needed (PRN)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Meal Timing</label>
                    <select
                      value={formData.timing}
                      onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                    >
                      <option value="AFTER_FOOD">After food</option>
                      <option value="BEFORE_FOOD">Before food</option>
                      <option value="WITH_FOOD">With food</option>
                      <option value="ANYTIME">Anytime</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g. 30 days / Continuous"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Prescribing Doctor / Hospital</label>
                  <input
                    type="text"
                    value={formData.prescribed_by}
                    onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma, MD"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Special Instructions</label>
                  <input
                    type="text"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    placeholder="e.g. Swallow whole with a full glass of water."
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dietary Recommendations</label>
                  <textarea
                    rows={2}
                    value={formData.dietary_recommendations}
                    onChange={(e) => setFormData({ ...formData, dietary_recommendations: e.target.value })}
                    placeholder="e.g. Take with morning breakfast. Maintain low carbohydrate diet."
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precautions</label>
                  <textarea
                    rows={2}
                    value={formData.precautions}
                    onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                    placeholder="e.g. Avoid alcohol. Notify physician if persistent nausea occurs."
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="is_active" className="text-xs font-medium text-slate-700">
                    Active prescription schedule
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : editingMed ? "Update Medication" : "Save Medication"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

