"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  HeartPulse 
} from "lucide-react";
import { bookAppointment } from "@/app/actions/appointment";

interface Slot {
  id: string;
  start: string;
  end: string;
  isBooked: boolean;
}

interface Doctor {
  id: string;
  specialization: string;
  qualifications: string;
  hospitalAffiliation: string;
  consultationFee: number;
  bio: string | null;
  licenseNumber: string;
  user: {
    name: string;
    phone: string;
  };
}

function DoctorProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;
  
  const searchParams = useSearchParams();
  const symptomSessionId = searchParams.get("symptomSessionId") || undefined;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("VIRTUAL");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchDoctorAndSlots = async () => {
    if (doctorId) {
      try {
        const res = await fetch(`/api/patient/doctors/${doctorId}`);
        if (res.ok) {
          const data = await res.json();
          setDoctor(data.doctor);
          setSlots(data.slots);
        } else {
          setError("Doctor not found");
        }
      } catch (err) {
        console.error("Failed to load doctor profile:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDoctorAndSlots();
  }, [doctorId]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !reason || !session?.user?.id || !doctor) return;

    setError(null);
    setFormLoading(true);

    try {
      const res = await bookAppointment(
        session.user.id,
        doctor.id,
        selectedSlotId,
        reason,
        type,
        symptomSessionId
      );

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to book appointment");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Doctor Profile...</div>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-warm-md max-w-md w-full">
          <div className="text-rose-600 text-lg font-bold mb-3">{error}</div>
          <Link
            href="/patient/dashboard/find-doctor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#042618] text-white font-bold rounded-2xl text-xs shadow-warm-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </Link>
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
                href="/patient/dashboard/find-doctor" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Specialist Directory</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Dr. {doctor?.user.name}
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">{doctor?.specialization} Specialist</p>
          </div>
        </header>

        {success ? (
          <div className="max-w-xl mx-auto text-center bg-white border border-stone-200/80 p-10 rounded-3xl shadow-warm-md">
            <div className="w-16 h-16 rounded-3xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mx-auto mb-6 shadow-warm-sm">
              <CheckCircle2 className="w-8 h-8 text-[#0F3824]" />
            </div>
            <h2 className="text-2xl font-bold text-[#042618] mb-2">Booking Request Submitted</h2>
            <p className="text-stone-600 text-sm mb-8 leading-relaxed">
              Your consultation request has been forwarded to Dr. {doctor?.user.name}. You will be notified once confirmed.
            </p>
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="px-8 py-3.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-sm shadow-warm-sm transition-all"
            >
              Return to Patient Dashboard
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left side: Profile Bio and details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                  <ShieldCheck className="w-5 h-5 text-[#042618]" />
                  <h3 className="text-lg font-bold text-[#042618]">
                    Clinical Profile
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-stone-500 block mb-1">Specialization:</span>
                    <span className="text-[#042618] font-bold text-sm">{doctor?.specialization}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1">Hospital Affiliation:</span>
                    <div className="flex items-center gap-1.5 text-stone-800 font-semibold text-sm">
                      <Building2 className="w-4 h-4 text-[#042618] shrink-0" />
                      <span>{doctor?.hospitalAffiliation}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1">Qualifications:</span>
                    <div className="flex items-center gap-1.5 text-stone-800 font-semibold text-sm">
                      <GraduationCap className="w-4 h-4 text-[#042618] shrink-0" />
                      <span>{doctor?.qualifications}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1">Consultation Fee:</span>
                    <span className="text-[#042618] font-extrabold text-lg">${doctor?.consultationFee}</span>
                  </div>
                </div>
              </div>

              {doctor?.bio && (
                <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                  <h3 className="text-base font-bold text-[#042618] mb-3">About the Doctor</h3>
                  <p className="text-stone-600 leading-relaxed text-xs font-normal">{doctor.bio}</p>
                </div>
              )}
            </div>

            {/* Right side: Appointment scheduling */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-stone-100">
                  <Calendar className="w-5 h-5 text-[#042618]" />
                  <h3 className="text-lg font-bold text-[#042618]">Schedule Consultation</h3>
                </div>

                {error && (
                  <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Select Slot */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                      Choose an Available Slot
                    </label>

                    {slots.length === 0 ? (
                      <div className="p-8 text-center bg-stone-50/80 border border-stone-200/80 rounded-2xl text-stone-500 text-xs">
                        No active available booking slots for this provider currently. Please check back soon.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-4 rounded-2xl border text-left transition-all text-xs ${
                              selectedSlotId === slot.id
                                ? "bg-[#E0F2E7] border-[#042618] text-[#042618] shadow-warm-sm font-bold ring-1 ring-[#042618]"
                                : "bg-stone-50/70 border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-white"
                            }`}
                          >
                            <span className="text-[11px] block text-stone-500 mb-1 font-medium">
                              {new Date(slot.start).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="font-bold text-xs">
                              {new Date(slot.start).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(slot.end).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                        Consultation Mode
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-xs font-medium"
                      >
                        <option value="VIRTUAL">Virtual (Video Consultation)</option>
                        <option value="IN_PERSON">In-Person Clinic Visit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                        Reason for Consultation
                      </label>
                      <input
                        type="text"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Routine review, migraine symptoms..."
                        className="w-full bg-stone-50/60 border border-stone-200 rounded-2xl px-4 py-2.5 text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618] text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading || !selectedSlotId}
                    className="w-full py-3.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl shadow-warm-sm hover:shadow-warm-md transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? "Submitting Booking..." : "Confirm & Request Consultation"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="text-sm font-semibold text-[#042618]">Loading profile...</div>
      </div>
    }>
      <DoctorProfileContent />
    </Suspense>
  );
}
