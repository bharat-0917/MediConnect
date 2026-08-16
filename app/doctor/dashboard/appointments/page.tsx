"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptAppointment, declineAppointment } from "@/app/actions/appointment";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/doctor");
    }
  }, [status, router]);

  const fetchAppointments = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(`/api/doctor/appointments?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [session]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Appointments Panel...</div>
      </div>
    );
  }

  const requestedAppts = appointments.filter((a) => a.status === "REQUESTED");
  const confirmedAppts = appointments.filter((a) => a.status === "CONFIRMED");
  const completedAppts = appointments.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex items-center justify-between border-b border-slate-800 pb-8 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Appointment Manager
            </h1>
            <p className="text-slate-400">Accept scheduling requests and check patient queues</p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="space-y-12">
          {/* Requested Section */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              Pending Requests
              {requestedAppts.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">
                  {requestedAppts.length} new
                </span>
              )}
            </h2>

            {requestedAppts.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                No pending appointment requests currently.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-8">
                {requestedAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h3 className="font-bold text-lg text-white">{appt.patient.user.name}</h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold uppercase">
                          {appt.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-6 font-semibold">
                        {new Date(appt.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-slate-300 text-sm italic bg-slate-900/40 p-4 rounded-2xl mb-6">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAccept(appt.id)}
                        disabled={actionLoadingId !== null}
                        className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                      >
                        {actionLoadingId === appt.id ? "Processing..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleDecline(appt.id)}
                        disabled={actionLoadingId !== null}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Confirmed Section */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Confirmed</h2>

            {confirmedAppts.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                No upcoming confirmed appointments.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-8">
                {confirmedAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h3 className="font-bold text-lg text-white">{appt.patient.user.name}</h3>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 font-semibold uppercase">
                          {appt.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 font-semibold">
                        {new Date(appt.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="text-xs text-slate-500 space-y-1 mb-4">
                        <div>Phone: {appt.patient.user.phone}</div>
                        <div>Email: {appt.patient.user.email}</div>
                        <div className="pt-2 flex flex-col gap-1.5">
                          <Link
                            href={`/doctor/dashboard/patients/${appt.patient.id}/lab-reports`}
                            className="text-teal-400 hover:text-teal-300 font-semibold underline inline-block"
                          >
                            📁 View Patient Lab Reports
                          </Link>
                          <Link
                            href={`/doctor/dashboard/patients/${appt.patient.id}/prescribe`}
                            className="text-teal-400 hover:text-teal-300 font-semibold underline inline-block"
                          >
                            ✏️ Issue Digital Prescription
                          </Link>
                          <Link
                            href={`/doctor/dashboard/patients/${appt.patient.id}/health-tracker`}
                            className="text-teal-400 hover:text-teal-300 font-semibold underline inline-block"
                          >
                            📊 View Patient Vitals & Goals
                          </Link>
                          <Link
                            href={`/doctor/dashboard/patients/${appt.patient.id}/vaccines`}
                            className="text-teal-400 hover:text-teal-300 font-semibold underline inline-block"
                          >
                            🛡️ Manage Immunization Schedule
                          </Link>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm italic bg-slate-900/40 p-4 rounded-2xl mb-4">
                        &ldquo;{appt.reasonForVisit}&rdquo;
                      </p>
                      <Link
                        href={`/doctor/dashboard/patients/${appt.patient.id}`}
                        className="w-full py-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold rounded-2xl text-center text-xs transition-all block border border-teal-500/25 shadow-sm"
                      >
                        📋 Open Consolidated Patient Record
                      </Link>
                    </div>

                    {appt.type === "VIRTUAL" && appt.status === "CONFIRMED" && (
                      <div className="mt-6">
                        {isJoinable(appt) ? (
                          <Link
                            href={`/consultation/${appt.id}`}
                            className="block w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-center font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-500/10"
                          >
                            Join Call
                          </Link>
                        ) : isBeforeJoinTime(appt) ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-500 font-bold rounded-xl text-sm cursor-not-allowed"
                          >
                            Join Call (Active 10m before)
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 bg-slate-850 text-slate-600 font-bold rounded-xl text-sm cursor-not-allowed"
                          >
                            Join Call (Ended)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History Section */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 font-sans">History (Cancelled & Completed)</h2>
            {completedAppts.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                No past appointment records.
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-800/20 border border-slate-800/60 rounded-3xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                      <th className="p-6">Patient</th>
                      <th className="p-6">Scheduled Date</th>
                      <th className="p-6">Type</th>
                      <th className="p-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {completedAppts.map((appt) => (
                      <tr key={appt.id}>
                        <td className="p-6 font-bold text-white">{appt.patient.user.name}</td>
                        <td className="p-6">
                          {new Date(appt.scheduledAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-6 uppercase text-xs font-semibold">{appt.type}</td>
                        <td className="p-6">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              appt.status === "COMPLETED"
                                ? "bg-teal-500/10 text-teal-400"
                                : "bg-red-500/10 text-red-400"
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
