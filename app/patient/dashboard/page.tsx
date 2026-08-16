"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Bot, 
  HeartHandshake, 
  FileText, 
  Pill, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  LogOut, 
  Clock, 
  Video, 
  History,
  HeartPulse
} from "lucide-react";

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

interface AccessLogEntry {
  id: string;
  accessedAt: string;
  doctor: {
    specialization: string;
    user: {
      name: string | null;
    };
  };
}

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Patient Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#042618] flex items-center justify-center text-white font-bold text-lg shadow-warm-sm">
              <HeartPulse className="w-6 h-6 text-[#E0F2E7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
                  Welcome, {session?.user?.name || "Patient"}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]/80">
                  Patient
                </span>
              </div>
              <p className="text-stone-600 text-sm mt-0.5">Track vitals, review medical records, and consult verified doctors</p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 font-semibold transition-all shadow-warm-sm hover:shadow-warm-md text-sm w-fit"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-14">
          {/* Card 1: Find Doctor */}
          <Link href="/patient/dashboard/find-doctor" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Find Doctor
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Search specialists by department, view availability slots, and book consultations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Book Appointment</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 2: Symptom Checker */}
          <Link href="/patient/dashboard/symptom-checker" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Symptom Checker
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Discuss symptoms with our AI triage assistant and generate clinical summaries for your doctor.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Start Triage</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 3: Mental Wellness */}
          <Link href="/patient/dashboard/mental-wellness" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Mental Wellness
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  A private, supportive listening space with guided mindfulness and crisis support helplines.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Open Space</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 4: Medical Records */}
          <Link href="/patient/dashboard/lab-reports" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Medical Records
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Upload lab reports, view automated plain-language explanations, and track flagged anomalies.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>View Lab Reports</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 5: Prescriptions */}
          <Link href="/patient/dashboard/prescriptions" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Pill className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Prescriptions
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  View medication dosage, active durations, and download verified digital prescription PDFs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>View Prescriptions</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 6: Health Metrics */}
          <Link href="/patient/dashboard/health-tracker" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Health Metrics
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Log vitals (BP, glucose, weight), set health targets, and monitor long-term trends.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Open Health Tracker</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 7: Vaccine Tracker */}
          <Link href="/patient/dashboard/vaccine-tracker" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Vaccine Tracker
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Track Universal Immunization Programme (UIP) schedules and manage dependent child records.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Manage Vaccines</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Appointments Section */}
        <section className="space-y-5 mb-14">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#042618]">Your Scheduled Appointments</h2>
              <p className="text-stone-600 text-xs">Upcoming consultations and virtual video appointments</p>
            </div>
            <Link 
              href="/patient/dashboard/find-doctor" 
              className="text-xs font-bold text-[#042618] bg-[#E0F2E7] hover:bg-[#D0EBD9] px-4 py-2 rounded-xl transition-colors border border-[#C1E5D0]/80 shadow-warm-sm"
            >
              + New Appointment
            </Link>
          </div>
          
          {appointments.length === 0 ? (
            <div className="p-10 text-center bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
              <Calendar className="w-10 h-10 text-[#5CB386] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#042618] mb-1">No appointments scheduled</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">You have no upcoming consultations. Book a session with our verified doctors.</p>
              <Link
                href="/patient/dashboard/find-doctor"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#042618] hover:bg-[#073824] text-white text-xs font-bold rounded-xl shadow-warm-sm transition-all"
              >
                <span>Find a Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-base text-[#042618]">Dr. {appt.doctor.user.name}</h3>
                        <p className="text-xs text-stone-500 font-medium">{appt.doctor.specialization}</p>
                      </div>
                      <span
                        className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          appt.status === "CONFIRMED"
                            ? "bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]"
                            : appt.status === "REQUESTED"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : appt.status === "COMPLETED"
                            ? "bg-stone-100 text-stone-700 border border-stone-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 text-xs font-semibold text-stone-600 bg-stone-50/80 p-3 rounded-2xl border border-stone-100">
                      <Clock className="w-4 h-4 text-[#042618]" />
                      <span>
                        {new Date(appt.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-lg bg-stone-200/70 text-stone-700 font-bold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <p className="text-stone-600 text-xs italic bg-[#F0F9F3] p-3.5 rounded-2xl mb-4 border border-[#E0F2E7]">
                      &ldquo;{appt.reasonForVisit}&rdquo;
                    </p>
                  </div>

                  {/* Join Video Call Button */}
                  {appt.type === "VIRTUAL" && appt.status === "CONFIRMED" && (
                    <div className="mt-2">
                      {isJoinable(appt) ? (
                        <Link
                          href={`/consultation/${appt.id}`}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md"
                        >
                          <Video className="w-4 h-4 text-[#E0F2E7]" />
                          <span>Join Video Consultation</span>
                        </Link>
                      ) : isBeforeJoinTime(appt) ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-stone-100 border border-stone-200 text-stone-400 font-bold rounded-2xl text-xs cursor-not-allowed"
                        >
                          Join Call (Opens 10m before)
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 bg-stone-100 text-stone-400 font-bold rounded-2xl text-xs cursor-not-allowed"
                        >
                          Consultation Completed
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
        <section className="space-y-4 pt-10 border-t border-stone-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#042618]" />
              <h2 className="text-xl font-bold text-[#042618]">Record Access History</h2>
            </div>
            <span className="text-xs text-stone-500">
              Audit log of medical practitioners who accessed your consolidated records.
            </span>
          </div>

          {accessLogs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
              Your record access history is clean. No doctor views recorded yet.
            </div>
          ) : (
            <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-warm-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/60 text-[11px] uppercase text-stone-600 font-bold tracking-wider">
                      <th className="p-4">Practitioner Name</th>
                      <th className="p-4">Department / Specialization</th>
                      <th className="p-4 text-right">Access Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-bold text-[#042618]">
                          Dr. {log.doctor.user.name || "Doctor"}
                        </td>
                        <td className="p-4 text-stone-600 font-medium">
                          {log.doctor.specialization}
                        </td>
                        <td className="p-4 text-right text-stone-500 font-mono">
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
