"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Bell,
  Heart,
  Save,
  CheckCircle2,
  Lock,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    date_of_birth: "",
    gender: "Male",
    blood_group: "O+",
    phone_number: "+91 98765 43210",
    emergency_contact: "+91 98765 00000",
    allergies: "Penicillin",
    medical_history_summary: "Type 2 Diabetes Mellitus, Essential Hypertension",
  });
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const me = await api.getMe();
        if (me?.profile) {
          setProfile({
            date_of_birth: me.profile.date_of_birth || "",
            gender: me.profile.gender || "Male",
            blood_group: me.profile.blood_group || "O+",
            phone_number: me.profile.phone_number || "",
            emergency_contact: me.profile.emergency_contact || "",
            allergies: me.profile.allergies || "",
            medical_history_summary: me.profile.medical_history_summary || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      await api.updateProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Account & Patient Profile Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage clinical demographics, emergency emergency contacts, and privacy preferences
            </p>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full self-start md:self-auto">
            {user?.role || "Patient Account"}
          </span>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">Profile updated successfully!</span>
          </div>
        )}

        {/* Profile Demographics Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Patient Medical Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || "Rahul Sharma"}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "rahul.sharma@example.com"}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                <select
                  value={profile.blood_group}
                  onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600 bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profile.phone_number}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Contact Number</label>
                <input
                  type="text"
                  value={profile.emergency_contact}
                  onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Known Drug Allergies</label>
              <input
                type="text"
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa drugs"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Medical History & Pre-existing Conditions
              </label>
              <textarea
                rows={3}
                value={profile.medical_history_summary}
                onChange={(e) => setProfile({ ...profile, medical_history_summary: e.target.value })}
                placeholder="e.g. Type 2 Diabetes diagnosed 2022, Hypertension"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-teal-600"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving Profile..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Isolation Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Security & Privacy Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Data Isolation</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Your medical reports and clinical history are strictly private to your account.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Document Intelligence</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generates insights grounded directly in your verified medical records.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>End-to-End Encryption</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Secure authenticated sessions with automated privacy protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

