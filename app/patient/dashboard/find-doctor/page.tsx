"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Search, ArrowLeft, Stethoscope, Building2, GraduationCap, HeartPulse } from "lucide-react";

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

function FindDoctorContent() {
  const { status } = useSession();
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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Searching Verified Doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/patient/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Find a Verified Specialist
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Search doctors by clinical department, review credentials, and book consultation slots</p>
          </div>
        </header>

        {/* Search Filter */}
        <div className="mb-10 max-w-lg relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by department or doctor name (e.g. Cardiologist, Neurologist)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200/80 rounded-2xl pl-12 pr-5 py-3.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#042618] focus:ring-1 focus:ring-[#042618] shadow-warm-sm text-sm transition-all"
          />
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="p-12 text-center bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm">
            <Stethoscope className="w-10 h-10 text-[#5CB386] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#042618] mb-1">No verified specialists match your query</h3>
            <p className="text-xs text-stone-500">Try searching for broader medical specialties or clear your search term.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-7 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm hover:shadow-warm-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#042618] leading-tight">
                        Dr. {doc.user.name}
                      </h2>
                      <p className="text-xs font-bold text-[#0F3824] mt-0.5">
                        {doc.specialization}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#042618] bg-[#E0F2E7] px-3 py-1.5 rounded-xl shrink-0 border border-[#C1E5D0]">
                      ${doc.consultationFee} / session
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-stone-600 mb-8 border-t border-stone-100 pt-5 mt-5">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#042618] shrink-0" />
                      <span className="font-medium text-stone-700">{doc.qualifications}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#042618] shrink-0" />
                      <span className="font-medium text-stone-700">{doc.hospitalAffiliation}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={symptomSessionId ? `/patient/dashboard/doctor/${doc.id}?symptomSessionId=${symptomSessionId}` : `/patient/dashboard/doctor/${doc.id}`}
                  className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-center text-xs shadow-warm-sm hover:shadow-warm-md transition-all"
                >
                  View Profile & Book Session
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FindDoctorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="text-sm font-semibold text-[#042618]">Loading search...</div>
      </div>
    }>
      <FindDoctorContent />
    </Suspense>
  );
}
