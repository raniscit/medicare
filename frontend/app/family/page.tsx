"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  Mail,
  Check,
  X,
  Trash2,
  Settings2,
  FileText,
  Pill,
  Bell,
  TrendingUp,
  AlertCircle,
  Copy,
  Clock,
  CheckCircle2,
  KeyRound
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function FamilyPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingPermissionsConn, setEditingPermissionsConn] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    caregiver_email: "",
    caregiver_name: "",
    relationship: "Spouse",
    can_view_reports: true,
    can_view_medications: true,
    can_view_reminders: true,
    can_view_trends: true,
    can_manage_reminders: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getFamilyConnections();
      setConnections(list || []);
    } catch (err) {
      console.error("Failed to load family connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.caregiver_email) {
      alert("Please provide the caregiver's email address.");
      return;
    }
    setActionLoading(true);
    try {
      await api.inviteFamily(inviteForm);
      setShowInviteModal(false);
      setInviteForm({
        caregiver_email: "",
        caregiver_name: "",
        relationship: "Spouse",
        can_view_reports: true,
        can_view_medications: true,
        can_view_reminders: true,
        can_view_trends: true,
        can_manage_reminders: false,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to send family invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsConn) return;

    setActionLoading(true);
    try {
      await api.updateFamilyPermissions(editingPermissionsConn.id, {
        can_view_reports: editingPermissionsConn.permissions?.can_view_reports,
        can_view_medications: editingPermissionsConn.permissions?.can_view_medications,
        can_view_reminders: editingPermissionsConn.permissions?.can_view_reminders,
        can_view_trends: editingPermissionsConn.permissions?.can_view_trends,
        can_manage_reminders: editingPermissionsConn.permissions?.can_manage_reminders,
      });
      setEditingPermissionsConn(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update permissions");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm("Are you sure you want to revoke this caregiver's access to your medical records?")) return;
    try {
      await api.revokeFamilyConnection(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke access");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeCaregivers = connections.filter((c) => c.status === "ACTIVE");
  const pendingInvites = connections.filter((c) => c.status === "PENDING");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Family & Caregiver Collaboration
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Feature 6
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Invite trusted family members, define granular access permissions, and revoke at any time
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Family Member</span>
          </button>
        </div>

        {/* Privacy & Consent Guarantee */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 leading-relaxed">
            <span className="font-bold">Zero-Exposure Privacy Guarantee: </span>
            Medical documents and health metrics are strictly isolated. No family member can view your medical
            records, medication schedules, or test results without your explicit, permission-based consent. You maintain
            100% control and can revoke access immediately.
          </div>
        </div>

        {/* Active Caregivers & Members */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Connected Caregivers ({activeCaregivers.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Granted active access to your profile</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading caregivers...</div>
          ) : activeCaregivers.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">No active caregivers connected</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Invite a family member or caregiver to help track your medication and appointments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCaregivers.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {c.caregiver?.full_name || c.caregiver_email}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {c.caregiver_email}
                        </p>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          Relationship: {c.relationship}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingPermissionsConn(c)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          title="Manage Permissions"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRevoke(c.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-500"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Permissions Badges */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Granted Permissions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.permissions?.can_view_reports && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            <FileText className="w-3 h-3 text-teal-600" />
                            Reports
                          </span>
                        )}
                        {c.permissions?.can_view_medications && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            <Pill className="w-3 h-3 text-teal-600" />
                            Medications
                          </span>
                        )}
                        {c.permissions?.can_view_reminders && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            <Bell className="w-3 h-3 text-teal-600" />
                            Reminders
                          </span>
                        )}
                        {c.permissions?.can_view_trends && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3 text-teal-600" />
                            Trends
                          </span>
                        )}
                        {c.permissions?.can_manage_reminders && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" />
                            Manage Reminders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    Connected since: {formatDate(c.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Pending Invitations ({pendingInvites.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Waiting for caregiver to accept</span>
            </div>

            <div className="space-y-3">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{inv.caregiver_email}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Relationship: {inv.relationship} • Sent {formatDate(inv.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.invitation_code && (
                      <button
                        onClick={() => handleCopyCode(inv.invitation_code)}
                        className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedCode === inv.invitation_code ? "Copied Code!" : "Copy Code"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      className="px-3 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-[11px] font-semibold text-rose-600"
                    >
                      Cancel Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-900">Invite Caregiver or Family Member</h3>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Caregiver Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.caregiver_email}
                    onChange={(e) => setInviteForm({ ...inviteForm, caregiver_email: e.target.value })}
                    placeholder="e.g. spouse@example.com"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Name (Optional)</label>
                    <input
                      type="text"
                      value={inviteForm.caregiver_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, caregiver_name: e.target.value })}
                      placeholder="e.g. Priya"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                    <select
                      value={inviteForm.relationship}
                      onChange={(e) => setInviteForm({ ...inviteForm, relationship: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Professional Caregiver">Professional Caregiver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Granular Permissions Selection */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-800 block mb-2">
                    Access Permissions to Grant:
                  </label>
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={inviteForm.can_view_reports}
                        onChange={(e) => setInviteForm({ ...inviteForm, can_view_reports: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>View Medical Reports & Diagnostic Summaries</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={inviteForm.can_view_medications}
                        onChange={(e) => setInviteForm({ ...inviteForm, can_view_medications: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>View Medications & Dosing Schedules</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={inviteForm.can_view_reminders}
                        onChange={(e) => setInviteForm({ ...inviteForm, can_view_reminders: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>View Appointments & Upcoming Reminders</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={inviteForm.can_view_trends}
                        onChange={(e) => setInviteForm({ ...inviteForm, can_view_trends: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>View Health Biomarker Trends & Insights</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1 border-t border-slate-200">
                      <input
                        type="checkbox"
                        checked={inviteForm.can_manage_reminders}
                        onChange={(e) => setInviteForm({ ...inviteForm, can_manage_reminders: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-slate-800">
                        Allow Caregiver to Mark Doses & Manage Reminders
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 shadow-xs"
                  >
                    {actionLoading ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {editingPermissionsConn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Update Permissions: {editingPermissionsConn.caregiver_email}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingPermissionsConn(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePermissions} className="mt-4 space-y-3">
                <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingPermissionsConn.permissions?.can_view_reports}
                      onChange={(e) =>
                        setEditingPermissionsConn({
                          ...editingPermissionsConn,
                          permissions: {
                            ...editingPermissionsConn.permissions,
                            can_view_reports: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600"
                    />
                    <span>View Medical Reports & Summaries</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingPermissionsConn.permissions?.can_view_medications}
                      onChange={(e) =>
                        setEditingPermissionsConn({
                          ...editingPermissionsConn,
                          permissions: {
                            ...editingPermissionsConn.permissions,
                            can_view_medications: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600"
                    />
                    <span>View Medications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingPermissionsConn.permissions?.can_view_reminders}
                      onChange={(e) =>
                        setEditingPermissionsConn({
                          ...editingPermissionsConn,
                          permissions: {
                            ...editingPermissionsConn.permissions,
                            can_view_reminders: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600"
                    />
                    <span>View Appointments & Reminders</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingPermissionsConn.permissions?.can_view_trends}
                      onChange={(e) =>
                        setEditingPermissionsConn({
                          ...editingPermissionsConn,
                          permissions: {
                            ...editingPermissionsConn.permissions,
                            can_view_trends: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600"
                    />
                    <span>View Biomarker Health Trends</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-2 border-t border-slate-200">
                    <input
                      type="checkbox"
                      checked={editingPermissionsConn.permissions?.can_manage_reminders}
                      onChange={(e) =>
                        setEditingPermissionsConn({
                          ...editingPermissionsConn,
                          permissions: {
                            ...editingPermissionsConn.permissions,
                            can_manage_reminders: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-amber-600"
                    />
                    <span className="font-semibold text-slate-800">Allow Reminders & Dose Management</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPermissionsConn(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 shadow-xs"
                  >
                    {actionLoading ? "Updating..." : "Save Changes"}
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

