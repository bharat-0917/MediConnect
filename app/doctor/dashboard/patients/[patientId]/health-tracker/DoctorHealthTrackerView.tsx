"use client";

import Link from "next/link";
import { ArrowLeft, Target, Footprints, Moon } from "lucide-react";
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
  rawDate: string | Date;
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
  goals: Record<string, number | string>;
}

export default function DoctorHealthTrackerView({
  patientName,
  metrics,
  goals,
}: DoctorHealthTrackerViewProps) {
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
                href="/doctor/dashboard/appointments" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042618] hover:text-[#0F3824] bg-[#E0F2E7]/70 hover:bg-[#E0F2E7] px-3 py-1 rounded-full border border-[#C1E5D0]/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Appointments</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#042618]">
              Patient Health & Vitals Monitoring
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Longitudinal biometric trends for patient: <span className="text-[#042618] font-bold">{patientName}</span>
            </p>
          </div>
        </header>

        {/* Goals Info Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-stone-500 text-xs block mb-0.5 font-medium">Weight Goal</span>
              <span className="text-lg font-extrabold text-[#042618]">
                {goals.weight ? `${goals.weight} kg` : "Not configured"}
              </span>
            </div>
          </div>
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <span className="text-stone-500 text-xs block mb-0.5 font-medium">Daily Steps Target</span>
              <span className="text-lg font-extrabold text-[#042618]">
                {goals.steps ? `${goals.steps.toLocaleString()} steps` : "Not configured"}
              </span>
            </div>
          </div>
          <div className="p-6 bg-white border border-stone-200/80 rounded-3xl shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-stone-500 text-xs block mb-0.5 font-medium">Target Sleep Duration</span>
              <span className="text-lg font-extrabold text-[#042618]">
                {goals.sleep ? `${goals.sleep} Hours` : "Not configured"}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Weight Chart */}
          <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm">
            <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Weight Log (kg)</h4>
            <div className="h-[200px] w-full">
              {weightData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                  No weight recordings logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="colorWeightD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#042618" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#042618" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="weight" stroke="#042618" fill="url(#colorWeightD)" strokeWidth={2} name="Weight (kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* BP Chart */}
          <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm">
            <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Blood Pressure (mmHg)</h4>
            <div className="h-[200px] w-full">
              {bpData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                  No BP recordings logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bpData}>
                    <defs>
                      <linearGradient id="colorBpD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27794D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#27794D" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="systolic" stroke="#27794D" fill="url(#colorBpD)" strokeWidth={2} name="Systolic" />
                    <Area type="monotone" dataKey="diastolic" stroke="#e11d48" fill="none" strokeWidth={1.5} name="Diastolic" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Steps Chart */}
          <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm">
            <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Daily Steps</h4>
            <div className="h-[200px] w-full">
              {stepsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                  No step counts logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stepsData}>
                    <defs>
                      <linearGradient id="colorStepsD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="steps" stroke="#10b981" fill="url(#colorStepsD)" strokeWidth={2} name="Steps" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Heart Rate Chart */}
          <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm">
            <h4 className="font-bold text-xs text-stone-700 mb-6 uppercase tracking-wider">Heart Rate Trends (BPM)</h4>
            <div className="h-[200px] w-full">
              {hrData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400 font-medium">
                  No BPM recordings logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hrData}>
                    <defs>
                      <linearGradient id="colorHrD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="heartRate" stroke="#e11d48" fill="url(#colorHrD)" strokeWidth={2} name="Heart Rate (BPM)" />
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
