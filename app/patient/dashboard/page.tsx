"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Sparkles, 
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
  HeartPulse,
  CheckCircle2,
  Stethoscope,
  Plus
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

interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

interface Prescription {
  id: string;
  issuedAt: string;
  notes?: string;
  doctor: {
    specialization: string;
    user: {
      name: string | null;
    };
  };
  items?: PrescriptionItem[];
}

interface LabReport {
  id: string;
  title: string;
  uploadedAt: string;
  aiSummary?: string | null;
  aiFlaggedAnomalies?: string[] | null;
  analysisStatus?: string;
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
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
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
        const [apptRes, prescRes, labRes, logsRes] = await Promise.all([
          fetch(`/api/patient/appointments?userId=${session.user.id}`),
          fetch(`/api/patient/prescriptions`),
          fetch(`/api/patient/lab-reports`),
          fetch(`/api/patient/access-logs`),
        ]);

        if (apptRes.ok) {
          const data = await apptRes.json();
          setAppointments(Array.isArray(data) ? data : []);
        }
        if (prescRes.ok) {
          const prescData = await prescRes.json();
          setPrescriptions(Array.isArray(prescData) ? prescData : []);
        }
        if (labRes.ok) {
          const labData = await labRes.json();
          setLabReports(Array.isArray(labData) ? labData : []);
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setAccessLogs(Array.isArray(logsData) ? logsData : []);
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

  // Find next upcoming appointment
  const upcomingAppt = appointments.find(
    (a) => a.status === "CONFIRMED" || a.status === "REQUESTED"
  );

  // Count flagged lab reports
  const flaggedReportsCount = labReports.filter(
    (r) => Array.isArray(r.aiFlaggedAnomalies) && r.aiFlaggedAnomalies.length > 0
  ).length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-7 py-4 rounded-3xl border border-stone-200/80 shadow-warm-md">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-bold text-[#042618]">Loading Patient Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative selection:bg-[#E0F2E7] selection:text-[#042618]">
      {/* Warm Ambient Blur Accents */}
      <div className="absolute top-[-4%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#F0F9F3]/70 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* 1. HEADER / WELCOME BAR */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-stone-200/70">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-[#042618] flex items-center justify-center text-white font-bold shadow-warm-sm shrink-0">
              <HeartPulse className="w-7 h-7 text-[#E0F2E7]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
                  Welcome, {session?.user?.name || "Patient"}
                </h1>
                <span className="text-[11px] px-3 py-1 rounded-full bg-[#E0F2E7] text-[#042618] font-extrabold border border-[#C1E5D0]">
                  Verified Patient
                </span>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 font-normal">
                Here&apos;s an overview of your health, appointments, and care team.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/patient/dashboard/find-doctor"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md"
            >
              <Plus className="w-4 h-4" />
              <span>Book Doctor</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 font-semibold transition-all shadow-warm-sm hover:shadow-warm-md text-xs"
            >
              <LogOut className="w-4 h-4 text-stone-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* 2. QUICK STATUS ROW (Data-Driven Real Stats) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {/* Card 1: Next Appointment */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Next Appointment</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div>
              {upcomingAppt ? (
                <>
                  <div className="text-base font-extrabold text-[#042618] truncate mb-0.5">
                    {upcomingAppt.doctor.user.name.startsWith("Dr.") ? upcomingAppt.doctor.user.name : `Dr. ${upcomingAppt.doctor.user.name}`}
                  </div>
                  <div className="text-xs text-stone-600 font-medium">
                    {new Date(upcomingAppt.scheduledAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-extrabold text-[#042618]">None scheduled</div>
                  <div className="text-xs text-stone-500">Ready to book when needed</div>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Active Prescriptions */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Prescriptions</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#042618]">
                {prescriptions.length}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {prescriptions.length === 1 ? "1 active prescription on record" : `${prescriptions.length} active prescriptions on record`}
              </div>
            </div>
          </div>

          {/* Card 3: Lab Reports */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Diagnostic Labs</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#042618]">
                {labReports.length}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {flaggedReportsCount > 0 
                  ? `${flaggedReportsCount} flagged for review` 
                  : "All summaries organized"}
              </div>
            </div>
          </div>

          {/* Card 4: Record Privacy Status */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">EHR Access Security</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold text-[#042618] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Protected</span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {accessLogs.length > 0 
                  ? `${accessLogs.length} verified clinical views` 
                  : "Gated to confirmed appointments"}
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURE MODULE GRID */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-[#042618] tracking-tight">Healthcare Services & Tools</h2>
            <p className="text-stone-600 text-xs">Direct access to your clinical consultations, records, and health trackers</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Card 1: Find Doctor */}
            <Link href="/patient/dashboard/find-doctor" className="group">
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Find Doctor
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Search verified specialists by department, view availability slots, and book virtual visits.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Search Specialists</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Card 2: Symptom Checker */}
            <Link href="/patient/dashboard/symptom-checker" className="group">
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    AI Symptom Checker
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Discuss symptoms with our conversational AI triage assistant and prepare clinical briefs.
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
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full">
                      Confidential
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Mental Wellness
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    A private listening space with guided mindfulness and 24/7 crisis support helplines.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Open Safe Space</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Card 4: Medical Records */}
            <Link href="/patient/dashboard/lab-reports" className="group">
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    {labReports.length > 0 && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#F0F9F3] text-[#042618] border border-[#C1E5D0] rounded-full">
                        {labReports.length} {labReports.length === 1 ? "File" : "Files"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Diagnostic Lab Reports
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Upload pathology panels, get instant plain-language summaries, and track flagged metrics.
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
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <Pill className="w-6 h-6" />
                    </div>
                    {prescriptions.length > 0 && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#F0F9F3] text-[#042618] border border-[#C1E5D0] rounded-full">
                        {prescriptions.length} Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Prescriptions
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    View medication dosages, administration timing, and download digitally signed PDFs.
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
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Health Metrics & Vitals
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Log vitals (blood pressure, glucose, weight), set targets, and monitor recovery trends.
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
              <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-hover hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Vaccine Tracker (UIP)
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Track Universal Immunization Programme schedules and manage dependent child records.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Manage Vaccines</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* 4. UPCOMING APPOINTMENTS SECTION */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#042618] tracking-tight">Your Scheduled Appointments</h2>
              <p className="text-stone-600 text-xs">Upcoming virtual consultations and clinical sessions</p>
            </div>
            <Link 
              href="/patient/dashboard/find-doctor" 
              className="text-xs font-bold text-[#042618] bg-[#E0F2E7] hover:bg-[#D0EBD9] px-4 py-2.5 rounded-2xl transition-colors border border-[#C1E5D0] shadow-warm-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>
          </div>
          
          {appointments.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mx-auto mb-4 shadow-warm-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#042618] mb-1">No upcoming appointments</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                You have no consultations scheduled. Search verified clinicians and book an appointment at your convenience.
              </p>
              <Link
                href="/patient/dashboard/find-doctor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#042618] hover:bg-[#073824] text-white text-xs font-bold rounded-2xl shadow-warm-sm transition-all"
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
                        <h3 className="font-extrabold text-base text-[#042618]">
                          {appt.doctor.user.name.startsWith("Dr.") ? appt.doctor.user.name : `Dr. ${appt.doctor.user.name}`}
                        </h3>
                        <p className="text-xs text-stone-500 font-semibold">{appt.doctor.specialization}</p>
                      </div>
                      <span
                        className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
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

                    <div className="flex items-center gap-3 mb-4 text-xs font-semibold text-stone-600 bg-[#FAF9F5] p-3.5 rounded-2xl border border-stone-200/70">
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
                      <span className="ml-auto text-[10px] px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
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
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md"
                        >
                          <Video className="w-4 h-4 text-[#E0F2E7]" />
                          <span>Join Video Consultation</span>
                        </Link>
                      ) : isBeforeJoinTime(appt) ? (
                        <button
                          disabled
                          className="w-full py-3 bg-stone-100 border border-stone-200 text-stone-400 font-bold rounded-2xl text-xs cursor-not-allowed"
                        >
                          Join Call (Opens 10m before)
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 bg-stone-100 text-stone-400 font-bold rounded-2xl text-xs cursor-not-allowed"
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

        {/* 5. AUDIT LOG / EHR ACCESS HISTORY */}
        <section className="pt-8 border-t border-stone-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shadow-warm-sm">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#042618]">Clinical Record Access History</h2>
                <p className="text-xs text-stone-500">Transparent audit log of practitioners who accessed your consolidated EHR</p>
              </div>
            </div>
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
                    <tr className="border-b border-stone-100 bg-[#FAF9F5] text-[11px] uppercase text-stone-600 font-bold tracking-wider">
                      <th className="p-4">Practitioner Name</th>
                      <th className="p-4">Department / Specialization</th>
                      <th className="p-4 text-right">Access Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-bold text-[#042618]">
                          {log.doctor.user.name ? (log.doctor.user.name.startsWith("Dr.") ? log.doctor.user.name : `Dr. ${log.doctor.user.name}`) : "Dr. Doctor"}
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

