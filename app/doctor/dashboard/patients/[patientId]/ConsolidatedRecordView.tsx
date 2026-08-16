"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
}

export default function ConsolidatedRecordView({
  patient,
  appointments,
  prescriptions,
  labReports,
  symptomSessions,
  metrics,
  vaccines,
}: ConsolidatedRecordViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "appointments" | "prescriptions" | "labs" | "symptoms" | "vitals" | "vaccines"
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
  const sugarData = getChartData("BLOOD_SUGAR");
  const sleepData = getChartData("SLEEP");
  const stepsData = getChartData("STEPS");
  const hrData = getChartData("HEART_RATE");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <span className="text-[10px] px-2.5 py-1 bg-teal-550/10 text-teal-400 font-bold rounded-full mb-2 inline-block">
              Audit Checked & Logged
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Consolidated Patient Record
            </h1>
            <p className="text-slate-400 text-sm">
              Patient: <span className="text-teal-400 font-bold">{patient.user.name}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard/appointments")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-8 shrink-0">
          {[
            { id: "profile", label: "👤 Profile" },
            { id: "appointments", label: "📅 Appointments" },
            { id: "prescriptions", label: "💊 Prescriptions" },
            { id: "labs", label: "📁 Lab Reports" },
            { id: "symptoms", label: "🧠 Symptom Triage" },
            { id: "vitals", label: "📊 Vitals & Charts" },
            ...(isChild ? [{ id: "vaccines", label: "🛡️ Vaccines" }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activeTab === tab.id
                  ? "bg-teal-500/10 border-teal-500/50 text-teal-400"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-grow">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/60 p-6 sm:p-8 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Patient Information Card</h3>
                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Date of Birth</span>
                    <span className="text-slate-200 font-semibold">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Gender</span>
                    <span className="text-slate-200 font-semibold">{patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Blood Group</span>
                    <span className="text-slate-200 font-semibold">{patient.bloodGroup || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Emergency Contact</span>
                    <span className="text-slate-200 font-semibold">{patient.emergencyContact}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Contact Phone</span>
                    <span className="text-slate-200 font-semibold">{patient.user.phone || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Email Address</span>
                    <span className="text-slate-200 font-semibold">{patient.user.email || "Not specified"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 text-xs block mb-1">Address</span>
                    <span className="text-slate-200 font-semibold">{patient.address || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-4">Appointment Log</h3>
              {appointments.length === 0 ? (
                <p className="text-slate-500 text-sm">No appointments on record for this patient.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-slate-400 text-xs font-semibold block">
                            {new Date(appt.scheduledAt).toLocaleString()}
                          </span>
                          <span className="text-slate-500 text-[10px] block mt-1">
                            Type: {appt.type}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-2.5 py-0.5 rounded font-bold ${
                            appt.status === "COMPLETED"
                              ? "bg-teal-500/20 text-teal-400"
                              : appt.status === "CONFIRMED"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-slate-350 text-xs italic bg-slate-900/40 p-3 rounded-xl">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>
                      {appt.consultation?.doctorNotes && (
                        <div className="border-t border-slate-700/50 pt-3">
                          <span className="text-[10px] text-slate-500 block mb-1">Doctor Consultation Notes</span>
                          <p className="text-slate-300 text-xs font-medium">
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
              <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-4">
                <h3 className="text-lg font-bold text-white">Prescription Index</h3>
                <span className="text-[10px] text-slate-500 italic">
                  Note: Includes prescriptions issued by any connected doctor
                </span>
              </div>

              {prescriptions.length === 0 ? (
                <p className="text-slate-500 text-sm">No prescriptions issued for this patient.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {prescriptions.map((p) => {
                    const meds = JSON.parse(p.medicines);
                    return (
                      <div
                        key={p.id}
                        className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div>
                              <span className="text-xs text-slate-400 font-semibold block">
                                Issued By: {p.doctor.user.name || "Doctor"}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                Date: {new Date(p.issuedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 border-t border-slate-750 pt-3 mb-6">
                            {meds.map((med: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start text-xs">
                                <div>
                                  <span className="font-bold text-slate-200">{med.name}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Dosage: {med.dosage} | Frequency: {med.frequency}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
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
                            className="w-full py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-center text-xs transition-colors block"
                          >
                            View PDF Copy
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
              <h3 className="text-lg font-bold text-white mb-4">Lab Reports & Diagnostics</h3>
              {labReports.length === 0 ? (
                <p className="text-slate-500 text-sm">No lab reports uploaded for this patient.</p>
              ) : (
                <div className="space-y-8">
                  {labReports.map((report) => {
                    const anomalies = report.aiFlaggedAnomalies
                      ? JSON.parse(report.aiFlaggedAnomalies)
                      : [];
                    return (
                      <div
                        key={report.id}
                        className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl grid md:grid-cols-2 gap-8"
                      >
                        {/* Original document link */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white text-sm">{report.title}</h4>
                            <span className="text-[10px] text-slate-500">
                              Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="aspect-[4/3] rounded-2xl border border-slate-750 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                            {report.fileUrl.endsWith(".pdf") ? (
                              <div className="text-center p-4">
                                <span className="text-3xl block mb-2">📄</span>
                                <span className="text-xs text-slate-400 font-semibold block mb-4">PDF Diagnostic Report</span>
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all inline-block"
                                >
                                  Open PDF document
                                </a>
                              </div>
                            ) : (
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
                            <span className="text-xs text-teal-400 font-bold block mb-1">AI Summary</span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {report.aiSummary || "Summary compiling..."}
                            </p>
                          </div>

                          {anomalies.length > 0 && (
                            <div>
                              <span className="text-xs text-red-400 font-bold block mb-3">
                                Flagged Abnormal Values
                              </span>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {anomalies.map((anom: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"
                                  >
                                    <div className="text-[10px] font-bold uppercase tracking-wider">
                                      {anom.metricName}
                                    </div>
                                    <div className="text-xs font-semibold mt-1">
                                      Value: {anom.recordedValue}{" "}
                                      <span className="text-[9px] text-slate-500 font-normal">
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
              <h3 className="text-lg font-bold text-white mb-4">Symptom Checker Sessions</h3>
              {symptomSessions.length === 0 ? (
                <p className="text-slate-500 text-sm">No symptom checker triage data recorded.</p>
              ) : (
                <div className="space-y-6">
                  {symptomSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl"
                    >
                      <div className="flex justify-between items-center border-b border-slate-750 pb-3 mb-4">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Session ID: {session.id}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Date: {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none text-xs text-slate-300 space-y-4">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {session.aiSummary || "No summary compiled for this session."}
                        </div>
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
                <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
                  <span className="text-slate-500 text-xs block mb-1">Target Weight Goal</span>
                  <span className="text-lg font-bold text-white">
                    {parsedGoals.weight ? `${parsedGoals.weight} kg` : "Not set"}
                  </span>
                </div>
                <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
                  <span className="text-slate-500 text-xs block mb-1">Steps Target</span>
                  <span className="text-lg font-bold text-white">
                    {parsedGoals.steps ? `${parsedGoals.steps.toLocaleString()} steps` : "Not set"}
                  </span>
                </div>
                <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
                  <span className="text-slate-500 text-xs block mb-1">Ideal Sleep</span>
                  <span className="text-lg font-bold text-white">
                    {parsedGoals.sleep ? `${parsedGoals.sleep} Hours` : "Not set"}
                  </span>
                </div>
              </div>

              {/* Vitals Charts */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Weight Chart */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
                  <h4 className="font-bold text-sm text-slate-350 mb-6">Weight progress (kg)</h4>
                  <div className="h-[200px] w-full">
                    {weightData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-600 font-semibold">
                        No weight logs.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient id="colorWeightR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                          <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="weight" stroke="#06b6d4" fill="url(#colorWeightR)" strokeWidth={2} name="Weight" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* BP Chart */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
                  <h4 className="font-bold text-sm text-slate-350 mb-6">Blood Pressure (mmHg)</h4>
                  <div className="h-[200px] w-full">
                    {bpData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-600 font-semibold">
                        No BP logs.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bpData}>
                          <defs>
                            <linearGradient id="colorBpR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                          <YAxis stroke="#475569" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="systolic" stroke="#14b8a6" fill="url(#colorBpR)" strokeWidth={2} name="Systolic" />
                          <Area type="monotone" dataKey="diastolic" stroke="#f43f5e" fill="none" strokeWidth={1.5} name="Diastolic" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Steps Chart */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
                  <h4 className="font-bold text-sm text-slate-350 mb-6">Daily Steps</h4>
                  <div className="h-[200px] w-full">
                    {stepsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-600 font-semibold">
                        No steps logged.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stepsData}>
                          <defs>
                            <linearGradient id="colorStepsR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                          <YAxis stroke="#475569" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="steps" stroke="#10b981" fill="url(#colorStepsR)" strokeWidth={2} name="Steps" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Heart Rate Chart */}
                <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
                  <h4 className="font-bold text-sm text-slate-350 mb-6">Heart Rate Trends</h4>
                  <div className="h-[200px] w-full">
                    {hrData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-600 font-semibold">
                        No BPM recordings.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hrData}>
                          <defs>
                            <linearGradient id="colorHrR" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                          <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="heartRate" stroke="#ec4899" fill="url(#colorHrR)" strokeWidth={2} name="BPM" />
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
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-white mb-4">India's UIP Immunization Schedule</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {vaccines.map((v) => {
                  const isCompleted = v.administeredDate !== null;
                  return (
                    <div
                      key={v.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCompleted
                          ? "bg-teal-500/5 border-teal-500/25"
                          : "bg-slate-800/40 border-slate-700/60"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4
                            className={`font-bold text-xs ${
                              isCompleted ? "text-slate-400 line-through" : "text-white"
                            }`}
                          >
                            {v.vaccineName}
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-bold inline-block mt-2">
                            Dose {v.doseNumber}
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 space-y-1">
                          {isCompleted ? (
                            <>
                              <div>
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
