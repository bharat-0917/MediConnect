"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Upload, AlertTriangle, AlertCircle, ArrowLeft, HeartPulse, FileCheck } from "lucide-react";

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
  analysisStatus?: string;
  uploadedAt: Date | string;
}

export default function LabReportsPage() {
  const { status } = useSession();
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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Medical Records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/patient/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Lab Reports & AI Diagnostics
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Upload diagnostic reports for automated plain-language analysis and reference range checks</p>
          </div>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-5 py-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-3 shrink-0 shadow-warm-sm">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold text-amber-950">Educational Context:</span> AI analysis summaries provide plain-language explanations of laboratory data for discussion with your doctor and do not constitute an official diagnostic ruling.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 flex-grow">
          {/* Left panel: Upload Form & Report selector */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            {/* Upload report block */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                <Upload className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Upload New Report</h3>
              </div>

              {uploadError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {uploadError}
                </div>
              )}
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Report Title</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., Lipid Panel March"
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Document (PDF, JPG, PNG)</label>
                  <input
                    id="fileInput"
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none file:bg-[#E0F2E7] file:border-none file:text-[#042618] file:px-2.5 file:py-1 file:rounded-lg file:text-xs file:font-bold hover:file:bg-[#D0EBD9]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all disabled:opacity-50"
                >
                  {uploading ? "Analyzing Document..." : "Analyze with AI"}
                </button>
              </form>
            </div>

            {/* List reports block */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl flex-grow overflow-y-auto max-h-[350px] shadow-warm-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                <FileCheck className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Saved Lab Reports</h3>
              </div>

              {reports.length === 0 ? (
                <div className="text-center text-xs text-stone-500 py-6">
                  No lab reports uploaded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all text-xs ${
                        selectedReport?.id === report.id
                          ? "bg-[#E0F2E7] border-[#042618] text-[#042618] font-bold shadow-warm-sm"
                          : "bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-white hover:border-stone-300"
                      }`}
                    >
                      <h4 className="font-bold truncate mb-0.5">{report.title}</h4>
                      <span className="text-[10px] text-stone-500 block font-normal">
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
              <div className="grid md:grid-cols-2 gap-6 h-full">
                {/* File Preview */}
                <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden min-h-[420px] flex flex-col justify-center items-center relative shadow-warm-sm p-2">
                  {selectedReport.fileType === "application/pdf" ? (
                    <iframe
                      src={selectedReport.fileUrl}
                      className="w-full h-full min-h-[500px] border-none rounded-2xl"
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
                  <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
                      <FileText className="w-5 h-5 text-[#042618]" />
                      <h3 className="font-bold text-base text-[#042618]">
                        AI Plain-Language Analysis
                      </h3>
                    </div>
                    <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedReport.analysisStatus === "FAILED" ? (
                        <span className="text-rose-700 font-semibold bg-rose-50 p-4 rounded-2xl block border border-rose-200">
                          ⚠️ AI Analysis Failed — The automated analysis could not be completed for this file. Please try re-uploading a clearer document.
                        </span>
                      ) : (
                        selectedReport.aiSummary || "No summary analysis available."
                      )}
                    </div>
                  </div>

                  {/* Highlighted abnormal list */}
                  <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h3 className="font-bold text-base text-[#042618]">
                          Flagged Lab Values
                        </h3>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        {getAnomalies(selectedReport).length} Flagged
                      </span>
                    </div>

                    {getAnomalies(selectedReport).length === 0 ? (
                      <div className="p-5 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs text-stone-600 text-center font-medium">
                        No abnormal reference values flagged in this report.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {getAnomalies(selectedReport).map((anomaly, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col justify-between shadow-warm-sm"
                          >
                            <div>
                              <h4 className="font-bold text-[11px] text-stone-800 uppercase tracking-wider mb-1">
                                {anomaly.metric}
                              </h4>
                              <span className="text-base font-extrabold text-rose-700">
                                {anomaly.value}
                              </span>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex justify-between text-[10px] text-stone-600">
                              <span>Ref: {anomaly.range}</span>
                              <span className="text-rose-700 font-bold uppercase">{anomaly.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white border border-stone-200/80 rounded-3xl p-12 text-stone-500 text-xs shadow-warm-sm">
                Upload or select a lab report from the sidebar to view the diagnostic insights.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
