"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  Pill,
  Bell,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Blood Test Report");
  const [labName, setLabName] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Activity },
    { label: "My Medical Reports", href: "/reports", icon: FileText },
    { label: "AI Report Analyzer", href: "/report-analysis", icon: Sparkles },
    { label: "Health Tracking", href: "/health-tracking", icon: TrendingUp },
    { label: "Medications", href: "/medications", icon: Pill },
    { label: "Appointments & Reminders", href: "/reminders", icon: Bell },
    { label: "AI Health Assistant", href: "/assistant", icon: MessageSquare },
    { label: "Family & Caregivers", href: "/family", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  // Load notification alerts
  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", docType);
      if (labName) formData.append("laboratory_name", labName);

      const res = await api.uploadDocument(formData);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setLabName("");
      // Navigate to report analysis
      router.push(`/report-analysis?id=${res.id}`);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const unconfirmedCount = notifications.filter((n) => n.is_unconfirmed).length;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen z-30 shadow-subtle">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
              MediCare <span className="text-teal-600 font-extrabold">AI</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold block">
              Health Assistant
            </span>
          </div>
        </div>

        {/* Quick Upload CTA */}
        <div className="p-4">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all shadow-sm hover:shadow"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Report</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-teal-700" : "text-slate-500"}`} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Appointments & Reminders" && unconfirmedCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    {unconfirmedCount}
                  </span>
                )}
              </NextLink>
            );
          })}
        </nav>

        {/* Demo Patient & User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Patient Active</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              Demo Profile
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name || "Alex Johnson"}</p>
              <p className="text-[11px] text-slate-600 truncate">{user?.email || "patient@medicare.ai"}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex md:hidden items-center gap-1.5 font-bold text-sm tracking-tight text-slate-900">
              <span className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center text-xs">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span>MediCare <span className="text-teal-600">AI</span></span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>HIPAA-Compliant Encrypted Medical Storage</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action: AI Health Assistant */}
            <NextLink
              href="/assistant"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask MediCare Assistant</span>
            </NextLink>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-elevated border border-slate-200 py-3 z-50">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">Notification Center</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {notifications.length} pending
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No pending reminders or notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-2.5">
                            {n.is_unconfirmed ? (
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                              {n.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1">{n.description}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <NextLink
                      href="/reminders"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      View all appointments & reminders →
                    </NextLink>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <NextLink href="/settings" className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-200">
                {user?.full_name ? user.full_name[0] : "A"}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name || "Alex Johnson"}
                </span>
                <span className="block text-[10px] text-slate-500">Patient</span>
              </div>
            </NextLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Upload Medical Document</h3>
                <p className="text-xs text-slate-500">PDF, JPG, PNG supported (Max 25MB)</p>
              </div>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Category
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-teal-600"
                >
                  <option value="Blood Test Report">Blood Test / CBC Report</option>
                  <option value="Lipid Profile">Lipid Profile</option>
                  <option value="Liver Function Test">Liver Function Test (LFT)</option>
                  <option value="Kidney Function Test">Kidney Function Test (KFT)</option>
                  <option value="Thyroid Report">Thyroid Profile (TSH)</option>
                  <option value="Hospital Discharge Summary">Hospital Discharge Summary</option>
                  <option value="Medical Prescription">Medical Prescription</option>
                  <option value="Diagnostic Imaging Report">Diagnostic & X-Ray Report</option>
                  <option value="General Health Report">General Medical Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Laboratory or Hospital Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metro Diagnostic Clinic"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-teal-600"
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors cursor-pointer bg-slate-50">
                <input
                  type="file"
                  id="file-upload-input"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <label htmlFor="file-upload-input" className="cursor-pointer">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-teal-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Click to browse or drag file here
                      </p>
                      <p className="text-xs text-slate-400">PDF, PNG, JPG, or JPEG</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Report...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Extract & Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full flex flex-col p-4 shadow-elevated">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-lg text-slate-900">MediCare AI</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </NextLink>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}

