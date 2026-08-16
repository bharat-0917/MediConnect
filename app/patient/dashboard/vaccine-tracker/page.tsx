"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createChildProfile } from "@/app/actions/health";

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

  const loadDependents = async () => {
    try {
      const res = await fetch("/api/patient/dependents");
      if (res.ok) {
        const data = await res.json();
        setDependents(data);
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
    if (session?.user?.id) {
      loadDependents();
    }
  }, [session]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Vaccine Tracker...</div>
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Dependent Vaccine Tracker
            </h1>
            <p className="text-slate-400 text-sm">
              Manage vaccination immunization schedules under India's Universal Immunization Programme (UIP)
            </p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        {/* Dependents Selection / Add dependent widget */}
        <div className="grid lg:grid-cols-4 gap-8 mb-12 flex-grow">
          {/* Dependents list side block */}
          <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl space-y-6 h-fit">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
              <h3 className="font-bold text-sm text-slate-200">Linked Children</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                {showAddForm ? "View Dependents" : "+ Add Child"}
              </button>
            </div>

            {showAddForm ? (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] rounded-xl">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Child's Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Blood Group (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. O+"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="Phone number"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 mb-1">Home Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="Address details"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  {formLoading ? "Adding..." : "Seed UIP Vaccine Schedule"}
                </button>
              </form>
            ) : dependents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No child dependents linked to your account.</p>
            ) : (
              <div className="space-y-2">
                {dependents.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => setSelectedChildId(dep.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                      dep.id === selectedChildId
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900/80"
                    }`}
                  >
                    <div>{dep.user.name}</div>
                    <div className="text-[10px] text-slate-550 mt-1 font-normal">
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
              <div className="p-12 text-center bg-slate-800/10 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                Select a child dependent or register a new one to view the vaccination tracker.
              </div>
            ) : (
              <div className="space-y-10">
                {/* Missed / Overdue Alerts */}
                {missedList.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                    <h4 className="text-xs font-bold mb-1">⚠️ Overdue / Missed Vaccinations Detected</h4>
                    <p className="text-[10px] text-red-400/80">
                      There are {missedList.length} scheduled immunizations that are overdue by more than 30 days. Please coordinate with your medical specialist to schedule their administration immediately.
                    </p>
                  </div>
                )}

                {/* Due Reminders */}
                {dueList.length > 0 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                    <h4 className="text-xs font-bold mb-1">📅 Immunizations Due</h4>
                    <p className="text-[10px] text-amber-400/80">
                      The child is due for {dueList.length} vaccination doses within the active window. Schedule a consultation to mark these completed.
                    </p>
                  </div>
                )}

                {/* Due list */}
                {dueList.length > 0 && (
                  <section>
                    <h3 className="font-bold text-sm text-amber-400 mb-4 flex items-center gap-2">
                      🟡 Due Immunizations
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {dueList.map((v) => (
                        <div key={v.id} className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-white text-xs">{v.vaccineName}</h4>
                              <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
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
                    <h3 className="font-bold text-sm text-red-400 mb-4 flex items-center gap-2">
                      🔴 Overdue / Missed Vaccinations
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {missedList.map((v) => (
                        <div key={v.id} className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-white text-xs">{v.vaccineName}</h4>
                              <span className="text-[9px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
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
                  <h3 className="font-bold text-sm text-slate-350 mb-4 flex items-center gap-2">
                    🔵 Upcoming Vaccines
                  </h3>
                  {upcomingList.length === 0 ? (
                    <p className="text-xs text-slate-600">No upcoming vaccine records scheduled.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {upcomingList.map((v) => (
                        <div key={v.id} className="p-5 bg-slate-800/20 border border-slate-800 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-bold text-slate-300 text-xs">{v.vaccineName}</h4>
                              <span className="text-[9px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2">
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
                  <h3 className="font-bold text-sm text-teal-400 mb-4 flex items-center gap-2">
                    🟢 Completed Immunizations
                  </h3>
                  {completedList.length === 0 ? (
                    <p className="text-xs text-slate-600">No vaccine doses marked as completed yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {completedList.map((v) => (
                        <div key={v.id} className="p-5 bg-slate-800/10 border border-slate-800/50 rounded-2xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h4 className="font-bold text-slate-400 text-xs line-through">{v.vaccineName}</h4>
                              <span className="text-[9px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded font-bold">
                                Dose {v.doseNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-550 space-y-1">
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
