"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, PlusCircle, Trash2, ArrowLeft, HeartPulse } from "lucide-react";
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

  // Fast session fallback: if status stays loading for > 1.5s, fetch session directly
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

  const fetchSlots = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(`/api/doctor/slots?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      } finally {
        setLoading(false);
      }
    } else if (status === "authenticated" && !session?.user?.id) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [session, status]);

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
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Availability Manager...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/doctor/dashboard" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Doctor Portal</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Weekly Consultation Schedule
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Configure available booking windows for patient virtual and clinic visits</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Slot Form */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 h-fit shadow-warm-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <PlusCircle className="w-4 h-4 text-[#042618]" />
              <h2 className="text-base font-bold text-[#042618]">Add Availability Slot</h2>
            </div>
            
            {error && (
              <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all disabled:opacity-50 mt-2"
              >
                {formLoading ? "Publishing Slot..." : "Publish Slot"}
              </button>
            </form>
          </div>

          {/* Slots List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#042618]" />
              <h2 className="text-base font-bold text-[#042618]">Configured Consultation Slots</h2>
            </div>
            
            {slots.length === 0 ? (
              <div className="p-10 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                No active slots configured yet. Use the scheduling form to create consultation windows.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-warm-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                        <span className="text-xs text-stone-500 font-medium">
                          {new Date(slot.start).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            slot.isBooked
                              ? "bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                          }`}
                        >
                          {slot.isBooked ? "Booked" : "Available"}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#042618] mb-1">
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
                        className="mt-4 text-xs text-rose-600 hover:text-rose-700 font-bold text-left self-start flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Slot</span>
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
