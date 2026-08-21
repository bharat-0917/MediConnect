"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createChildProfile } from "@/app/actions/health";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  ArrowLeft, 
  HeartPulse, 
  AlertTriangle,
  Baby
} from "lucide-react";

interface Vaccine {
  id: string;
  vaccineName: string;
  doseNumber: number;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  status: string;
}

interface Dependent {
  id: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  emergencyContact: string;
  address: string | null;
  user: {
    id: string;
    name: string;
  };
  vaccines: Vaccine[];
}

export default function VaccineTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Child Creation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
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
              router.push("/auth/patient");
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

  const loadDependents = async () => {
    try {
      const res = await fetch("/api/patient/dependents");
      if (res.ok) {
        const data = await res.json();
        setDependents(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedChildId) {
          setSelectedChildId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load dependents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependents();
  }, [session, status]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || formLoading) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const res = await createChildProfile(
        session.user.id,
        name,
        dob,
        gender,
        bloodGroup || null,
        emergencyContact,
        address || null
      );

      if (res.success && res.childProfileId) {
        setName("");
        setDob("");
        setBloodGroup("");
        setEmergencyContact("");
        setAddress("");
        setShowAddForm(false);
        await loadDependents();
        setSelectedChildId(res.childProfileId);
      } else {
        setFormError(res.error || "Failed to create dependent child profile.");
      }
    } catch (err) {
      console.error(err);
      setFormError("An unexpected error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const getVaccineStatus = (vaccine: Vaccine): "COMPLETED" | "DUE" | "MISSED" | "UPCOMING" => {
    if (vaccine.administeredDate) return "COMPLETED";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduled = new Date(vaccine.scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - scheduled.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) return "MISSED";
    if (daysDiff >= 0 && daysDiff <= 30) return "DUE";
    if (scheduled.getTime() > today.getTime()) return "UPCOMING";

    // fallback for historical due dates that are overdue but within the 30-day window
    return "DUE";
  };

  if (status === "loading" && loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-7 py-4 rounded-3xl border border-stone-200/80 shadow-warm-md">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-bold text-[#042618]">Loading Vaccine Tracker...</div>
        </div>
      </div>
    );
  }

  const selectedChild = dependents.find((d) => d.id === selectedChildId);

  // Group vaccines for selected child
  const categorizedVaccines = selectedChild
    ? selectedChild.vaccines.map((v) => ({ ...v, computedStatus: getVaccineStatus(v) }))
    : [];

  const completedList = categorizedVaccines.filter((v) => v.computedStatus === "COMPLETED");
  const dueList = categorizedVaccines.filter((v) => v.computedStatus === "DUE");
  const missedList = categorizedVaccines.filter((v) => v.computedStatus === "MISSED");
  const upcomingList = categorizedVaccines.filter((v) => v.computedStatus === "UPCOMING");

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8 shrink-0">
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
              Child Immunization & Vaccine Tracker
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Track universal immunization schedules under India&apos;s Universal Immunization Programme (UIP)
            </p>
          </div>
        </header>

        {/* Dependents Selection / Add dependent widget */}
        <div className="grid lg:grid-cols-4 gap-8 mb-12 flex-grow">
          {/* Dependents list side block */}
          <div className="lg:col-span-1 bg-white border border-stone-200/80 p-6 rounded-3xl space-y-6 h-fit shadow-warm-sm">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Linked Dependents</h3>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs text-[#042618] font-bold hover:underline"
              >
                {showAddForm ? "View List" : "+ Add Child"}
              </button>
            </div>

            {showAddForm ? (
              <form onSubmit={handleAddSubmit} className="space-y-3.5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Child's Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Blood Group (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. O+"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Emergency Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="Phone number"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 uppercase tracking-wider">Home Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="Address details"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{formLoading ? "Adding..." : "Seed UIP Schedule"}</span>
                </button>
              </form>
            ) : dependents.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">No child dependents linked to your account.</p>
            ) : (
              <div className="space-y-2">
                {dependents.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => setSelectedChildId(dep.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all text-xs font-bold ${
                      dep.id === selectedChildId
                        ? "bg-[#E0F2E7] border-[#042618] text-[#042618] shadow-warm-sm"
                        : "bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-white hover:border-stone-300"
                    }`}
                  >
                    <div>{dep.user.name}</div>
                    <div className="text-[10px] text-stone-500 mt-1 font-normal">
                      DOB: {new Date(dep.dateOfBirth).toLocaleDateString()} | {dep.gender}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vaccine schedules panel */}
          <div className="lg:col-span-3 space-y-8">
            {!selectedChild ? (
              <div className="p-12 text-center bg-white border border-stone-200/80 rounded-3xl text-stone-500 text-xs shadow-warm-sm">
                Select a child dependent from the list or add a new dependent profile to view their vaccine status.
              </div>
            ) : (
              <div className="space-y-8">
                {/* Missed / Overdue Alerts */}
                {missedList.length > 0 && (
                  <div className="p-5 bg-rose-50/80 border border-rose-200 text-rose-850 rounded-3xl shadow-warm-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 mb-0.5">Overdue / Missed Immunizations ({missedList.length})</h4>
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        There are {missedList.length} scheduled doses overdue by more than 30 days. Please coordinate with your pediatrician to administer these as soon as possible.
                      </p>
                    </div>
                  </div>
                )}

                {/* Due Reminders */}
                {dueList.length > 0 && (
                  <div className="p-5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-3xl shadow-warm-sm flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 mb-0.5">Immunizations Due Now ({dueList.length})</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        The child is due for {dueList.length} vaccine doses within the active window. Connected doctors can mark these completed upon administration.
                      </p>
                    </div>
                  </div>
                )}

                {/* Due list */}
                {dueList.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-sm text-[#042618]">
                        Due Immunizations
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {dueList.map((v) => (
                        <div key={v.id} className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-[#042618] text-xs">{v.vaccineName}</h4>
                              <span className="text-[10px] px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-2 font-mono">
                              Due Date: {new Date(v.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Missed list */}
                {missedList.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <h3 className="font-bold text-sm text-[#042618]">
                        Overdue / Missed Vaccinations
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {missedList.map((v) => (
                        <div key={v.id} className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-stone-800 text-xs">{v.vaccineName}</h4>
                              <span className="text-[10px] px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-full font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-600 mt-2 font-mono">
                              Was Due: {new Date(v.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Upcoming list */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-[#042618]" />
                    <h3 className="font-bold text-sm text-[#042618]">
                      Upcoming Immunizations
                    </h3>
                  </div>
                  {upcomingList.length === 0 ? (
                    <p className="text-xs text-stone-500">No upcoming vaccine records scheduled.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {upcomingList.map((v) => (
                        <div key={v.id} className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-stone-800 text-xs">{v.vaccineName}</h4>
                              <span className="text-[10px] px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-2 font-mono">
                              Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Completed list */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-[#0F3824]" />
                    <h3 className="font-bold text-sm text-[#042618]">
                      Completed Immunizations
                    </h3>
                  </div>
                  {completedList.length === 0 ? (
                    <p className="text-xs text-stone-500">No vaccine doses marked as completed yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {completedList.map((v) => (
                        <div key={v.id} className="p-5 bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h4 className="font-bold text-stone-500 text-xs line-through">{v.vaccineName}</h4>
                              <span className="text-[10px] px-2.5 py-0.5 bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0] rounded-full font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-600 space-y-0.5">
                              <div>Administered: {v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : ""}</div>
                              <div>By: {v.administeredBy || "Verified Practitioner"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
