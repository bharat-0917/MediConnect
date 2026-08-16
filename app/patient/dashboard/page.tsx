"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  type: string;
  reasonForVisit: string;
  doctor: {
    specialization: string;
    user: {
      name: string;
    };
  };
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchData = async () => {
    if (session?.user?.id) {
      try {
        const [apptRes, logsRes] = await Promise.all([
          fetch(`/api/patient/appointments?userId=${session.user.id}`),
          fetch(`/api/patient/access-logs`),
        ]);

        if (apptRes.ok) {
          const data = await apptRes.json();
          setAppointments(data);
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setAccessLogs(logsData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Patient Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome, {session?.user?.name || "Patient"}
            </h1>
            <p className="text-slate-400">Track your vitals, view reports, and manage appointments</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors w-fit"
          >
            Logout
          </button>
        </header>

        {/* Dashboard grid layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {/* Card 1: Find Doctor */}
          <Link href="/patient/dashboard/find-doctor" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  📅
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Find Doctor
                </h2>
                <p className="text-slate-400 text-sm">
                  Search and book consultations with verified medical specialists.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Find a Doctor →</div>
            </div>
          </Link>

          {/* Card 2: Symptom Checker */}
          <Link href="/patient/dashboard/symptom-checker" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  🧠
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Symptom Checker
                </h2>
                <p className="text-slate-400 text-sm">
                  Describe symptoms to our AI triage nurse and compile summaries.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Check Symptoms →</div>
            </div>
          </Link>

          {/* Card 3: Mental Wellness */}
          <Link href="/patient/dashboard/mental-wellness" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  🛋️
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Mental Wellness
                </h2>
                <p className="text-slate-400 text-sm">
                  Supportive listening, stress relief, and crisis helpline triggers.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Wellness Space →</div>
            </div>
          </Link>

          {/* Card 4: Medical Records */}
          <Link href="/patient/dashboard/lab-reports" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  📄
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Medical Records
                </h2>
                <p className="text-slate-400 text-sm">
                  Access your lab reports, diagnostics, and prescriptions.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">View Lab Reports →</div>
            </div>
          </Link>

          {/* Card 5: Prescriptions */}
          <Link href="/patient/dashboard/prescriptions" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  💊
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Prescriptions
                </h2>
                <p className="text-slate-400 text-sm">
                  Access, print, and track your active and past digital prescriptions.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Prescriptions →</div>
            </div>
          </Link>

          {/* Card 6: Health Metrics */}
          <Link href="/patient/dashboard/health-tracker" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  📊
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Health Metrics
                </h2>
                <p className="text-slate-400 text-sm">
                  Log vitals, configure goal targets, and monitor trend charts over time.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Health Tracker →</div>
            </div>
          </Link>

          {/* Card 7: Vaccine Tracker */}
          <Link href="/patient/dashboard/vaccine-tracker" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 font-bold text-xl">
                  🛡️
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  Vaccines
                </h2>
                <p className="text-slate-400 text-sm">
                  Track immunization schedules, due reminders, and record dependents.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-cyan-400">Vaccine Tracker →</div>
            </div>
          </Link>
        </div>

        {/* Appointments Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Your Appointments</h2>
          
          {appointments.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500 text-sm">
              No appointments scheduled yet. Click "Find Doctor" to search specialists.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">{appt.doctor.user.name}</h3>
                        <p className="text-xs text-slate-500">{appt.doctor.specialization}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          appt.status === "CONFIRMED"
                            ? "bg-teal-500/10 text-teal-400"
                            : appt.status === "REQUESTED"
                            ? "bg-amber-500/10 text-amber-400"
                            : appt.status === "COMPLETED"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-sm text-slate-300 font-semibold">
                        {new Date(appt.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm italic bg-slate-900/40 p-4 rounded-2xl mb-6">
                      &ldquo;{appt.reasonForVisit}&rdquo;
                    </p>
                  </div>

                  {/* Join Video Call Button */}
                  {appt.type === "VIRTUAL" && appt.status === "CONFIRMED" && (
                    <div className="mt-4">
                      {isJoinable(appt) ? (
                        <Link
                          href={`/consultation/${appt.id}`}
                          className="block w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-center font-bold rounded-xl text-sm transition-all shadow-md shadow-cyan-500/10"
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

        {/* Audit Log Section */}
        <section className="space-y-6 mt-16 border-t border-slate-800 pt-12">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Record Access History</h2>
            <span className="text-xs text-slate-550 italic">
              Audit log of medical practitioners who viewed your data.
            </span>
          </div>

          {accessLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/10 border border-slate-800 rounded-3xl text-slate-500 text-sm">
              Your record access logs are clean. No recent external checks.
            </div>
          ) : (
            <div className="bg-slate-800/20 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      <th className="p-4">Practitioner Name</th>
                      <th className="p-4">Department / Specialization</th>
                      <th className="p-4 text-right">Access Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                    {accessLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/10">
                        <td className="p-4 font-semibold text-white">
                          Dr. {log.doctor.user.name || "Doctor"}
                        </td>
                        <td className="p-4 text-slate-400">
                          {log.doctor.specialization}
                        </td>
                        <td className="p-4 text-right text-slate-500">
                          {new Date(log.accessedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
