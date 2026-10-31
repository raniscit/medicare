"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
  HeartHandshake,
  FileText,
  Pill,
  Bell,
  Sparkles,
  Loader2,
  Mail
} from "lucide-react";
import { api } from "@/lib/api";

function CreatePasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [pageState, setPageState] = useState<"verifying" | "ready" | "invalid" | "expired" | "already_used" | "success">("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [invitation, setInvitation] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      setErrorMessage("No invitation token was provided in the link. Please check your invitation email.");
      return;
    }

    async function verifyToken() {
      setPageState("verifying");
      try {
        const data = await api.validateInvitationToken(token);
        setInvitation(data);
        if (data.caregiver_name && data.caregiver_name !== "Invited Caregiver") {
          setFullName(data.caregiver_name);
        }
        setPageState("ready");
      } catch (err: any) {
        console.error("Token verification failed:", err);
        const msg = err.message || "";
        if (msg.toLowerCase().includes("expired")) {
          setPageState("expired");
          setErrorMessage(msg || "This invitation link has expired. Invitations are valid for 72 hours.");
        } else if (msg.toLowerCase().includes("already")) {
          setPageState("already_used");
          setErrorMessage(msg || "This invitation token has already been used and activated.");
        } else {
          setPageState("invalid");
          setErrorMessage(msg || "Invalid or unrecognized invitation link.");
        }
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPasswordFromInvite({
        token,
        password,
        full_name: fullName.trim() || undefined,
      });

      // Save token in localStorage
      if (res.access_token) {
        localStorage.setItem("medicare_token", res.access_token);
      }

      setPageState("success");

      // Redirect after brief celebration
      const destination = res.redirect_url || invitation?.redirect_url || "/dashboard";
      setTimeout(() => {
        router.push(destination);
      }, 1500);
    } catch (err: any) {
      console.error("Password creation failed:", err);
      setFormError(err.message || "Failed to create password and activate account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLengthValid = password.length >= 8;
  const isMatchValid = password.length > 0 && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-teal-100/70 text-teal-800 text-xs font-bold tracking-wide uppercase mb-3">
          <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
          <span>Family & Caregiver Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          MediCare <span className="text-teal-700">AI</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Accept your invitation and set up your secure password
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200/90 rounded-2xl">
          {/* STATE 1: Verifying */}
          {pageState === "verifying" && (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verifying Invitation Link</h3>
                <p className="text-xs text-slate-500 mt-1">Checking secure token credentials...</p>
              </div>
            </div>
          )}

          {/* STATE 2: Expired Token */}
          {pageState === "expired" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Invitation Link Expired</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {errorMessage || "This invitation link was valid for 72 hours and has now expired."}
                </p>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 mt-4">
                  <p className="font-semibold text-slate-800">What to do next:</p>
                  <p className="mt-1 text-slate-500">
                    Ask the patient to open their MediCare AI dashboard, go to <strong>Family & Caregivers</strong>, and click <strong>Resend Invite</strong> next to your email.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: Already Used */}
          {pageState === "already_used" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Account Already Activated</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  This invitation has already been used and your caregiver account is active. You can log in using your email and password.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-xs transition-colors"
                >
                  <span>Log in to MediCare AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: Invalid Token */}
          {pageState === "invalid" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Invalid Invitation Link</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {errorMessage || "We could not locate a valid invitation matching this link. It may have been revoked or entered incorrectly."}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {/* STATE 5: Success State */}
          {pageState === "success" && (
            <div className="text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Account Activated!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your password has been created and your caregiver access is confirmed.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-teal-700 mt-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to your health dashboard...</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 6: Ready - Password Creation Form */}
          {pageState === "ready" && invitation && (
            <div className="space-y-5">
              {/* Patient Invitation Banner */}
              <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-950">
                      {invitation.patient_name} invited you
                    </p>
                    <p className="text-[11px] text-teal-800 leading-relaxed mt-0.5">
                      Invited as their <strong>{invitation.relationship}</strong> with designated caregiver permissions.
                    </p>
                  </div>
                </div>

                {/* Permissions summary */}
                <div className="pt-2 border-t border-teal-200/60 flex flex-wrap gap-1.5 text-[10px] font-semibold text-teal-900">
                  {invitation.permissions_json?.can_view_reports && (
                    <span className="px-2 py-0.5 bg-white rounded border border-teal-200">
                      ✓ Lab Reports
                    </span>
                  )}
                  {invitation.permissions_json?.can_view_medications && (
                    <span className="px-2 py-0.5 bg-white rounded border border-teal-200">
                      ✓ Medications
                    </span>
                  )}
                  {invitation.permissions_json?.can_view_reminders && (
                    <span className="px-2 py-0.5 bg-white rounded border border-teal-200">
                      ✓ Reminders
                    </span>
                  )}
                  {invitation.permissions_json?.can_receive_alerts && (
                    <span className="px-2 py-0.5 bg-white rounded border border-teal-200">
                      ✓ Emergency Alerts
                    </span>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (Read-Only) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Invited Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={invitation.caregiver_email}
                      disabled
                      className="w-full px-3.5 py-2 pl-9 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Johnson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-teal-600 font-medium"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 pr-9 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-teal-600 font-medium"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 pr-9 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-teal-600 font-medium"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation Checklist */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isLengthValid ? "text-emerald-600" : "text-slate-300"}`} />
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isMatchValid ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isMatchValid ? "text-emerald-600" : "text-slate-300"}`} />
                    <span>Passwords match</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || !isLengthValid || !isMatchValid}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Activate Account & Access Portal</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400">
                  Already have an active account?{" "}
                  <Link href="/login" className="text-teal-700 font-bold hover:underline">
                    Log in here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading Invitation...</p>
        </div>
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  );
}

