"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Doctor Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome, {session?.user?.name || "Doctor"}
            </h1>
            <p className="text-slate-400">Manage your consultations and patient records</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors w-fit"
          >
            Logout
          </button>
        </header>

        {/* Verification Alert banner */}
        {isVerified === false && (
          <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-white">Verification Pending</h3>
              <p className="text-slate-400">
                Your medical license is currently being reviewed by our administrators. You will not be able to accept appointments or consult patients until your account is fully verified.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard grid layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1: Appointments */}
          <Link href="/doctor/dashboard/appointments" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-teal-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 font-bold text-xl">
                  📅
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-teal-400 transition-colors">
                  Appointments
                </h2>
                <p className="text-slate-400 text-sm">
                  View and manage your upcoming virtual and in-person slots.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-teal-400">Manage Appointments →</div>
            </div>
          </Link>

          {/* Card 2: Availability */}
          <Link href="/doctor/dashboard/availability" className="group">
            <div className="h-full p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-teal-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 font-bold text-xl">
                  ⏱️
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-teal-400 transition-colors">
                  Availability
                </h2>
                <p className="text-slate-400 text-sm">
                  Set and manage your weekly working hours and booking slots.
                </p>
              </div>
              <div className="mt-8 text-sm font-semibold text-teal-400">Manage Availability →</div>
            </div>
          </Link>

          {/* Card 3: Patients */}
          <div className="p-8 rounded-3xl bg-slate-800/20 border border-slate-800 flex flex-col justify-between select-none">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-slate-500 mb-6 font-bold text-xl">
                👥
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-500">Patients</h2>
              <p className="text-slate-600 text-sm">
                Access connected patient records, history, and metrics.
              </p>
            </div>
            <div className="mt-8 text-sm text-slate-600 font-medium">Placeholder (Coming Soon)</div>
          </div>

          {/* Card 4: Prescriptions */}
          <div className="p-8 rounded-3xl bg-slate-800/20 border border-slate-800 flex flex-col justify-between select-none">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-slate-500 mb-6 font-bold text-xl">
                💊
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-500">Prescriptions</h2>
              <p className="text-slate-600 text-sm">
                Generate, sign, and issue secure digital prescriptions.
              </p>
            </div>
            <div className="mt-8 text-sm text-slate-600 font-medium">Placeholder (Coming Soon)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
