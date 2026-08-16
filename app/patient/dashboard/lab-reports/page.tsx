"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Anomaly {
  metric: string;
  value: string;
  range: string;
  status: string;
}

interface LabReport {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  aiSummary: string | null;
  aiFlaggedAnomalies: string | null;
  uploadedAt: Date | string;
}

export default function LabReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/patient/lab-reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
        if (data.length > 0 && !selectedReport) {
          setSelectedReport(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load lab reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim() || uploading) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);

    try {
      const res = await fetch("/api/patient/lab-reports/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadTitle("");
        setUploadFile(null);
        // Clear input file
        const fileInput = document.getElementById("fileInput") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        // Refresh
        await fetchReports();
        setSelectedReport(data.report);
      } else {
        const errData = await res.json();
        setUploadError(errData.error || "Failed to process upload");
      }
    } catch (err) {
      console.error(err);
      setUploadError("A connection error occurred during analysis.");
    } finally {
      setUploading(false);
    }
  };

  const getAnomalies = (report: LabReport): Anomaly[] => {
    if (!report.aiFlaggedAnomalies) return [];
    try {
      return JSON.parse(report.aiFlaggedAnomalies);
    } catch {
      return [];
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Health Records...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Lab Reports & AI Diagnostics
            </h1>
            <p className="text-slate-400 text-sm">Upload lab results for automated plain-language analysis</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-6 py-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs sm:text-sm flex items-center gap-3 shrink-0">
          <span className="text-lg">⚠️</span>
          <p>
            <span className="font-bold text-white">Medical Disclaimer:</span> This is not a medical diagnosis. For emergencies, contact emergency services.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 flex-grow">
          {/* Left panel: Upload Form & Report selector */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            {/* Upload report block */}
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
              <h3 className="font-bold text-base text-white mb-4">Analyze New Report</h3>
              {uploadError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {uploadError}
                </div>
              )}
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Report Title</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Thyroid Profile March"
                    className="w-full bg-slate-900/60 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">File Upload (PDF, JPG, PNG)</label>
                  <input
                    id="fileInput"
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                    className="w-full bg-slate-900/60 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none file:bg-cyan-500/10 file:border-none file:text-cyan-400 file:px-2.5 file:py-1 file:rounded file:text-xs file:font-semibold hover:file:bg-cyan-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {uploading ? "Analyzing Report..." : "Submit for AI Triage"}
                </button>
              </form>
            </div>

            {/* List reports block */}
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl flex-grow overflow-y-auto max-h-[350px]">
              <h3 className="font-bold text-base text-white mb-4">Saved Reports</h3>
              {reports.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  No lab reports uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        selectedReport?.id === report.id
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <h4 className="font-bold text-xs truncate mb-1">{report.title}</h4>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(report.uploadedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Original File display and explanation */}
          <div className="lg:col-span-3">
            {selectedReport ? (
              <div className="grid md:grid-cols-2 gap-8 h-full">
                {/* File Preview */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-3xl overflow-hidden min-h-[400px] flex flex-col justify-center items-center relative">
                  {selectedReport.fileType === "application/pdf" ? (
                    <iframe
                      src={selectedReport.fileUrl}
                      className="w-full h-full min-h-[500px] border-none"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedReport.fileUrl}
                      alt={selectedReport.title}
                      className="max-w-full max-h-[500px] object-contain rounded-2xl p-4"
                    />
                  )}
                </div>

                {/* AI Explanation & Highlighted anomalies */}
                <div className="space-y-6">
                  <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
                    <h3 className="font-bold text-lg text-white border-b border-slate-700/60 pb-3 mb-4">
                      AI Plain-Language Analysis
                    </h3>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedReport.aiSummary || "No summary analysis available."}
                    </div>
                  </div>

                  {/* Highlighted abnormal list */}
                  <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
                    <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                      ⚠️ Abnormal Lab Values
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold">
                        {getAnomalies(selectedReport).length} Flagged
                      </span>
                    </h3>

                    {getAnomalies(selectedReport).length === 0 ? (
                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500 text-center">
                        No abnormal reference values flagged in this report.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {getAnomalies(selectedReport).map((anomaly, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col justify-between"
                          >
                            <div>
                              <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-1">
                                {anomaly.metric}
                              </h4>
                              <span className="text-lg font-extrabold text-red-400">
                                {anomaly.value}
                              </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-red-500/10 flex justify-between text-[10px] text-slate-400">
                              <span>Ref Range: {anomaly.range}</span>
                              <span className="text-red-400 font-bold uppercase">{anomaly.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-800/20 border border-slate-800 rounded-3xl p-12 text-slate-500 text-sm">
                Upload or select a lab report to view the analysis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
