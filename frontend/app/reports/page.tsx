"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function MedicalReportsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Blood Test Report");
  const [labName, setLabName] = useState("");

  const categories = [
    "ALL",
    "Blood Test",
    "Lipid Profile",
    "Discharge Summary",
    "Prescription",
    "General",
  ];

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments(search, category);
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Extracted parameters and summaries will also be removed.`)) {
      return;
    }
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", docType);
      if (labName) formData.append("laboratory_name", labName);

      await api.uploadDocument(formData);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setLabName("");
      loadDocuments();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Upload CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Medical Reports</h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload, analyze, and manage your complete historical health documentation
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Medical Document</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by report name, lab, or test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-teal-600 text-slate-800"
            />
          </form>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  category === c
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid / Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <span className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p>Loading medical documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-800">No medical reports found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Upload your blood tests, prescriptions, or discharge summaries to see automated summaries and biomarker tracking.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold"
              >
                Upload First Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Diagnostic Lab</th>
                    <th className="py-3 px-4">Report Date</th>
                    <th className="py-3 px-4">Processing Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span>{doc.original_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.laboratory_name || "Diagnostic Lab"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.report_date || formatDate(doc.upload_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Extracted
                          </span>
                        ) : doc.status === "PROCESSING" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" /> Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/report-analysis?id=${doc.id}`}
                            title="View AI Analysis"
                            className="p-1.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold transition-colors flex items-center gap-1 text-[11px] px-2.5"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Analyze</span>
                          </Link>
                          <a
                            href={api.downloadSummaryUrl(doc.id, "simple")}
                            target="_blank"
                            rel="noreferrer"
                            title="Download Simple Summary"
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id, doc.original_name)}
                            title="Delete Document"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Upload Medical Document</h3>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG supported (Max 25MB)</p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-teal-600"
                  >
                    <option value="Blood Test Report">Blood Test / CBC Report</option>
                    <option value="Lipid Profile">Lipid Profile</option>
                    <option value="Liver Function Test">Liver Function Test (LFT)</option>
                    <option value="Kidney Function Test">Kidney Function Test (KFT)</option>
                    <option value="Thyroid Profile">Thyroid Profile (TSH)</option>
                    <option value="Hospital Discharge Summary">Hospital Discharge Summary</option>
                    <option value="Medical Prescription">Medical Prescription</option>
                    <option value="Diagnostic Imaging Report">Diagnostic & X-Ray Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnostic Facility or Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Diagnostic Clinic"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-teal-600"
                  />
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors cursor-pointer bg-slate-50">
                  <input
                    type="file"
                    id="reports-page-file-upload"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="reports-page-file-upload" className="cursor-pointer">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-bold text-teal-700">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Select PDF or Medical Report Image
                        </p>
                        <p className="text-[11px] text-slate-400">PDF, JPG, or PNG</p>
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
                        <span>Extracting & Summarizing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload & Process</span>
                      </>
                    )}
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

