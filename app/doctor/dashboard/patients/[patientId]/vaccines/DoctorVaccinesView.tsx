"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, ArrowLeft } from "lucide-react";
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
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Immunization Checklist & Administration
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Record administered doses for dependent: <span className="text-[#042618] font-bold">{patientName}</span>
            </p>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl mb-8 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Vaccines list */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200/80">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-base text-[#042618]">
                Pending & Due Doses
              </h3>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                All scheduled vaccines have been marked as completed.
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingList.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-[#042618] text-xs">{v.vaccineName}</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full font-bold">
                          Dose {v.doseNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 font-mono">
                        Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}
                        {v.computedStatus === "MISSED" && (
                          <span className="text-rose-700 font-bold ml-2">⚠️ Overdue</span>
                        )}
                        {v.computedStatus === "DUE" && (
                          <span className="text-amber-700 font-bold ml-2">📅 Due Now</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <input
                        type="date"
                        value={adminDates[v.id] || new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setAdminDates((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="bg-stone-50/70 border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                      />
                      <button
                        onClick={() => handleAdminister(v.id)}
                        disabled={loadingId === v.id}
                        className="px-3.5 py-1.5 bg-[#042618] hover:bg-[#073824] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-warm-sm"
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
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200/80">
              <CheckCircle2 className="w-4 h-4 text-[#0F3824]" />
              <h3 className="font-bold text-base text-[#042618]">
                Administered Records
              </h3>
            </div>

            {completedList.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No vaccinations recorded for this profile yet.
              </div>
            ) : (
              <div className="space-y-3.5">
                {completedList.map((v) => (
                  <div
                    key={v.id}
                    className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-stone-400 text-xs line-through">{v.vaccineName}</h4>
                        <span className="text-[10px] px-2.5 py-0.5 bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0] rounded-full font-bold inline-block mt-1">
                          Dose {v.doseNumber}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-stone-600 space-y-0.5">
                        <div className="font-bold text-[#042618]">
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
