"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function DoctorProfilePage() {
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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Doctor Profile...</div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-400 text-xl font-bold mb-4">{error}</div>
        <Link
          href="/patient/dashboard/find-doctor"
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex items-center justify-between border-b border-slate-800 pb-8 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {doctor?.user.name}
            </h1>
            <p className="text-slate-400">{doctor?.specialization} Specialist</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard/find-doctor")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors"
          >
            Back to Directory
          </button>
        </header>

        {success ? (
          <div className="max-w-xl mx-auto text-center bg-slate-800/40 border border-slate-700/60 p-10 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl mx-auto mb-6">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Booking Requested</h2>
            <p className="text-slate-400 mb-8">
              Your appointment booking request has been submitted. The doctor will review your request shortly. You can track this in your dashboard.
            </p>
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl shadow-lg"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left side: Profile Bio and details */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-slate-700/60 pb-4">
                  Provider Details
                </h3>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-1">Affiliation:</span>
                    <span className="text-slate-200 font-semibold text-base">{doctor?.hospitalAffiliation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Qualifications:</span>
                    <span className="text-slate-200 font-semibold text-base">{doctor?.qualifications}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Consultation Fee:</span>
                    <span className="text-cyan-400 font-bold text-lg">${doctor?.consultationFee}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Specialization:</span>
                    <span className="text-slate-200 font-semibold text-base">{doctor?.specialization}</span>
                  </div>
                </div>
              </div>

              {doctor?.bio && (
                <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-4">Biography</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{doctor.bio}</p>
                </div>
              )}
            </div>

            {/* Right side: Appointment scheduling */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-white mb-6">Book an Appointment</h3>

                {error && (
                  <div className="p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-8">
                  {/* Select Slot */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Select an Available Slot
                    </label>

                    {slots.length === 0 ? (
                      <div className="p-6 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-sm">
                        No active available slots for this provider currently. Check back later.
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              selectedSlotId === slot.id
                                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5"
                                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <span className="text-xs block text-slate-500 mb-1">
                              {new Date(slot.start).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="font-bold text-sm">
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
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Appointment Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="VIRTUAL">Virtual (Video Consultation)</option>
                        <option value="IN_PERSON">In-Person Visit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Reason for Visit
                      </label>
                      <input
                        type="text"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Routine checkup, headache, etc."
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading || !selectedSlotId}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? "Submitting Request..." : "Request Appointment"}
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
