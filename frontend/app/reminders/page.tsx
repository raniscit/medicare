"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Sparkles,
  User,
  MapPin,
  Mail,
  ShieldCheck,
  X,
  RefreshCw,
  HelpCircle,
  PhoneCall
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<"reminders" | "appointments" | "unconfirmed">("reminders");
  const [reminders, setReminders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // In-UI Feedback State (No popup alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reminder Form State
  const [reminderForm, setReminderForm] = useState({
    title: "",
    reminder_type: "MEDICATION",
    scheduled_time: "",
    recurrence: "DAILY",
    notes: "",
  });

  // Appointment Form State
  const [apptForm, setApptForm] = useState({
    doctor_name: "",
    specialty: "General Physician",
    clinic_or_hospital: "",
    appointment_time: "",
    reason: "",
    instructions: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotificationAllowed(Notification.permission === "granted");
    }
  }, []);

  // Auto-clear success and error messages after 7 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rems, appts] = await Promise.all([
        api.getReminders(),
        api.getAppointments(),
      ]);
      setReminders(rems || []);
      setAppointments(appts || []);
    } catch (err: any) {
      console.error("Failed to load reminders/appointments:", err);
      setErrorMessage(err.message || "Failed to load schedule records from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestBrowserNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotificationAllowed(perm === "granted");
        if (perm === "granted") {
          new Notification("MediCare AI Reminders", {
            body: "Smart notifications have been enabled for your health schedule.",
          });
          setSuccessMessage("Browser desktop notifications enabled!");
        }
      } catch (e: any) {
        setErrorMessage("Could not enable browser notifications: " + e.message);
      }
    }
  };

  const handleConfirmReminder = async (id: number) => {
    try {
      setErrorMessage(null);
      await api.confirmReminder(id);
      setSuccessMessage("Reminder confirmed and scheduled!");
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm reminder");
    }
  };

  const handleCompleteReminder = async (id: number) => {
    try {
      setErrorMessage(null);
      await api.completeReminder(id);
      setSuccessMessage("Reminder marked as completed!");
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete reminder");
    }
  };

  const handleDeleteReminder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      setErrorMessage(null);
      await api.deleteReminder(id);
      setSuccessMessage("Reminder deleted successfully.");
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete reminder");
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!reminderForm.title || !reminderForm.scheduled_time) {
      setModalError("Please provide both a reminder title and scheduled date & time.");
      return;
    }
    setActionLoading(true);
    try {
      await api.createReminder({
        title: reminderForm.title,
        reminder_type: reminderForm.reminder_type,
        reminder_time: reminderForm.scheduled_time,
        scheduled_time: reminderForm.scheduled_time,
        recurrence: reminderForm.recurrence,
        description: reminderForm.notes,
        notes: reminderForm.notes,
        status: "ACTIVE",
        is_confirmed: true,
        requires_confirmation: false,
      });
      setShowAddReminderModal(false);
      setReminderForm({
        title: "",
        reminder_type: "MEDICATION",
        scheduled_time: "",
        recurrence: "DAILY",
        notes: "",
      });
      setSuccessMessage("Health reminder created successfully!");
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create reminder. Check server connection.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!apptForm.doctor_name || !apptForm.appointment_time) {
      setModalError("Please provide the doctor's name and appointment date & time.");
      return;
    }
    setActionLoading(true);
    try {
      await api.createAppointment({
        doctor_name: apptForm.doctor_name,
        specialty: apptForm.specialty,
        hospital_or_clinic: apptForm.clinic_or_hospital,
        clinic_or_hospital: apptForm.clinic_or_hospital,
        appointment_date: apptForm.appointment_time,
        appointment_time: apptForm.appointment_time,
        reason: apptForm.reason,
        notes: apptForm.instructions,
        instructions: apptForm.instructions,
        status: "SCHEDULED"
      });
      setShowAddApptModal(false);
      setApptForm({
        doctor_name: "",
        specialty: "General Physician",
        clinic_or_hospital: "",
        appointment_time: "",
        reason: "",
        instructions: "",
      });
      setSuccessMessage(`Appointment booked with ${apptForm.doctor_name} successfully!`);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to save appointment. Please check details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      setErrorMessage(null);
      await api.deleteAppointment(id);
      setSuccessMessage("Appointment deleted successfully.");
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete appointment");
    }
  };

  const pendingConfirmations = reminders.filter((r) => r.requires_confirmation && !r.is_confirmed);
  const activeReminders = reminders.filter((r) => r.is_confirmed && (r.status === "ACTIVE" || r.status === "PENDING"));
  const completedReminders = reminders.filter((r) => r.status === "COMPLETED");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Appointments & Smart Reminders
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Schedule & Alerts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated document follow-up scheduling, doctor visits, and multi-channel reminders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setModalError(null);
                setShowAddApptModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => {
                setModalError(null);
                setShowAddReminderModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Reminder</span>
            </button>
          </div>
        </div>

        {/* Global Success / Error Banners on UI */}
        {successMessage && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs transition-all">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs transition-all">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">Error: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notification Status & Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Browser Alerts</h4>
                <p className="text-[11px] text-slate-500">
                  {browserNotificationAllowed ? "Enabled & Active" : "Click to enable alerts"}
                </p>
              </div>
            </div>
            {!browserNotificationAllowed && (
              <button
                onClick={handleRequestBrowserNotification}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Email Reminders</h4>
                <p className="text-[11px] text-slate-500">Automated dispatch to verified email</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">AI Document Parser</h4>
                <p className="text-[11px] text-slate-500">Auto-detects follow-up dates</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>
        </div>

        {/* Pending Follow-up Confirmations Banner */}
        {pendingConfirmations.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Follow-ups Detected in Medical Reports ({pendingConfirmations.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Please confirm before scheduling
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingConfirmations.map((p) => {
                const scheduleTime = p.reminder_time || p.scheduled_time;
                const noteText = p.description || p.notes;
                return (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        {p.reminder_type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Suggested Date: {formatDateTime(scheduleTime)}
                      </p>
                      {noteText && <p className="text-xs text-slate-600 mt-2 italic">&quot;{noteText}&quot;</p>}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDeleteReminder(p.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-600 font-medium cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleConfirmReminder(p.id)}
                        className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Confirm & Schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap pb-0.5">
          <button
            onClick={() => setActiveTab("reminders")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "reminders"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Active Reminders ({activeReminders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "appointments"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Doctor Appointments ({appointments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("unconfirmed")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "unconfirmed"
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed History ({completedReminders.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Loading schedule records...</span>
          </div>
        ) : activeTab === "reminders" ? (
          <div className="space-y-4">
            {activeReminders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No active health reminders</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Click &apos;New Reminder&apos; to schedule medication or test alerts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeReminders.map((rem) => {
                  const scheduleTime = rem.reminder_time || rem.scheduled_time;
                  const noteText = rem.description || rem.notes;
                  return (
                    <div
                      key={rem.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            {rem.reminder_type}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-slate-500">
                            Recurrence: {rem.recurrence}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mt-2">{rem.title}</h4>
                        <p className="text-xs font-semibold text-teal-700 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {formatDateTime(scheduleTime)}
                        </p>

                        {noteText && (
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {noteText}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCompleteReminder(rem.id)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold flex items-center gap-1 border border-teal-200 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "appointments" ? (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No scheduled doctor appointments</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Click &apos;Book Appointment&apos; to add upcoming clinical visits.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => {
                  const apptDate = appt.appointment_date || appt.appointment_time;
                  const clinicName = appt.hospital_or_clinic || appt.clinic_or_hospital;
                  const instructionText = appt.notes || appt.instructions;
                  return (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                              {appt.specialty || "General Medicine"}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 flex items-center gap-1.5">
                              <User className="w-4 h-4 text-teal-600" />
                              {appt.doctor_name}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1.5 mt-3 text-xs">
                          <p className="text-teal-700 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            {formatDateTime(apptDate)}
                          </p>
                          {clinicName && (
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {clinicName}
                            </p>
                          )}
                          {appt.reason && (
                            <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="font-semibold text-slate-900">Reason:</span> {appt.reason}
                            </p>
                          )}
                          {instructionText && (
                            <p className="text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 text-[11px]">
                              <span className="font-semibold text-amber-900">Instructions:</span> {instructionText}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Completed History Tab */
          <div className="space-y-3">
            {completedReminders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No completed reminder history.</div>
            ) : (
              completedReminders.map((r) => {
                const scheduleTime = r.reminder_time || r.scheduled_time;
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{r.title}</span>
                        <p className="text-[11px] text-slate-500">Scheduled: {formatDateTime(scheduleTime)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Create Reminder Modal */}
        {showAddReminderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Create New Health Reminder</h3>
                <button
                  onClick={() => setShowAddReminderModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                  <button onClick={() => setModalError(null)} className="text-rose-500 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateReminder} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reminder Title *</label>
                  <input
                    type="text"
                    required
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                    placeholder="e.g. Take Atorvastatin 20mg"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
                    <select
                      value={reminderForm.reminder_type}
                      onChange={(e) => setReminderForm({ ...reminderForm, reminder_type: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                    >
                      <option value="MEDICATION">Taking Medicine</option>
                      <option value="APPOINTMENT">Doctor Appointment</option>
                      <option value="FOLLOW_UP">Follow-up Visit</option>
                      <option value="TEST">Medical Test</option>
                      <option value="CHECKUP">Health Checkup</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Recurrence</label>
                    <select
                      value={reminderForm.recurrence}
                      onChange={(e) => setReminderForm({ ...reminderForm, recurrence: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                    >
                      <option value="NONE">Once Only</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={reminderForm.scheduled_time}
                    onChange={(e) => setReminderForm({ ...reminderForm, scheduled_time: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={reminderForm.notes}
                    onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                    placeholder="e.g. Fasting required 8 hours prior"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddReminderModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Scheduling..." : "Save Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Book Appointment Modal */}
        {showAddApptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Book Doctor Appointment</h3>
                <button
                  onClick={() => setShowAddApptModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                  <button onClick={() => setModalError(null)} className="text-rose-500 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateAppointment} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    value={apptForm.doctor_name}
                    onChange={(e) => setApptForm({ ...apptForm, doctor_name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Specialty</label>
                    <input
                      type="text"
                      value={apptForm.specialty}
                      onChange={(e) => setApptForm({ ...apptForm, specialty: e.target.value })}
                      placeholder="e.g. Cardiologist"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Clinic / Hospital</label>
                    <input
                      type="text"
                      value={apptForm.clinic_or_hospital}
                      onChange={(e) => setApptForm({ ...apptForm, clinic_or_hospital: e.target.value })}
                      placeholder="e.g. City Health Clinic"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Appointment Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={apptForm.appointment_time}
                    onChange={(e) => setApptForm({ ...apptForm, appointment_time: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Visit</label>
                  <input
                    type="text"
                    value={apptForm.reason}
                    onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                    placeholder="e.g. Routine 3-month HbA1c review"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Preparation Instructions</label>
                  <textarea
                    rows={2}
                    value={apptForm.instructions}
                    onChange={(e) => setApptForm({ ...apptForm, instructions: e.target.value })}
                    placeholder="e.g. Bring previous lipid profile and medication slips"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddApptModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Appointment"}
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
