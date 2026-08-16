"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Doctor {
  id: string;
  specialization: string;
  qualifications: string;
  hospitalAffiliation: string;
  consultationFee: number;
  user: {
    name: string;
    phone: string;
  };
}

export default function FindDoctorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const symptomSessionId = searchParams.get("symptomSessionId");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/patient/doctors");
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) =>
    doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
    doc.user.name.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Searching Doctors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-8 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Find a Doctor
            </h1>
            <p className="text-slate-400">Search and book consultations with verified medical specialists</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors w-fit"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Search Filter */}
        <div className="mb-10 max-w-lg">
          <input
            type="text"
            placeholder="Search by specialist or name (e.g. Cardiologist)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/40 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500">
            No verified specialists found matching your search.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {doc.user.name}
                    </h2>
                    <span className="text-sm font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full shrink-0">
                      ${doc.consultationFee}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-300 mb-6 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                    {doc.specialization}
                  </p>

                  <div className="space-y-3 text-sm text-slate-400 mb-8 border-t border-slate-800 pt-6">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qualifications:</span>
                      <span className="text-slate-300 font-medium">{doc.qualifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Affiliation:</span>
                      <span className="text-slate-300 font-medium">{doc.hospitalAffiliation}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={symptomSessionId ? `/patient/dashboard/doctor/${doc.id}?symptomSessionId=${symptomSessionId}` : `/patient/dashboard/doctor/${doc.id}`}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl text-center shadow-lg shadow-cyan-500/10 transition-all"
                >
                  View Profile & Book
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
