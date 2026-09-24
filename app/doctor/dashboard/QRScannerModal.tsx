"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, QrCode, ScanLine, AlertCircle, Loader2, User, Calendar, Pill, FileText, Activity, ShieldCheck, Brain, FileCheck, History } from "lucide-react";
import Link from "next/link";
import PatientMedicalRecordSection, { MedicalRecordItem } from "./patients/[patientId]/PatientMedicalRecordSection";

/* ─────────────────────────────────────────────────────── */
/*  Types (mirrors ConsolidatedRecordView shapes)          */
/* ─────────────────────────────────────────────────────── */
interface Medicine { name: string; dosage: string; frequency: string; duration: string; }
interface AnomalyItem { metricName: string; recordedValue: string; referenceRange: string; }

interface PatientData {
  id: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  emergencyContact: string;
  address: string | null;
  goals: string | null;
  guardianUserId: string | null;
  user: { name: string | null; email: string | null; phone: string | null };
}

interface AppointmentRow {
  id: string; type: string; status: string; scheduledAt: string;
  reasonForVisit: string;
  consultation: { doctorNotes: string | null } | null;
}

interface PrescriptionRow {
  id: string; medicines: string; pdfUrl: string | null; issuedAt: string;
  doctor: { user: { name: string | null } };
}

interface LabReportRow {
  id: string; title: string; fileUrl: string;
  aiSummary: string | null; aiFlaggedAnomalies: string | null;
  analysisStatus?: string; uploadedAt: string;
}

interface SymptomSessionRow { id: string; aiSummary: string | null; createdAt: string; }
interface MetricRow { id: string; type: string; value: string; recordedAt: string; }
interface VaccineRow {
  id: string; vaccineName: string; doseNumber: number;
  scheduledDate: string; administeredDate: string | null; administeredBy: string | null;
}

interface ScanResult {
  patient: PatientData;
  appointments: AppointmentRow[];
  prescriptions: PrescriptionRow[];
  labReports: LabReportRow[];
  symptomSessions: SymptomSessionRow[];
  metrics: MetricRow[];
  vaccines: VaccineRow[];
  medicalRecords?: MedicalRecordItem[];
}

/* ─────────────────────────────────────────────────────── */
/*  QR Scanner Modal                                       */
/* ─────────────────────────────────────────────────────── */
interface QRScannerModalProps {
  onClose: () => void;
}

export default function QRScannerModal({ onClose }: QRScannerModalProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "medical-history" | "appointments" | "prescriptions" | "labs" | "symptoms">("profile");
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const scannerDivId = "qr-scanner-container";

  const fetchPatientData = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/doctor/scan-patient?patientId=${encodeURIComponent(patientId.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load patient data.");
        return;
      }
      setScanResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Start camera scanner
  useEffect(() => {
    if (mode !== "camera" || scanResult) return;

    let html5QrCode: { start: (...args: unknown[]) => Promise<void>; stop: () => Promise<void> } | null = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        html5QrCode = new Html5Qrcode(scannerDivId) as any;
        scannerRef.current = html5QrCode;

        await html5QrCode!.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText: string) => {
            // Stop scanner after first successful scan
            await html5QrCode?.stop();
            fetchPatientData(decodedText);
          },
          undefined
        );
        setCameraReady(true);
      } catch (err) {
        console.error("Camera start error:", err);
        setMode("manual");
        setError("Camera could not be accessed. Please enter the Patient ID manually.");
      }
    };

    startScanner();

    return () => {
      html5QrCode?.stop().catch(() => {});
    };
  }, [mode, scanResult, fetchPatientData]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    fetchPatientData(manualId);
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setManualId("");
    setLoading(false);
    setActiveTab("profile");
    setCameraReady(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200/80 rounded-3xl w-full max-w-3xl my-6 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#042618]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#042618]">Scan Patient QR Code</h2>
              <p className="text-stone-500 text-xs">Walk-in consultation — access logged automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow overflow-y-auto">
          {/* ── State: Scan Result ── */}
          {scanResult ? (
            <div className="space-y-6">
              {/* Patient name banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#E0F2E7]/50 rounded-2xl border border-[#C1E5D0]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#042618] text-white rounded-full">QR Scanned</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">Audit Logged</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#042618]">{scanResult.patient.user.name}</h3>
                  <p className="text-stone-500 text-xs font-mono">{scanResult.patient.id}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/doctor/dashboard/patients/${scanResult.patient.id}/prescribe`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Issue Prescription</span>
                  </Link>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-all"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-stone-200/80 pb-4">
                {[
                  { id: "profile", label: "Profile", icon: User },
                  { id: "medical-history", label: "Patient Medical Record (PMR)", icon: History },
                  { id: "appointments", label: "Appointments", icon: Calendar },
                  { id: "prescriptions", label: "Prescriptions", icon: Pill },
                  { id: "labs", label: "Lab Reports", icon: FileText },
                  { id: "symptoms", label: "Symptom Triage", icon: Brain },
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        isActive
                          ? "bg-[#042618] text-white border-[#042618]"
                          : "bg-white border-stone-200/80 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <IconComp className={`w-3 h-3 ${isActive ? "text-[#E0F2E7]" : "text-stone-500"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* PMR Tab Content */}
              {activeTab === "medical-history" && (
                <PatientMedicalRecordSection
                  patientId={scanResult.patient.id}
                  patientName={scanResult.patient.user.name || "Patient"}
                  initialRecords={scanResult.medicalRecords || []}
                  allowAdd={true}
                />
              )}

              {/* Tab Content */}
              {activeTab === "profile" && (
                <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-5">
                  <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Date of Birth</span>
                      <span className="text-stone-900 font-bold text-sm">{new Date(scanResult.patient.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Gender</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.gender}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Blood Group</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.bloodGroup || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Emergency Contact</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.emergencyContact}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Phone</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.user.phone || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block mb-0.5 font-medium">Email</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.user.email || "Not specified"}</span>
                    </div>
                    <div className="sm:col-span-2 border-t border-stone-200/60 pt-3 mt-1">
                      <span className="text-stone-500 block mb-0.5 font-medium">Home Address</span>
                      <span className="text-stone-900 font-bold text-sm">{scanResult.patient.address || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appointments" && (
                <div className="space-y-4">
                  {scanResult.appointments.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-stone-200/80 rounded-2xl text-stone-500 text-xs">No appointments on record.</div>
                  ) : (
                    <div className="space-y-3">
                      {scanResult.appointments.slice(0, 5).map((appt) => (
                        <div key={appt.id} className="p-4 bg-white border border-stone-200/80 rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-stone-900 block">{new Date(appt.scheduledAt).toLocaleString()}</span>
                              <span className="text-stone-500">{appt.type}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              appt.status === "COMPLETED" ? "bg-[#E0F2E7] text-[#042618]" :
                              appt.status === "CONFIRMED" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"
                            }`}>{appt.status}</span>
                          </div>
                          <p className="italic text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">&ldquo;{appt.reasonForVisit}&rdquo;</p>
                          {appt.consultation?.doctorNotes && (
                            <div className="border-t border-stone-100 pt-2">
                              <span className="font-bold text-[#042618] block mb-0.5">Consultation Notes</span>
                              <p className="text-stone-700">{appt.consultation.doctorNotes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "prescriptions" && (
                <div className="space-y-4">
                  {scanResult.prescriptions.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-stone-200/80 rounded-2xl text-stone-500 text-xs">No prescriptions on record.</div>
                  ) : (
                    <div className="space-y-3">
                      {scanResult.prescriptions.map((p) => {
                        const meds = JSON.parse(p.medicines) as Medicine[];
                        return (
                          <div key={p.id} className="p-4 bg-white border border-stone-200/80 rounded-2xl text-xs">
                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-stone-100">
                              <span className="font-bold text-stone-900">By: Dr. {p.doctor.user.name || "Doctor"}</span>
                              <span className="text-stone-500">{new Date(p.issuedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="space-y-2">
                              {meds.map((med, idx) => (
                                <div key={idx} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-stone-900 block">{med.name}</span>
                                    <span className="text-stone-500">{med.dosage} • {med.frequency}</span>
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 bg-[#E0F2E7] text-[#042618] font-bold rounded-lg border border-[#C1E5D0]">{med.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "labs" && (
                <div className="space-y-4">
                  {scanResult.labReports.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-stone-200/80 rounded-2xl text-stone-500 text-xs">No lab reports uploaded.</div>
                  ) : (
                    <div className="space-y-4">
                      {scanResult.labReports.map((report) => {
                        const anomalies: AnomalyItem[] = report.aiFlaggedAnomalies ? JSON.parse(report.aiFlaggedAnomalies) : [];
                        return (
                          <div key={report.id} className="p-5 bg-white border border-stone-200/80 rounded-2xl text-xs space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-stone-900">{report.title}</span>
                              <span className="text-stone-500 font-mono">{new Date(report.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-[#F0F9F3] border border-[#E0F2E7] p-3 rounded-xl text-stone-700 leading-relaxed">
                              {report.analysisStatus === "FAILED" ? (
                                <span className="text-rose-700 font-semibold">⚠️ AI Analysis Failed.</span>
                              ) : (report.aiSummary || "Summary compiling...")}
                            </div>
                            {anomalies.length > 0 && (
                              <div className="grid sm:grid-cols-2 gap-2">
                                {anomalies.map((anom, idx) => (
                                  <div key={idx} className="p-2.5 bg-rose-50/80 border border-rose-200 text-rose-800 rounded-xl">
                                    <div className="text-[10px] font-bold uppercase">{anom.metricName}</div>
                                    <div className="font-bold mt-0.5">{anom.recordedValue} <span className="text-[10px] font-normal text-stone-500">(Ref: {anom.referenceRange})</span></div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "symptoms" && (
                <div className="space-y-4">
                  {scanResult.symptomSessions.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-stone-200/80 rounded-2xl text-stone-500 text-xs">No symptom checker sessions recorded.</div>
                  ) : (
                    scanResult.symptomSessions.map((session) => (
                      <div key={session.id} className="p-5 bg-white border border-stone-200/80 rounded-2xl text-xs space-y-3">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                          <span className="text-stone-500 font-mono">Session: {session.id.slice(0, 12)}...</span>
                          <span className="text-stone-500">{new Date(session.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-[#F0F9F3] border border-[#E0F2E7] p-4 rounded-xl text-stone-800 whitespace-pre-wrap leading-relaxed">
                          {session.aiSummary || "No summary available."}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── State: Scanner / Input ── */
            <div className="space-y-6">
              {/* Mode Switcher */}
              <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl w-fit">
                <button
                  onClick={() => { setMode("camera"); setError(null); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === "camera" ? "bg-white shadow-warm-sm text-[#042618]" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Camera Scan
                </button>
                <button
                  onClick={() => { setMode("manual"); setError(null); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === "manual" ? "bg-white shadow-warm-sm text-[#042618]" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Enter ID
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Camera Mode */}
              {mode === "camera" && !loading && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500">
                    Point your camera at the patient&apos;s QR code displayed on their MediConnect health card.
                  </p>
                  <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center">
                    <div id={scannerDivId} className="w-full h-full" />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E0F2E7]" />
                        <span className="text-xs font-medium">Starting camera...</span>
                      </div>
                    )}
                    {/* Scan Frame Overlay */}
                    {cameraReady && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-52 h-52 border-2 border-[#E0F2E7] rounded-2xl relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#E0F2E7] rounded-tl-xl" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#E0F2E7] rounded-tr-xl" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#E0F2E7] rounded-bl-xl" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#E0F2E7] rounded-br-xl" />
                          {/* Scan line animation */}
                          <div className="absolute left-0 right-0 h-0.5 bg-[#E0F2E7]/70 animate-scan-line" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Entry Mode */}
              {mode === "manual" && !loading && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-2">Patient Profile ID</label>
                    <p className="text-xs text-stone-400 mb-3">Found on the patient&apos;s QR code card (below the QR image).</p>
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      placeholder="e.g. clxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200/80 rounded-2xl text-sm font-mono text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualId.trim()}
                    className="w-full py-3 bg-[#042618] hover:bg-[#073824] disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold rounded-2xl text-sm transition-all shadow-warm-sm"
                  >
                    Load Patient Record
                  </button>
                </form>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="w-14 h-14 rounded-3xl bg-[#E0F2E7] flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-[#042618] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#042618] text-sm">Loading Patient Record...</p>
                    <p className="text-stone-500 text-xs mt-1">Creating audit log entry</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
