"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAvailableSlot, deleteAvailableSlot } from "@/app/actions/appointment";

interface Slot {
  id: string;
  start: string;
  end: string;
  isBooked: boolean;
}

export default function DoctorAvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/doctor");
    }
  }, [status, router]);

  const fetchSlots = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(`/api/doctor/slots?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data);
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [session]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !session?.user?.id) return;
    
    setError(null);
    setFormLoading(true);
    
    const startStr = `${date}T${startTime}:00`;
    const endStr = `${date}T${endTime}:00`;

    try {
      const res = await createAvailableSlot(session.user.id, startStr, endStr);
      if (res.success) {
        setDate("");
        setStartTime("");
        setEndTime("");
        fetchSlots();
      } else {
        setError(res.error || "Failed to create slot");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const onDelete = async (slotId: string) => {
    if (!session?.user?.id) return;
    try {
      const res = await deleteAvailableSlot(session.user.id, slotId);
      if (res.success) {
        fetchSlots();
      } else {
        alert(res.error || "Failed to delete slot");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Availability Manager...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex items-center justify-between border-b border-slate-800 pb-8 mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Availability Manager
            </h1>
            <p className="text-slate-400">Set and edit your active slots for patient bookings</p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard")}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Add Slot Form */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 h-fit">
            <h2 className="text-xl font-bold mb-6 text-white">Add Available Slot</h2>
            
            {error && (
              <div className="p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-teal-500/10 transition-all disabled:opacity-50"
              >
                {formLoading ? "Adding..." : "Add Slot"}
              </button>
            </form>
          </div>

          {/* Slots List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white">Your Available Slots</h2>
            
            {slots.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/20 border border-slate-800 rounded-3xl text-slate-500">
                No slots added yet. Use the form to configure your availability.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-slate-400">
                          {new Date(slot.start).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            slot.isBooked
                              ? "bg-teal-500/10 text-teal-400"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {slot.isBooked ? "Booked" : "Available"}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white mb-2">
                        {new Date(slot.start).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(slot.end).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {!slot.isBooked && (
                      <button
                        onClick={() => onDelete(slot.id)}
                        className="mt-6 text-sm text-red-400 hover:text-red-300 font-semibold text-left self-start"
                      >
                        Delete Slot
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
