"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Users, 
  Stethoscope, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  LogOut,
  HeartPulse,
  Plus,
  AlertCircle
} from "lucide-react";

interface Appointment {
  id: string;
  status: string;
  scheduledAt: string;
}

interface Slot {
  id: string;
  isBooked: boolean;
  end: string;
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/doctor");
    }
  }, [status, router]);

  // Fast session fallback
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

  useEffect(() => {
    async function fetchDoctorData() {
      if (session?.user?.id) {
        try {
          const [verifRes, apptRes, slotsRes] = await Promise.all([
            fetch(`/api/doctor/verification-status?userId=${session.user.id}`),
            fetch(`/api/doctor/appointments?userId=${session.user.id}`),
            fetch(`/api/doctor/slots?userId=${session.user.id}`)
          ]);

          if (verifRes.ok) {
            const verifData = await verifRes.json();
            setIsVerified(verifData.isVerified);
          }
          if (apptRes.ok) {
            const apptData = await apptRes.json();
            setAppointments(Array.isArray(apptData) ? apptData : []);
          }
          if (slotsRes.ok) {
            const slotsData = await slotsRes.json();
            setSlots(Array.isArray(slotsData) ? slotsData : []);
          }
        } catch (err) {
          console.error("Error fetching verification status:", err);
        } finally {
          setLoading(false);
        }
      } else if (status === "authenticated" && !session?.user?.id) {
        setLoading(false);
      }
    }
    fetchDoctorData();
  }, [session, status]);

  if (status === "loading" && loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-7 py-4 rounded-3xl border border-stone-200/80 shadow-warm-md">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-bold text-[#042618]">Loading Doctor Dashboard...</div>
        </div>
      </div>
    );
  }

  const rawName = session?.user?.name || "Doctor";
  const doctorName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
  const pendingRequestsCount = appointments.filter((a) => a.status === "REQUESTED").length;
  const confirmedApptsCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const activeSlotsCount = slots.filter((s) => !s.isBooked && new Date(s.end) > new Date()).length;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative selection:bg-[#E0F2E7] selection:text-[#042618]">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#F0F9F3]/70 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header / Welcome Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-stone-200/70">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-[#042618] flex items-center justify-center text-white font-bold shadow-warm-sm shrink-0">
              <Stethoscope className="w-7 h-7 text-[#E0F2E7]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
                  Welcome, {doctorName}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-[#E0F2E7] text-[#042618] font-extrabold border border-[#C1E5D0]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#042618]" />
                    <span>Verified Practitioner</span>
                  </span>
                ) : isVerified === false ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-extrabold border border-amber-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Verification Pending</span>
                  </span>
                ) : null}
              </div>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 font-normal">
                Clinical consultation management, weekly schedules, and consolidated patient EHR records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/doctor/availability"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Schedule</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-2xl text-stone-700 font-bold transition-all shadow-warm-sm text-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Pending Verification Notice Banner */}
        {isVerified === false && (
          <div className="mb-8 p-6 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-3xl flex items-start gap-4 shadow-warm-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center font-bold text-lg shrink-0 text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1 text-amber-950">Medical License Verification Pending</h3>
              <p className="text-amber-800 text-xs leading-relaxed">
                Your medical registration and credentials are currently being authenticated by our verification team. You can set up your weekly schedule, but public booking will become visible once verified.
              </p>
            </div>
          </div>
        )}

        {/* Quick Status Stats Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {/* Card 1: Pending Requests */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pending Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#042618] mb-0.5">{pendingRequestsCount}</div>
              <div className="text-xs text-stone-600 font-medium">
                {pendingRequestsCount === 1 ? "1 request awaiting review" : `${pendingRequestsCount} requests awaiting review`}
              </div>
            </div>
          </div>

          {/* Card 2: Confirmed Appointments */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Confirmed Visits</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#042618] mb-0.5">{confirmedApptsCount}</div>
              <div className="text-xs text-stone-600 font-medium">Scheduled consultations on file</div>
            </div>
          </div>

          {/* Card 3: Active Slots */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Open Slots</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#042618] mb-0.5">{activeSlotsCount}</div>
              <div className="text-xs text-stone-600 font-medium">Available for patient booking</div>
            </div>
          </div>

          {/* Card 4: Practice Status */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Practice Status</span>
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold text-[#042618] mb-0.5">
                {isVerified ? "Active & Verified" : "Under Review"}
              </div>
              <div className="text-xs text-stone-600 font-medium">Telehealth consultations enabled</div>
            </div>
          </div>
        </section>

        {/* Main Modules Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#042618] tracking-tight">Clinical Management Modules</h2>
              <p className="text-stone-600 text-xs">Direct access to schedules, appointments, and patient EHR charts</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Appointments */}
            <Link href="/doctor/dashboard/appointments" className="group">
              <div className="h-full p-7 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                    {pendingRequestsCount > 0 && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        {pendingRequestsCount} Pending
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Appointment Requests
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Review patient visit requests, confirm scheduled consultations, and launch encrypted virtual video sessions.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Manage Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Card 2: Availability */}
            <Link href="/doctor/availability" className="group">
              <div className="h-full p-7 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]">
                      {activeSlotsCount} Open
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Weekly Consultation Schedule
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Configure consultation dates, working hours, and time slots for patient virtual and clinic bookings.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Configure Slots</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Card 3: Patient Records & Prescriptions */}
            <Link href="/doctor/dashboard/appointments" className="group">
              <div className="h-full p-7 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] shadow-warm-sm group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]">
                      EHR Enabled
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                    Patient EHR & Prescriptions
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-normal">
                    Access consolidated clinical charts, issue digitally signed Rx prescriptions, and review diagnostic lab summaries.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                  <span>Open Patient Records</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
