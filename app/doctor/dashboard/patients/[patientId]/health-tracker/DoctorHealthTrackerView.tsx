"use client";

import { useRouter } from "next/navigation";
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

interface DoctorHealthTrackerViewProps {
  patientName: string;
  metrics: MetricRow[];
  goals: Record<string, any>;
}

export default function DoctorHealthTrackerView({
  patientName,
  metrics,
  goals,
}: DoctorHealthTrackerViewProps) {
  const router = useRouter();

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

  const weightData = getChartData("WEIGHT");
  const bpData = getChartData("BLOOD_PRESSURE");
  const sugarData = getChartData("BLOOD_SUGAR");
  const sleepData = getChartData("SLEEP");
  const stepsData = getChartData("STEPS");
  const hrData = getChartData("HEART_RATE");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Patient Vitals Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              Monitoring health trends for patient: <span className="text-teal-400 font-semibold">{patientName}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard/appointments")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Back to Appointments
          </button>
        </header>

        {/* Goals Info Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
            <span className="text-slate-500 text-xs block mb-1">Weight Target</span>
            <span className="text-lg font-bold text-white">
              {goals.weight ? `${goals.weight} kg` : "Not configured"}
            </span>
          </div>
          <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
            <span className="text-slate-500 text-xs block mb-1">Daily Steps Target</span>
            <span className="text-lg font-bold text-white">
              {goals.steps ? `${goals.steps.toLocaleString()} steps` : "Not configured"}
            </span>
          </div>
          <div className="p-6 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
            <span className="text-slate-500 text-xs block mb-1">Ideal Sleep Duration</span>
            <span className="text-lg font-bold text-white">
              {goals.sleep ? `${goals.sleep} Hours` : "Not configured"}
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Weight Chart */}
          <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
            <h4 className="font-bold text-sm text-slate-300 mb-6">Weight Log</h4>
            <div className="h-[200px] w-full">
              {weightData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                  No weight recordings logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="colorWeightD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Area type="monotone" dataKey="weight" stroke="#06b6d4" fill="url(#colorWeightD)" strokeWidth={2} name="Weight (kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* BP Chart */}
          <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
            <h4 className="font-bold text-sm text-slate-300 mb-6">Blood Pressure</h4>
            <div className="h-[200px] w-full">
              {bpData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                  No BP recordings logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bpData}>
                    <defs>
                      <linearGradient id="colorBpD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Area type="monotone" dataKey="systolic" stroke="#14b8a6" fill="url(#colorBpD)" strokeWidth={2} name="Systolic" />
                    <Area type="monotone" dataKey="diastolic" stroke="#f43f5e" fill="none" strokeWidth={1.5} name="Diastolic" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Steps Chart */}
          <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
            <h4 className="font-bold text-sm text-slate-300 mb-6">Daily Steps</h4>
            <div className="h-[200px] w-full">
              {stepsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                  No step counts logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stepsData}>
                    <defs>
                      <linearGradient id="colorStepsD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Area type="monotone" dataKey="steps" stroke="#10b981" fill="url(#colorStepsD)" strokeWidth={2} name="Steps" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Heart Rate Chart */}
          <div className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl">
            <h4 className="font-bold text-sm text-slate-300 mb-6">Heart Rate (Pulse)</h4>
            <div className="h-[200px] w-full">
              {hrData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-655 font-semibold">
                  No heart rate metrics recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hrData}>
                    <defs>
                      <linearGradient id="colorHrD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                    <Area type="monotone" dataKey="heartRate" stroke="#ec4899" fill="url(#colorHrD)" strokeWidth={2} name="BPM" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
