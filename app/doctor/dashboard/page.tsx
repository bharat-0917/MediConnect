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
  HeartPulse
} from "lucide-react";

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/doctor");
    }
  }, [status, router]);

  useEffect(() => {
    async function checkVerification() {
      if (session?.user?.id) {
        try {
          const res = await fetch(`/api/doctor/verification-status?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            setIsVerified(data.isVerified);
          }
        } catch (err) {
          console.error("Error fetching verification status:", err);
        }
      }
    }
    checkVerification();
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Doctor Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative">
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#042618] flex items-center justify-center text-white font-bold text-lg shadow-warm-sm">
              <Stethoscope className="w-6 h-6 text-[#E0F2E7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
                  Dr. {session?.user?.name || "Doctor"}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] font-bold border border-[#C1E5D0]">
                    <ShieldCheck className="w-3 h-3 text-[#0F3824]" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    <ShieldAlert className="w-3 h-3 text-amber-700" />
                    <span>Pending Review</span>
                  </span>
                )}
              </div>
              <p className="text-stone-600 text-sm mt-0.5">Clinical consultation management, schedules, and consolidated patient records</p>
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

        {/* Verification Alert banner */}
        {isVerified === false && (
          <div className="mb-10 p-6 bg-amber-50/80 border border-amber-200/80 text-amber-900 rounded-3xl flex items-start gap-4 shadow-warm-sm">
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

        {/* Dashboard grid layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Appointments */}
          <Link href="/doctor/dashboard/appointments" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Appointment Requests
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Review booking requests, confirm patient sessions, and launch virtual video consultations.
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
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Weekly Schedule
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Define consultation days, time windows, and available virtual appointment slots.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>Configure Schedule</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Card 3: Connected Patients & Prescriptions */}
          <Link href="/doctor/dashboard/appointments" className="group">
            <div className="h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-[#042618]/30 transition-all duration-300 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2E7] flex items-center justify-center text-[#042618] mb-5 shadow-warm-sm group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold mb-1.5 text-[#042618] group-hover:text-[#0F3824] transition-colors">
                  Patient Records & Prescriptions
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed font-normal">
                  Access consolidated charts for connected patients, issue digital prescriptions, and review lab metrics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs font-bold text-[#042618] flex items-center gap-1.5">
                <span>View Patient Records</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
