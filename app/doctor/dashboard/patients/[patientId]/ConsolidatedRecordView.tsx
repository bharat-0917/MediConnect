"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Calendar, 
  Pill, 
  FileText, 
  Activity, 
  ShieldCheck, 
  ArrowLeft, 
  Brain,
  FileCheck,
  History
} from "lucide-react";
import PatientMedicalRecordSection, { MedicalRecordItem } from "./PatientMedicalRecordSection";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface AnomalyItem {
  metricName: string;
  recordedValue: string;
  referenceRange: string;
}

interface AppointmentRow {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | Date;
  reasonForVisit: string;
  consultation: {
    doctorNotes: string | null;
  } | null;
}

interface PrescriptionRow {
  id: string;
  medicines: string;
  pdfUrl: string | null;
  issuedAt: string | Date;
  doctor: {
    user: {
      name: string | null;
    };
  };
}

interface LabReportRow {
  id: string;
  title: string;
  fileUrl: string;
  aiSummary: string | null;
  aiFlaggedAnomalies: string | null;
  analysisStatus?: string;
  uploadedAt: string | Date;
}

interface SymptomSessionRow {
  id: string;
  aiSummary: string | null;
  createdAt: string | Date;
}

interface MetricRow {
  id: string;
  type: string;
  value: string;
  recordedAt: string | Date;
}

interface VaccineRow {
  id: string;
  vaccineName: string;
  doseNumber: number;
  scheduledDate: string | Date;
  administeredDate: string | Date | null;
  administeredBy: string | null;
}

interface ConsolidatedRecordViewProps {
  patient: {
    id: string;
    dateOfBirth: string | Date;
    gender: string;
    bloodGroup: string | null;
    emergencyContact: string;
    address: string | null;
    goals: string | null;
    guardianUserId: string | null;
    user: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  appointments: AppointmentRow[];
  prescriptions: PrescriptionRow[];
  labReports: LabReportRow[];
  symptomSessions: SymptomSessionRow[];
  metrics: MetricRow[];
  vaccines: VaccineRow[];
  medicalRecords?: MedicalRecordItem[];
}

export default function ConsolidatedRecordView({
  patient,
  appointments,
  prescriptions,
  labReports,
  symptomSessions,
  metrics,
  vaccines,
  medicalRecords = [],
}: ConsolidatedRecordViewProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "medical-history" | "appointments" | "prescriptions" | "labs" | "symptoms" | "vitals" | "vaccines"
  >("profile");

  const parsedGoals = patient.goals ? JSON.parse(patient.goals) : {};
  const isChild = patient.guardianUserId !== null;

  // Chart data helpers
  const getChartData = (type: string) => {
    const filtered = metrics.filter((m) => m.type === type);
    return filtered.map((m) => {
      const val = JSON.parse(m.value);
      const d = new Date(m.recordedAt);
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        ...val,
      };
    });
  };

  const weightData = getChartData("WEIGHT");
  const bpData = getChartData("BLOOD_PRESSURE");
  const stepsData = getChartData("STEPS");
  const hrData = getChartData("HEART_RATE");

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/doctor/dashboard/appointments" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Appointments</span>
              </Link>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#E0F2E7] text-[#042618] font-bold rounded-full border border-[#C1E5D0]">
                Audit Access Logged
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Consolidated Patient Record
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Patient: <span className="text-[#042618] font-bold">{patient.user.name}</span>
            </p>
          </div>

          <Link
            href={`/doctor/dashboard/patients/${patient.id}/prescribe`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md w-fit shrink-0"
          >
            <Pill className="w-4 h-4" />
            <span>+ Issue Digital Prescription</span>
          </Link>
        </header>

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-stone-200/80 pb-4 mb-8 shrink-0">
          {[
            { id: "profile", label: "Profile & Demographics", icon: User },
            { id: "medical-history", label: "Patient Medical Record (PMR)", icon: History },
            { id: "appointments", label: "Appointments", icon: Calendar },
            { id: "prescriptions", label: "Prescriptions", icon: Pill },
            { id: "labs", label: "Lab Reports", icon: FileText },
            { id: "symptoms", label: "Symptom Triage", icon: Brain },
            { id: "vitals", label: "Vitals & Trends", icon: Activity },
            ...(isChild ? [{ id: "vaccines", label: "Vaccines", icon: ShieldCheck }] : []),
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl border transition-all ${
                  isActive
                    ? "bg-[#042618] text-white border-[#042618] shadow-warm-sm"
                    : "bg-white border-stone-200/80 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-[#E0F2E7]" : "text-stone-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-grow">
          {/* PATIENT MEDICAL RECORD (PMR) TAB */}
          {activeTab === "medical-history" && (
            <PatientMedicalRecordSection
              patientId={patient.id}
              patientName={patient.user.name || "Patient"}
              initialRecords={medicalRecords}
              allowAdd={true}
            />
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <User className="w-5 h-5 text-[#042618]" />
                  <h3 className="text-base font-bold text-[#042618]">Patient Demographics Card</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Date of Birth</span>
                    <span className="text-stone-900 font-bold text-sm">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Gender</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Blood Group</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.bloodGroup || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Emergency Contact</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.emergencyContact}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Contact Phone</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.user.phone || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1 font-medium">Email Address</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.user.email || "Not specified"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-stone-500 block mb-1 font-medium">Home Address</span>
                    <span className="text-stone-900 font-bold text-sm">{patient.address || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#042618]" />
                <h3 className="text-base font-bold text-[#042618]">Appointment Log</h3>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                  No appointments on record for this patient.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-stone-900 text-xs font-bold block">
                            {new Date(appt.scheduledAt).toLocaleString()}
                          </span>
                          <span className="text-stone-500 text-[11px] block mt-0.5">
                            Mode: {appt.type}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            appt.status === "COMPLETED"
                              ? "bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]"
                              : appt.status === "CONFIRMED"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-stone-700 text-xs italic bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>
                      {appt.consultation?.doctorNotes && (
                        <div className="border-t border-stone-100 pt-3">
                          <span className="text-[11px] text-stone-500 block mb-1 font-bold">Consultation Notes</span>
                          <p className="text-stone-800 text-xs leading-relaxed">
                            {appt.consultation.doctorNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTIONS TAB */}
          {activeTab === "prescriptions" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#042618]" />
                  <h3 className="text-base font-bold text-[#042618]">Prescription History</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-500 italic hidden md:inline">
                    Reflects prescriptions issued by all connected practitioners
                  </span>
                  <Link
                    href={`/doctor/dashboard/patients/${patient.id}/prescribe`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E0F2E7] hover:bg-[#C1E5D0] text-[#042618] font-bold rounded-xl text-xs transition-all border border-[#C1E5D0]"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>+ Issue New Prescription</span>
                  </Link>
                </div>
              </div>

              {prescriptions.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                  No prescriptions issued for this patient.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {prescriptions.map((p) => {
                    const meds = JSON.parse(p.medicines);
                    return (
                      <div
                        key={p.id}
                        className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3 pb-3 border-b border-stone-100">
                            <div>
                              <span className="text-xs text-stone-900 font-bold block">
                                Issued By: Dr. {p.doctor.user.name || "Doctor"}
                              </span>
                              <span className="text-[11px] text-stone-500 block mt-0.5">
                                Date: {new Date(p.issuedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2.5 mb-6">
                            {(meds as Medicine[]).map((med, idx: number) => (
                              <div key={idx} className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/70 flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-stone-900 block">{med.name}</span>
                                  <span className="text-[11px] text-stone-600 block">
                                    {med.dosage} • {med.frequency}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
                                  {med.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {p.pdfUrl && (
                          <a
                            href={p.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl text-center text-xs transition-colors block"
                          >
                            View Signed PDF
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LAB REPORTS TAB */}
          {activeTab === "labs" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-[#042618]" />
                <h3 className="text-base font-bold text-[#042618]">Lab Reports & AI Diagnostics</h3>
              </div>

              {labReports.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                  No lab reports uploaded for this patient.
                </div>
              ) : (
                <div className="space-y-6">
                  {labReports.map((report) => {
                    const anomalies = report.aiFlaggedAnomalies
                      ? JSON.parse(report.aiFlaggedAnomalies)
                      : [];
                    return (
                      <div
                        key={report.id}
                        className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm grid md:grid-cols-2 gap-8"
                      >
                        {/* Original document link */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-stone-900 text-sm">{report.title}</h4>
                            <span className="text-[11px] text-stone-500 font-mono">
                              {new Date(report.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="aspect-[4/3] rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center relative overflow-hidden">
                            {report.fileUrl.endsWith(".pdf") ? (
                              <div className="text-center p-4">
                                <FileText className="w-10 h-10 text-[#042618] mx-auto mb-2" />
                                <span className="text-xs text-stone-600 font-semibold block mb-4">PDF Diagnostic Report</span>
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-xl text-xs shadow-warm-sm transition-all inline-block"
                                >
                                  Open PDF Document
                                </a>
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={report.fileUrl}
                                alt="Report Preview"
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                        </div>

                        {/* AI Summary and Anomalies */}
                        <div className="space-y-6">
                          <div>
                            <span className="text-xs text-[#042618] font-bold block mb-1">AI Clinical Summary</span>
                            <div className="text-xs text-stone-700 leading-relaxed bg-[#F0F9F3] p-4 rounded-2xl border border-[#E0F2E7]">
                              {report.analysisStatus === "FAILED" ? (
                                <span className="text-rose-700 font-semibold">
                                  ⚠️ AI Analysis Failed for this report.
                                </span>
                              ) : (
                                report.aiSummary || "Summary compiling..."
                              )}
                            </div>
                          </div>

                          {anomalies.length > 0 && (
                            <div>
                              <span className="text-xs text-rose-700 font-bold block mb-3">
                                Flagged Reference Anomalies
                              </span>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {(anomalies as AnomalyItem[]).map((anom, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-rose-50/80 border border-rose-200 text-rose-800 rounded-xl"
                                  >
                                    <div className="text-[10px] font-bold uppercase tracking-wider">
                                      {anom.metricName}
                                    </div>
                                    <div className="text-xs font-bold mt-0.5">
                                      {anom.recordedValue}{" "}
                                      <span className="text-[10px] text-stone-500 font-normal">
                                        (Ref: {anom.referenceRange})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SYMPTOM CHECKER TAB */}
          {activeTab === "symptoms" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-[#042618]" />
                <h3 className="text-base font-bold text-[#042618]">AI Symptom Checker Sessions</h3>
              </div>

              {symptomSessions.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                  No symptom checker triage records recorded for this patient.
                </div>
              ) : (
                <div className="space-y-6">
                  {symptomSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm"
                    >
                      <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-4">
                        <span className="text-[11px] text-stone-500 font-mono">
                          Session: {session.id}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Date: {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#F0F9F3] border border-[#E0F2E7] p-5 rounded-2xl text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                        {session.aiSummary || "No summary compiled for this session."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VITALS & CHARTS TAB */}
          {activeTab === "vitals" && (
            <div className="space-y-8">
              {/* Goals Summary */}
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
                  <span className="text-stone-500 text-xs block mb-1 font-medium">Target Weight</span>
                  <span className="text-lg font-extrabold text-[#042618]">
                    {parsedGoals.weight ? `${parsedGoals.weight} kg` : "Not set"}
                  </span>
                </div>
                <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
                  <span className="text-stone-500 text-xs block mb-1 font-medium">Daily Steps Target</span>
                  <span className="text-lg font-extrabold text-[#042618]">
                    {parsedGoals.steps ? `${parsedGoals.steps.toLocaleString()} steps` : "Not set"}
                  </span>
                </div>
                <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
                  <span className="text-stone-500 text-xs block mb-1 font-medium">Sleep Target</span>
                  <span className="text-lg font-extrabold text-[#042618]">
                    {parsedGoals.sleep ? `${parsedGoals.sleep} Hours` : "Not set"}
                  </span>
                </div>
              </div>

              {/* Vitals Charts */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Weight Chart */}
                <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
                  <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Weight Progress (kg)</h4>
                  <div className="h-[200px] w-full">
                    {weightData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                        No weight logs recorded.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient id="colorWeightR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#042618" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#042618" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="weight" stroke="#042618" fill="url(#colorWeightR)" strokeWidth={2} name="Weight" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* BP Chart */}
                <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
                  <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Blood Pressure (mmHg)</h4>
                  <div className="h-[200px] w-full">
                    {bpData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                        No BP logs recorded.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bpData}>
                          <defs>
                            <linearGradient id="colorBpR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#27794D" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#27794D" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="systolic" stroke="#27794D" fill="url(#colorBpR)" strokeWidth={2} name="Systolic" />
                          <Area type="monotone" dataKey="diastolic" stroke="#e11d48" fill="none" strokeWidth={1.5} name="Diastolic" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Steps Chart */}
                <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
                  <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Daily Steps</h4>
                  <div className="h-[200px] w-full">
                    {stepsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                        No steps logged.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stepsData}>
                          <defs>
                            <linearGradient id="colorStepsR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="steps" stroke="#10b981" fill="url(#colorStepsR)" strokeWidth={2} name="Steps" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Heart Rate Chart */}
                <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
                  <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Heart Rate Trends</h4>
                  <div className="h-[200px] w-full">
                    {hrData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                        No BPM recordings.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hrData}>
                          <defs>
                            <linearGradient id="colorHrR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                          <Area type="monotone" dataKey="heartRate" stroke="#e11d48" fill="url(#colorHrR)" strokeWidth={2} name="BPM" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VACCINES TAB */}
          {activeTab === "vaccines" && isChild && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#042618]" />
                <h3 className="text-base font-bold text-[#042618]">Universal Immunization Schedule (UIP)</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {vaccines.map((v) => {
                  const isCompleted = v.administeredDate !== null;
                  return (
                    <div
                      key={v.id}
                      className={`p-5 rounded-3xl border transition-all ${
                        isCompleted
                          ? "bg-[#E0F2E7]/40 border-[#C1E5D0]"
                          : "bg-white border-stone-200/80 shadow-warm-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4
                            className={`font-bold text-xs ${
                              isCompleted ? "text-stone-500 line-through" : "text-stone-900"
                            }`}
                          >
                            {v.vaccineName}
                          </h4>
                          <span className="text-[10px] px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full font-bold inline-block mt-2">
                            Dose {v.doseNumber}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-stone-500 space-y-0.5">
                          {isCompleted ? (
                            <>
                              <div className="font-bold text-[#042618]">
                                Administered:{" "}
                                {new Date(v.administeredDate!).toLocaleDateString()}
                              </div>
                              <div>By: {v.administeredBy || "Verified Clinic"}</div>
                            </>
                          ) : (
                            <div>Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
