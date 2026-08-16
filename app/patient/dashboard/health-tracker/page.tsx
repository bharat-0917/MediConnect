"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { logHealthMetric, savePatientGoals } from "@/app/actions/health";
import { Activity, HeartPulse, ArrowLeft, Target, TrendingUp, PlusCircle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface MetricRow {
  id: string;
  type: string;
  value: string; // JSON string
  recordedAt: Date | string;
}

interface ParsedMetric {
  date: string;
  rawDate: string;
  weight?: number;
  systolic?: number;
  diastolic?: number;
  sugar?: number;
  sleep?: number;
  steps?: number;
  heartRate?: number;
}

export default function HealthTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [goals, setGoals] = useState<Record<string, number | string>>({});

  // Logging Form states
  const [metricType, setMetricType] = useState<
    "WEIGHT" | "BLOOD_PRESSURE" | "BLOOD_SUGAR" | "SLEEP" | "STEPS" | "HEART_RATE"
  >("WEIGHT");
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState(""); // For Diastolic BP
  const [logLoading, setLogLoading] = useState(false);

  // Goal Form states
  const [targetWeight, setTargetWeight] = useState("");
  const [targetSteps, setTargetSteps] = useState("");
  const [targetSleep, setTargetSleep] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/patient");
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/patient/health-metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setGoals(data.goals);

        // Populate goal inputs
        setTargetWeight(data.goals.weight || "");
        setTargetSteps(data.goals.steps || "");
        setTargetSleep(data.goals.sleep || "");
      }
    } catch (err) {
      console.error("Failed to load health metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val1 || logLoading || !session?.user?.id) return;

    setLogLoading(true);
    let valueObj: Record<string, number | string> = {};

    if (metricType === "BLOOD_PRESSURE") {
      if (!val2) {
        alert("Please enter diastolic pressure.");
        setLogLoading(false);
        return;
      }
      valueObj = { systolic: parseFloat(val1), diastolic: parseFloat(val2) };
    } else if (metricType === "WEIGHT") {
      valueObj = { weight: parseFloat(val1) };
    } else if (metricType === "BLOOD_SUGAR") {
      valueObj = { sugar: parseFloat(val1) };
    } else if (metricType === "SLEEP") {
      valueObj = { sleep: parseFloat(val1) };
    } else if (metricType === "STEPS") {
      valueObj = { steps: parseInt(val1) };
    } else if (metricType === "HEART_RATE") {
      valueObj = { heartRate: parseFloat(val1) };
    }

    try {
      const res = await logHealthMetric(session.user.id, metricType, valueObj);
      if (res.success) {
        setVal1("");
        setVal2("");
        await fetchData();
      } else {
        alert(res.error || "Failed to log metric.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalLoading || !session?.user?.id) return;

    setGoalLoading(true);
    const goalsObj: Record<string, number> = {};
    if (targetWeight) goalsObj.weight = parseFloat(targetWeight);
    if (targetSteps) goalsObj.steps = parseInt(targetSteps);
    if (targetSleep) goalsObj.sleep = parseFloat(targetSleep);

    try {
      const res = await savePatientGoals(session.user.id, goalsObj);
      if (res.success) {
        alert("Your health targets have been updated.");
        await fetchData();
      } else {
        alert(res.error || "Failed to save goals.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGoalLoading(false);
    }
  };

  // Helper to parse metric records for charts
  const getChartData = (type: string): ParsedMetric[] => {
    const filtered = metrics.filter((m) => m.type === type);
    return filtered.map((m) => {
      const val = JSON.parse(m.value);
      const d = new Date(m.recordedAt);
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        rawDate: m.recordedAt.toString(),
        ...val,
      };
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-700 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-stone-200/80 shadow-warm-sm">
          <HeartPulse className="w-5 h-5 text-[#042618] animate-pulse" />
          <div className="text-sm font-semibold text-[#042618]">Loading Health Metrics...</div>
        </div>
      </div>
    );
  }

  const weightData = getChartData("WEIGHT");
  const bpData = getChartData("BLOOD_PRESSURE");
  const stepsData = getChartData("STEPS");
  const hrData = getChartData("HEART_RATE");

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
              Personal Health Tracker
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">Log daily vitals, set wellness targets, and monitor long-term trends</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Entry Form Column */}
          <div className="lg:col-span-1 bg-white border border-stone-200/80 p-6 rounded-3xl space-y-6 h-fit shadow-warm-sm">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                <PlusCircle className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Log New Vitals</h3>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Metric Category</label>
                  <select
                    value={metricType}
                    onChange={(e) => {
                      setMetricType(e.target.value as "WEIGHT" | "BLOOD_PRESSURE" | "BLOOD_SUGAR" | "SLEEP" | "STEPS" | "HEART_RATE");
                      setVal1("");
                      setVal2("");
                    }}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
                  >
                    <option value="WEIGHT">Weight (kg)</option>
                    <option value="BLOOD_PRESSURE">Blood Pressure (mmHg)</option>
                    <option value="BLOOD_SUGAR">Blood Sugar (mg/dL)</option>
                    <option value="SLEEP">Sleep (Hours)</option>
                    <option value="STEPS">Steps (count)</option>
                    <option value="HEART_RATE">Heart Rate (BPM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                    {metricType === "BLOOD_PRESSURE" ? "Systolic Pressure (mmHg)" : "Recorded Value"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={
                      metricType === "STEPS" ? "e.g., 8500" : "e.g., 72.5"
                    }
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>

                {metricType === "BLOOD_PRESSURE" && (
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Diastolic Pressure (mmHg)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g., 80"
                      value={val2}
                      onChange={(e) => setVal2(e.target.value)}
                      className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={logLoading || !val1}
                  className="w-full py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all disabled:opacity-50"
                >
                  {logLoading ? "Saving Entry..." : "Record Vitals"}
                </button>
              </form>
            </div>

            {/* Goal Setting Widget */}
            <div className="border-t border-stone-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[#042618]" />
                <h3 className="font-bold text-sm text-[#042618]">Target Goals</h3>
              </div>

              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 70"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Daily Steps Goal</label>
                  <input
                    type="number"
                    placeholder="e.g., 10000"
                    value={targetSteps}
                    onChange={(e) => setTargetSteps(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1.5 uppercase tracking-wider">Target Sleep (Hours)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 8"
                    value={targetSleep}
                    onChange={(e) => setTargetSleep(e.target.value)}
                    className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#042618]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={goalLoading}
                  className="w-full py-2.5 bg-[#E0F2E7] hover:bg-[#D0EBD9] border border-[#C1E5D0] text-[#042618] font-bold rounded-2xl text-xs transition-colors"
                >
                  {goalLoading ? "Saving..." : "Save Goal Targets"}
                </button>
              </form>
            </div>
          </div>

          {/* Charts Display */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            {/* Weight Chart */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl flex flex-col justify-between shadow-warm-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#042618]">Body Weight Trends</h4>
                  <TrendingUp className="w-4 h-4 text-[#042618]" />
                </div>
                <p className="text-xs text-stone-500 mb-4 font-normal">
                  Target Goal: {goals.weight ? `${goals.weight} kg` : "Not set"}
                </p>
              </div>
              <div className="h-[180px] w-full">
                {weightData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                    No weight metrics recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#042618" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#042618" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Area type="monotone" dataKey="weight" stroke="#042618" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} name="Weight (kg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BP Chart */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl flex flex-col justify-between shadow-warm-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#042618]">Blood Pressure Log</h4>
                  <Activity className="w-4 h-4 text-[#042618]" />
                </div>
                <p className="text-xs text-stone-500 mb-4 font-normal">Reference Range: 120/80 mmHg</p>
              </div>
              <div className="h-[180px] w-full">
                {bpData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                    No blood pressure metrics logged.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bpData}>
                      <defs>
                        <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#27794D" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#27794D" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Area type="monotone" dataKey="systolic" stroke="#27794D" fill="url(#colorBp)" strokeWidth={2} name="Systolic" />
                      <Area type="monotone" dataKey="diastolic" stroke="#e11d48" fill="none" strokeWidth={1.5} name="Diastolic" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Steps Chart */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl flex flex-col justify-between shadow-warm-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#042618]">Daily Steps Tracker</h4>
                  <TrendingUp className="w-4 h-4 text-[#042618]" />
                </div>
                <p className="text-xs text-stone-500 mb-4 font-normal">
                  Target Goal: {goals.steps ? `${goals.steps} steps` : "Not set"}
                </p>
              </div>
              <div className="h-[180px] w-full">
                {stepsData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                    No daily steps logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stepsData}>
                      <defs>
                        <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Area type="monotone" dataKey="steps" stroke="#10b981" fillOpacity={1} fill="url(#colorSteps)" strokeWidth={2} name="Steps" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Heart Rate Chart */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl flex flex-col justify-between shadow-warm-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-[#042618]">Heart Rate Log</h4>
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-xs text-stone-500 mb-4 font-normal">Reference Range: 60 - 100 BPM</p>
              </div>
              <div className="h-[180px] w-full">
                {hrData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                    No heart rate entries recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hrData}>
                      <defs>
                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Area type="monotone" dataKey="heartRate" stroke="#e11d48" fillOpacity={1} fill="url(#colorHr)" strokeWidth={2} name="BPM" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
