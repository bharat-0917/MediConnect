"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Video, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock,
  HeartPulse,
  Phone,
  Mail
} from "lucide-react";
import { acceptAppointment, declineAppointment, saveConsultationNotes } from "@/app/actions/appointment";

const isJoinable = (appt: Appointment) => {
  if (appt.status !== "CONFIRMED" || appt.type !== "VIRTUAL") return false;
  const now = new Date().getTime();
  const scheduledTime = new Date(appt.scheduledAt).getTime();
  const tenMinutesBefore = scheduledTime - 10 * 60 * 1000;
  const twoHoursAfter = scheduledTime + 2 * 60 * 60 * 1000;
  return now >= tenMinutesBefore && now <= twoHoursAfter;
};

const isBeforeJoinTime = (appt: Appointment) => {
  if (appt.status !== "CONFIRMED" || appt.type !== "VIRTUAL") return false;
  const now = new Date().getTime();
  const scheduledTime = new Date(appt.scheduledAt).getTime();
  const tenMinutesBefore = scheduledTime - 10 * 60 * 1000;
  return now < tenMinutesBefore;
};

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  type: string;
  reasonForVisit: string;
  patient: {
    id: string;
    user: {
      name: string;
      phone: string;
      email: string;
    };
  };
}

export default function DoctorAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [completingAppt, setCompletingAppt] = useState<Appointment | null>(null);
  const [consultNotes, setConsultNotes] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/doctor");
    }
  }, [status, router]);

  // Fast session fallback: if status stays loading for > 1.5s, fetch session directly
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "loading") {
      timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/auth/session");
          if (res.ok) {
            const data = await res.json();
            if (!data?.user) {
              router.push("/auth/doctor");
            }
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [status, router]);

  const fetchAppointments = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(`/api/doctor/appointments?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    } else if (status === "authenticated" && !session?.user?.id) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [session, status]);

  const handleAccept = async (id: string) => {
    if (!session?.user?.id) return;
    setActionLoadingId(id);
    try {
      const res = await acceptAppointment(session.user.id, id);
      if (res.success) {
        fetchAppointments();
      } else {
        alert(res.error || "Failed to accept appointment");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    if (!session?.user?.id) return;
    setActionLoadingId(id);
    try {
      const res = await declineAppointment(session.user.id, id);
      if (res.success) {
        fetchAppointments();
      } else {
        alert(res.error || "Failed to decline appointment");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveCompletion = async () => {
    if (!session?.user?.id || !completingAppt || !consultNotes.trim()) return;
    setCompleteLoading(true);
    try {
      const res = await saveConsultationNotes(session.user.id, completingAppt.id, consultNotes);
      if (res.success) {
        setCompletingAppt(null);
        setConsultNotes("");
        fetchAppointments();
      } else {
        alert(res.error || "Failed to finalize consultation");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setCompleteLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Appointments Panel...</div>
        </div>
      </div>
    );
  }

  const requestedAppts = appointments.filter((a) => a.status === "REQUESTED");
  const confirmedAppts = appointments.filter((a) => a.status === "CONFIRMED");
  const completedAppts = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/doctor/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Doctor Portal</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Appointment Requests & Consultations
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Review patient bookings, access medical charts, and launch encrypted video consults</p>
          </div>
        </header>

        <div className="space-y-12">
          {/* Requested Section */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-warm-sm">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#042618]">
                Pending Booking Requests
              </h2>
              {requestedAppts.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  {requestedAppts.length} Pending
                </span>
              )}
            </div>

            {requestedAppts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No pending appointment requests currently.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {requestedAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3 pb-3 border-b border-stone-100">
                        <div>
                          <h3 className="font-bold text-base text-[#042618]">{appt.patient.user.name}</h3>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Requested for: {new Date(appt.scheduledAt).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200 uppercase tracking-wider">
                          {appt.type}
                        </span>
                      </div>

                      <p className="text-stone-700 text-xs italic bg-[#F0F9F3] p-4 rounded-2xl mb-6 border border-[#E0F2E7]">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(appt.id)}
                        disabled={actionLoadingId !== null}
                        className="flex-1 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === appt.id ? "Processing..." : "Accept Request"}</span>
                      </button>
                      <button
                        onClick={() => handleDecline(appt.id)}
                        disabled={actionLoadingId !== null}
                        className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-stone-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Confirmed Section */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shadow-warm-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#042618]">Confirmed Consultations</h2>
              {confirmedAppts.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
                  {confirmedAppts.length} Scheduled
                </span>
              )}
            </div>

            {confirmedAppts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No upcoming confirmed appointments.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {confirmedAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3 pb-3 border-b border-stone-100">
                        <div>
                          <h3 className="font-bold text-base text-[#042618]">{appt.patient.user.name}</h3>
                          <span className="text-xs text-[#0F3824] font-bold">
                            {new Date(appt.scheduledAt).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-xl bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0] uppercase">
                          {appt.type}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 space-y-1 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{appt.patient.user.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{appt.patient.user.email}</span>
                        </div>
                      </div>

                      <p className="text-stone-700 text-xs italic bg-stone-50 p-3.5 rounded-2xl mb-4 border border-stone-200/60">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>

                      {/* Deep Link to Consolidated Patient View & Prescriptions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <Link
                          href={`/doctor/dashboard/patients/${appt.patient.id}`}
                          className="w-full py-2.5 bg-[#E0F2E7] hover:bg-[#D0EBD9] text-[#042618] font-bold rounded-2xl text-center text-xs transition-all block border border-[#C1E5D0] shadow-warm-sm"
                        >
                          Patient EHR Chart →
                        </Link>
                        <Link
                          href={`/doctor/dashboard/patients/${appt.patient.id}/prescribe`}
                          className="w-full py-2.5 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-2xl text-center text-xs transition-all block border border-stone-200 shadow-warm-sm"
                        >
                          + Write Prescription
                        </Link>
                      </div>

                      {/* Direct Complete Consultation Action */}
                      <button
                        onClick={() => {
                          setCompletingAppt(appt);
                          setConsultNotes("");
                        }}
                        className="w-full py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-center text-xs transition-all shadow-warm-sm flex items-center justify-center gap-1.5 mb-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E0F2E7]" />
                        <span>Complete Visit & Finalize Notes</span>
                      </button>
                    </div>

                    {appt.type === "VIRTUAL" && appt.status === "CONFIRMED" && (
                      <div className="mt-1">
                        {isJoinable(appt) ? (
                          <Link
                            href={`/consultation/${appt.id}`}
                            className="block w-full py-2.5 bg-[#E0F2E7] hover:bg-[#D0EBD9] text-[#042618] text-center font-bold rounded-2xl text-xs transition-all shadow-warm-sm flex items-center justify-center gap-2 border border-[#C1E5D0]"
                          >
                            <Video className="w-4 h-4 text-[#042618]" />
                            <span>Join Video Consultation Room</span>
                          </Link>
                        ) : isBeforeJoinTime(appt) ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-stone-100 border border-stone-200 text-stone-500 font-bold rounded-2xl text-xs cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Opens 10m before scheduled time</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 bg-stone-100 text-stone-400 font-bold rounded-2xl text-xs cursor-not-allowed"
                          >
                            Consultation Closed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Complete Consultation Modal */}
          {completingAppt && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-stone-200/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-warm-lg space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#0F3824]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#042618]">Finalize Consultation</h3>
                      <p className="text-stone-500 text-xs">Patient: {completingAppt.patient.user.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCompletingAppt(null)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60 text-xs text-stone-700 space-y-1">
                  <span className="font-bold text-stone-800 block">Reason for Visit:</span>
                  <p className="italic">&ldquo;{completingAppt.reasonForVisit}&rdquo;</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    Clinical Notes & Summary <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Enter diagnosis, clinical observations, recommendations, or instructions given to patient..."
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompletingAppt(null)}
                    disabled={completeLoading}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCompletion}
                    disabled={completeLoading || !consultNotes.trim()}
                    className="flex-1 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E0F2E7]" />
                    <span>{completeLoading ? "Finalizing..." : "Mark as Completed"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Section */}
          <section>
            <h2 className="text-lg font-bold text-stone-700 mb-5 font-sans">Consultation History</h2>
            {completedAppts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No past consultation records.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 font-bold uppercase tracking-wider bg-stone-50/50">
                      <th className="p-5">Patient</th>
                      <th className="p-5">Scheduled Date</th>
                      <th className="p-5">Mode</th>
                      <th className="p-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {completedAppts.map((appt) => (
                      <tr key={appt.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-5 font-bold text-[#042618]">{appt.patient.user.name}</td>
                        <td className="p-5 text-stone-600 font-mono">
                          {new Date(appt.scheduledAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-5 uppercase font-bold text-stone-500">{appt.type}</td>
                        <td className="p-5 text-right">
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                              appt.status === "COMPLETED"
                                ? "bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
