"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  medicines: string; // JSON string
  pdfUrl: string | null;
  issuedAt: string;
  doctor: {
    specialization: string;
    user: {
      name: string;
    };
  };
}

export default function PatientPrescriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchPrescriptions = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch("/api/patient/prescriptions");
        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data);
        }
      } catch (err) {
        console.error("Failed to load prescriptions:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [session]);

  const parseMedications = (jsonStr: string): Medication[] => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const getPrescriptionStatus = (issuedAt: string, medications: Medication[]): "ACTIVE" | "PAST" => {
    const createdTime = new Date(issuedAt).getTime();
    let maxDurationDays = 7; // default 7 days fallback

    medications.forEach((med) => {
      const match = med.duration.match(/(\d+)\s*(day|week|month)/i);
      if (match) {
        const count = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let days = count;
        if (unit.startsWith("week")) days = count * 7;
        if (unit.startsWith("month")) days = count * 30;
        if (days > maxDurationDays) maxDurationDays = days;
      }
    });

    const expiryTime = createdTime + maxDurationDays * 24 * 60 * 60 * 1000;
    return Date.now() < expiryTime ? "ACTIVE" : "PAST";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Prescriptions...</div>
      </div>
    );
  }

  const categorized = prescriptions.map((p) => {
    const meds = parseMedications(p.medicines);
    const state = getPrescriptionStatus(p.issuedAt, meds);
    return { ...p, meds, state };
  });

  const activePrescriptions = categorized.filter((p) => p.state === "ACTIVE");
  const pastPrescriptions = categorized.filter((p) => p.state === "PAST");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Digital Prescriptions
            </h1>
            <p className="text-slate-400 text-sm">Access, download, or print active and historical prescriptions</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Prescription Sections */}
        <div className="space-y-12">
          {/* Active section */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              🟢 Active Prescriptions
              {activePrescriptions.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-semibold">
                  Current Course
                </span>
              )}
            </h2>

            {activePrescriptions.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                No active prescription courses currently.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-8">
                {activePrescriptions.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-white">{appt.doctor.user.name}</h3>
                          <p className="text-xs text-slate-500">{appt.doctor.specialization}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Issued: {new Date(appt.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Meds list */}
                      <div className="space-y-4 border-t border-slate-800 pt-4 mb-6">
                        {appt.meds.map((med, idx) => (
                          <div key={idx} className="flex justify-between items-start text-sm">
                            <div>
                              <span className="font-bold text-slate-200">{med.name}</span>
                              <span className="text-xs text-slate-400 block">
                                Dosage: {med.dosage} | Frequency: {med.frequency}
                              </span>
                            </div>
                            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                              {med.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {appt.pdfUrl && (
                      <a
                        href={appt.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl text-center text-sm shadow-md transition-all block"
                      >
                        Download PDF Prescription
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past section */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6">📁 Historical Prescriptions</h2>

            {pastPrescriptions.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                No past prescription logs.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-8">
                {pastPrescriptions.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 bg-slate-800/20 border border-slate-800 rounded-3xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-400">{appt.doctor.user.name}</h3>
                          <p className="text-xs text-slate-650">{appt.doctor.specialization}</p>
                        </div>
                        <span className="text-[10px] text-slate-650">
                          Issued: {new Date(appt.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Meds list */}
                      <div className="space-y-4 border-t border-slate-800 pt-4 mb-6">
                        {appt.meds.map((med, idx) => (
                          <div key={idx} className="flex justify-between items-start text-sm">
                            <div>
                              <span className="font-bold text-slate-400">{med.name}</span>
                              <span className="text-xs text-slate-550 block">
                                Dosage: {med.dosage} | Frequency: {med.frequency}
                              </span>
                            </div>
                            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-500 font-semibold">
                              {med.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {appt.pdfUrl && (
                      <a
                        href={appt.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl text-center text-sm transition-colors block"
                      >
                        Download Copy
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
