"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { administerVaccine } from "@/app/actions/health";

interface Vaccine {
  id: string;
  vaccineName: string;
  doseNumber: number;
  scheduledDate: string | Date;
  administeredDate: string | Date | null;
  administeredBy: string | null;
  status: string;
}

interface DoctorVaccinesViewProps {
  patientId: string;
  patientName: string;
  vaccines: Vaccine[];
  doctorUserId: string;
}

export default function DoctorVaccinesView({
  patientId,
  patientName,
  vaccines,
  doctorUserId,
}: DoctorVaccinesViewProps) {
  const router = useRouter();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [adminDates, setAdminDates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleAdminister = async (vaccineId: string) => {
    const dateStr = adminDates[vaccineId] || new Date().toISOString().split("T")[0];
    setLoadingId(vaccineId);
    setError(null);

    try {
      const res = await administerVaccine(doctorUserId, vaccineId, dateStr);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to mark vaccine as administered.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  const getVaccineStatus = (vaccine: Vaccine): "COMPLETED" | "DUE" | "MISSED" | "UPCOMING" => {
    if (vaccine.administeredDate) return "COMPLETED";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduled = new Date(vaccine.scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - scheduled.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) return "MISSED";
    if (daysDiff >= 0 && daysDiff <= 30) return "DUE";
    return "UPCOMING";
  };

  const categorized = vaccines.map((v) => ({ ...v, computedStatus: getVaccineStatus(v) }));

  const pendingList = categorized.filter((v) => v.computedStatus !== "COMPLETED");
  const completedList = categorized.filter((v) => v.computedStatus === "COMPLETED");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Immunization Checklist
            </h1>
            <p className="text-slate-400 text-sm">
              Record administered vaccines for patient:{" "}
              <span className="text-teal-400 font-semibold">{patientName}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard/appointments")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Appointments
          </button>
        </header>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-8 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Pending Vaccines list */}
          <section className="space-y-6">
            <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-3">
              ⏳ Pending / Due Doses
            </h3>

            {pendingList.length === 0 ? (
              <p className="text-xs text-slate-500">All scheduled vaccines have been marked as completed.</p>
            ) : (
              <div className="space-y-4">
                {pendingList.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white text-sm">{v.vaccineName}</h4>
                        <span className="text-[9px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-bold">
                          Dose {v.doseNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}
                        {v.computedStatus === "MISSED" && (
                          <span className="text-red-400 font-bold ml-2">⚠️ Missed / Overdue</span>
                        )}
                        {v.computedStatus === "DUE" && (
                          <span className="text-amber-400 font-bold ml-2">📅 Due Now</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <input
                        type="date"
                        value={adminDates[v.id] || new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setAdminDates((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                      <button
                        onClick={() => handleAdminister(v.id)}
                        disabled={loadingId === v.id}
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                      >
                        {loadingId === v.id ? "Recording..." : "Administer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Vaccines list */}
          <section className="space-y-6">
            <h3 className="font-bold text-lg text-teal-400 border-b border-slate-800 pb-3">
              ✓ Administered Records
            </h3>

            {completedList.length === 0 ? (
              <p className="text-xs text-slate-500">No vaccinations recorded for this profile yet.</p>
            ) : (
              <div className="space-y-4">
                {completedList.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 bg-slate-800/10 border border-slate-800/60 rounded-2xl"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-400 text-sm line-through">{v.vaccineName}</h4>
                        <span className="text-[9px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded font-bold inline-block mt-1">
                          Dose {v.doseNumber}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-slate-550 space-y-1">
                        <div>
                          Administered:{" "}
                          {v.administeredDate
                            ? new Date(v.administeredDate).toLocaleDateString()
                            : ""}
                        </div>
                        <div>By: {v.administeredBy || "Verified Clinic"}</div>
                      </div>
                    </div>
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
