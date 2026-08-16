"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logHealthMetric, savePatientGoals } from "@/app/actions/health";
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
  const [goals, setGoals] = useState<Record<string, any>>({});

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
    let valueObj: Record<string, any> = {};

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
    const goalsObj = {
      weight: targetWeight ? parseFloat(targetWeight) : null,
      steps: targetSteps ? parseInt(targetSteps) : null,
      sleep: targetSleep ? parseFloat(targetSleep) : null,
    };

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
        rawDate: m.recordedAt,
        ...val,
      };
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold">Loading Health Tracker...</div>
      </div>
    );
  }

  const weightData = getChartData("WEIGHT");
  const bpData = getChartData("BLOOD_PRESSURE");
  const sugarData = getChartData("BLOOD_SUGAR");
  const sleepData = getChartData("SLEEP");
  const stepsData = getChartData("STEPS");
  const hrData = getChartData("HEART_RATE");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Personal Health Metrics
            </h1>
            <p className="text-slate-400 text-sm">Log vitals, set target goals, and monitor trends over time</p>
          </div>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Entry Form Column */}
          <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl space-y-6 h-fit">
            <div>
              <h3 className="font-bold text-base text-white mb-4">Log New Vitals</h3>
              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Metric Category</label>
                  <select
                    value={metricType}
                    onChange={(e) => {
                      setMetricType(e.target.value as any);
                      setVal1("");
                      setVal2("");
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    {metricType === "BLOOD_PRESSURE" ? "Systolic Pressure" : "Recorded Value"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={
                      metricType === "STEPS" ? "e.g. 8500" : "e.g. 72.5"
                    }
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {metricType === "BLOOD_PRESSURE" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Diastolic Pressure</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 80"
                      value={val2}
                      onChange={(e) => setVal2(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={logLoading || !val1}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {logLoading ? "Saving..." : "Record Entry"}
                </button>
              </form>
            </div>

            {/* Goal Setting Widget */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="font-bold text-base text-white mb-4">Set Target Goals</h3>
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 70"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Daily Steps Goal</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={targetSteps}
                    onChange={(e) => setTargetSteps(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target Sleep (Hours)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 8"
                    value={targetSleep}
                    onChange={(e) => setTargetSleep(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={goalLoading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                >
                  {goalLoading ? "Saving..." : "Save Goal Targets"}
                </button>
              </form>
            </div>
          </div>

          {/* Charts Display */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            {/* Weight Chart */}
            <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-1">Body Weight Trends</h4>
                <p className="text-[10px] text-slate-500 mb-4">
                  Target Goal: {goals.weight ? `${goals.weight} kg` : "Not set"}
                </p>
              </div>
              <div className="h-[180px] w-full">
                {weightData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                    No weight metrics recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                      <Area type="monotone" dataKey="weight" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} name="Weight (kg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BP Chart */}
            <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-1">Blood Pressure Log</h4>
                <p className="text-[10px] text-slate-500 mb-4">Target Reference Range: 120/80 mmHg</p>
              </div>
              <div className="h-[180px] w-full">
                {bpData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                    No blood pressure metrics logged.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bpData}>
                      <defs>
                        <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                      <Area type="monotone" dataKey="systolic" stroke="#14b8a6" fill="url(#colorBp)" strokeWidth={2} name="Systolic" />
                      <Area type="monotone" dataKey="diastolic" stroke="#f43f5e" fill="none" strokeWidth={1.5} name="Diastolic" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Steps Chart */}
            <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-1">Daily Steps Tracker</h4>
                <p className="text-[10px] text-slate-500 mb-4">
                  Target Goal: {goals.steps ? `${goals.steps} steps` : "Not set"}
                </p>
              </div>
              <div className="h-[180px] w-full">
                {stepsData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                    No daily steps logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stepsData}>
                      <defs>
                        <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                      <Area type="monotone" dataKey="steps" stroke="#10b981" fillOpacity={1} fill="url(#colorSteps)" strokeWidth={2} name="Steps" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Heart Rate Chart */}
            <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-1">Heart Rate Log</h4>
                <p className="text-[10px] text-slate-500 mb-4">Reference range: 60 - 100 BPM</p>
              </div>
              <div className="h-[180px] w-full">
                {hrData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                    No heart rate entries recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hrData}>
                      <defs>
                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                      <Area type="monotone" dataKey="heartRate" stroke="#ec4899" fillOpacity={1} fill="url(#colorHr)" strokeWidth={2} name="BPM" />
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
