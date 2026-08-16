"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pill, Download, ArrowLeft, Clock, HeartPulse } from "lucide-react";

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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Prescriptions...</div>
        </div>
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
              Digital Prescriptions
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Access dosage schedules, verify clinical instructions, and download official PDF prescriptions</p>
          </div>
        </header>

        {/* Prescription Sections */}
        <div className="space-y-10">
          {/* Active section */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm">
                <Pill className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#042618]">
                Active Prescription Courses
              </h2>
              {activePrescriptions.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
                  {activePrescriptions.length} Active
                </span>
              )}
            </div>

            {activePrescriptions.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No active prescription regimens at this time.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {activePrescriptions.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-stone-100">
                        <div>
                          <h3 className="font-bold text-base text-[#042618]">Dr. {appt.doctor.user.name}</h3>
                          <p className="text-xs text-[#0F3824] font-medium">{appt.doctor.specialization}</p>
                        </div>
                        <span className="text-[11px] text-stone-500 font-mono bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
                          {new Date(appt.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Meds list */}
                      <div className="space-y-3 mb-6">
                        {appt.meds.map((med, idx) => (
                          <div key={idx} className="p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/70 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-stone-900 block">{med.name}</span>
                              <span className="text-[11px] text-stone-600 block mt-0.5">
                                {med.dosage} • {med.frequency}
                              </span>
                            </div>
                            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
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
                        className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-center text-xs shadow-warm-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Signed PDF</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past section */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-stone-500" />
              <h2 className="text-lg font-bold text-stone-700">Past & Completed Prescriptions</h2>
            </div>

            {pastPrescriptions.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No past prescription archives found.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {pastPrescriptions.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 bg-white/70 border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-stone-100">
                        <div>
                          <h3 className="font-bold text-sm text-stone-700">Dr. {appt.doctor.user.name}</h3>
                          <p className="text-xs text-stone-500">{appt.doctor.specialization}</p>
                        </div>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {new Date(appt.issuedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Meds list */}
                      <div className="space-y-2.5 mb-6">
                        {appt.meds.map((med, idx) => (
                          <div key={idx} className="p-3 bg-stone-50/50 rounded-xl border border-stone-200/60 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-stone-700 block">{med.name}</span>
                              <span className="text-[11px] text-stone-500 block">
                                {med.dosage} • {med.frequency}
                              </span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-medium">
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
                        className="w-full py-2.5 bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-bold rounded-2xl text-center text-xs transition-colors block"
                      >
                        Download Archive Copy
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
