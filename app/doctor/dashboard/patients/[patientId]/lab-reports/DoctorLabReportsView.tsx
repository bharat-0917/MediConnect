"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck, ShieldAlert } from "lucide-react";

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

interface DoctorLabReportsViewProps {
  patientName: string;
  reports: LabReport[];
}

export default function DoctorLabReportsView({
  patientName,
  reports,
}: DoctorLabReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(
    reports.length > 0 ? reports[0] : null
  );

  const getAnomalies = (report: LabReport): Anomaly[] => {
    if (!report.aiFlaggedAnomalies) return [];
    try {
      return JSON.parse(report.aiFlaggedAnomalies);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/doctor/dashboard/appointments" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Appointments</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Patient Diagnostic Reports & Analysis
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Viewing records for patient: <span className="text-[#042618] font-bold">{patientName}</span>
            </p>
          </div>
        </header>

        {/* Disclaimer banner */}
        <div className="mb-6 px-5 py-3.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2.5 shadow-warm-sm shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <p>
            <span className="font-bold text-amber-950">Clinical Disclaimer:</span> AI summaries are clinical decision-support notes generated from uploaded documents. Verify raw lab panels before formulating treatment plans.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 flex-grow">
          {/* Left panel: Report selector */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm flex-grow overflow-y-auto max-h-[450px]">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
                <FileCheck className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Uploaded Documents</h3>
              </div>

              {reports.length === 0 ? (
                <div className="text-center text-xs text-stone-500 py-6">
                  No lab reports uploaded by patient.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                        selectedReport?.id === report.id
                          ? "bg-[#E0F2E7] border-[#042618] text-[#042618] shadow-warm-sm font-bold"
                          : "bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-white"
                      }`}
                    >
                      <h4 className="text-xs truncate mb-1">{report.title}</h4>
                      <span className="text-[10px] text-stone-500 block font-normal font-mono">
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

          {/* Right panel: File display and explanation */}
          <div className="lg:col-span-3">
            {selectedReport ? (
              <div className="grid md:grid-cols-2 gap-6 h-full">
                {/* File Preview */}
                <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden min-h-[400px] flex flex-col justify-center items-center relative shadow-warm-sm p-4">
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
                      className="max-w-full max-h-[500px] object-contain rounded-2xl"
                    />
                  )}
                </div>

                {/* AI Explanation & Highlighted anomalies */}
                <div className="space-y-6">
                  <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                    <h3 className="font-bold text-sm text-[#042618] border-b border-stone-100 pb-3 mb-4">
                      AI Diagnostic Synopsis
                    </h3>
                    <div className="text-xs text-stone-700 leading-relaxed bg-[#F0F9F3] p-4 rounded-2xl border border-[#E0F2E7] whitespace-pre-wrap font-sans">
                      {selectedReport.aiSummary || "No summary analysis available."}
                    </div>
                  </div>

                  {/* Highlighted abnormal list */}
                  <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                      <h3 className="font-bold text-sm text-[#042618]">
                        Flagged Abnormal Values
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        {getAnomalies(selectedReport).length} Flagged
                      </span>
                    </div>

                    {getAnomalies(selectedReport).length === 0 ? (
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-500 text-center">
                        No abnormal reference values flagged in this report.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {getAnomalies(selectedReport).map((anomaly, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-850 flex flex-col justify-between"
                          >
                            <div>
                              <h4 className="font-bold text-[11px] uppercase tracking-wider mb-1 text-rose-900">
                                {anomaly.metric}
                              </h4>
                              <span className="text-base font-extrabold text-rose-700">
                                {anomaly.value}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-rose-200/60 flex justify-between text-[10px] text-rose-700">
                              <span>Ref: {anomaly.range}</span>
                              <span className="font-bold uppercase">{anomaly.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white border border-stone-200/80 rounded-3xl p-12 text-stone-400 text-xs shadow-warm-sm">
                Select a diagnostic report from the left panel to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
