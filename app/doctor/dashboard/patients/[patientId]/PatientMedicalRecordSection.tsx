"use client";

import { useState } from "react";
import { 
  History, 
  Plus, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Stethoscope, 
  Activity, 
  Flame, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  X,
  FileText
} from "lucide-react";

export interface MedicalRecordItem {
  id: string;
  category: string;
  title: string;
  description: string;
  dateOccurred: string | Date;
  status: string;
  hospital?: string | null;
  attachments?: string | null;
  doctor?: {
    user?: {
      name: string | null;
    } | null;
  } | null;
}

interface PatientMedicalRecordSectionProps {
  patientId: string;
  patientName: string;
  initialRecords: MedicalRecordItem[];
  allowAdd?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; badgeClass: string; icon: typeof Activity }> = {
  SURGERY_OPERATION: {
    label: "Surgery / Operation",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: Stethoscope,
  },
  CHRONIC_CONDITION: {
    label: "Chronic Condition (BP/Sugar)",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Activity,
  },
  RARE_CONDITION: {
    label: "Rare Condition",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Sparkles,
  },
  PAST_DISEASE: {
    label: "Past Major Disease / Infection",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: History,
  },
  ALLERGY: {
    label: "Severe Allergy / Adverse Reaction",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Flame,
  },
  OTHER: {
    label: "Other Clinical History",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    icon: FileText,
  },
};

const STATUS_MAP: Record<string, { label: string; badgeClass: string }> = {
  ONGOING: { label: "Ongoing Active", badgeClass: "bg-amber-100 text-amber-900 border-amber-300" },
  MANAGED: { label: "Managed / Under Control", badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  RESOLVED: { label: "Fully Resolved", badgeClass: "bg-stone-100 text-stone-700 border-stone-200" },
  CRITICAL: { label: "Critical High-Risk", badgeClass: "bg-rose-100 text-rose-900 border-rose-300" },
};

export default function PatientMedicalRecordSection({
  patientId,
  patientName,
  initialRecords,
  allowAdd = true,
}: PatientMedicalRecordSectionProps) {
  const [records, setRecords] = useState<MedicalRecordItem[]>(initialRecords);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("SURGERY_OPERATION");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOccurred, setDateOccurred] = useState("");
  const [status, setStatus] = useState("RESOLVED");
  const [hospital, setHospital] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dateOccurred) {
      setError("Please fill in the title, description, and event date.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/doctor/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          category,
          title,
          description,
          dateOccurred,
          status,
          hospital: hospital || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record medical entry");
      }

      setRecords((prev) => [data, ...prev]);
      setShowAddModal(false);
      // Reset form
      setTitle("");
      setDescription("");
      setDateOccurred("");
      setHospital("");
      setStatus("RESOLVED");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = filterCategory === "ALL" 
    ? records 
    : records.filter((r) => r.category === filterCategory);

  // Sort timeline chronologically descending
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const da = new Date(a.dateOccurred).getTime();
    const db = new Date(b.dateOccurred).getTime();
    return db - da;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2E7] text-[#042618] border border-[#C1E5D0]">
              PMR Verified Ledger
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Comprehensive Health Timeline
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#042618]">
            Patient Medical Record (PMR)
          </h2>
          <p className="text-stone-600 text-xs mt-0.5">
            Surgeries, chronic conditions (BP/Diabetes), rare disorders, and past medical history for {patientName}
          </p>
        </div>

        {allowAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm hover:shadow-warm-md w-fit shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Medical History Entry</span>
          </button>
        )}
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">Filter:</span>
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filterCategory === "ALL"
              ? "bg-[#042618] text-white border-[#042618] shadow-warm-sm"
              : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          All Timeline ({records.length})
        </button>
        {Object.entries(CATEGORY_MAP).map(([catKey, info]) => {
          const count = records.filter((r) => r.category === catKey).length;
          return (
            <button
              key={catKey}
              onClick={() => setFilterCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filterCategory === catKey
                  ? "bg-[#042618] text-white border-[#042618] shadow-warm-sm"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {info.label.split("(")[0]} {count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Timeline View */}
      {sortedRecords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200/80 rounded-3xl shadow-warm-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center mx-auto shadow-warm-sm">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#042618]">No Medical Record History Logged</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            There are currently no recorded surgeries, chronic diseases (e.g. Hypertension, Diabetes), or rare conditions on file for this patient.
          </p>
          {allowAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs transition-all shadow-warm-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Past Surgery or Condition</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200 space-y-6">
          {sortedRecords.map((item, idx) => {
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.OTHER;
            const IconComp = catInfo.icon;
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.RESOLVED;
            const dateObj = new Date(item.dateOccurred);

            return (
              <div key={item.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[30px] sm:-left-[34px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#042618] text-[#042618] flex items-center justify-center shadow-warm-sm group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-[#042618]" />
                </div>

                {/* Card Container */}
                <div className="bg-white border border-stone-200/80 p-5 sm:p-6 rounded-3xl shadow-warm-sm hover:shadow-warm-md transition-all space-y-3">
                  {/* Top Badge & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${catInfo.badgeClass}`}>
                        <IconComp className="w-3 h-3" />
                        <span>{catInfo.label}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#042618]" />
                      <span>{dateObj.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-[#042618] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-stone-700 text-xs leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>

                  {/* Metadata Row: Hospital and Logged by Doctor */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.hospital ? `Hospital/Clinic: ${item.hospital}` : "Medical Facility Not Specified"}</span>
                    </div>
                    {item.doctor?.user?.name && (
                      <div className="flex items-center gap-1 text-[#042618] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recorded by Dr. {item.doctor.user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add PMR Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200/80 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-warm-lg space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E0F2E7] text-[#042618] flex items-center justify-center shadow-warm-sm">
                  <Plus className="w-5 h-5 text-[#042618]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#042618]">
                    Record Patient Medical History (PMR)
                  </h3>
                  <p className="text-stone-500 text-xs">Logged into permanent timeline for {patientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Condition Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                >
                  <option value="SURGERY_OPERATION">Surgery / Surgical Operation (e.g. Appendectomy, Bypass)</option>
                  <option value="CHRONIC_CONDITION">Chronic Condition (e.g. Hypertension BP, Type-2 Diabetes)</option>
                  <option value="RARE_CONDITION">Rare / Genetic Condition (e.g. Wilson Disease, ALS, Celiac)</option>
                  <option value="PAST_DISEASE">Past Major Disease / Infection (e.g. Tuberculosis, Malaria, Dengue)</option>
                  <option value="ALLERGY">Severe Allergy / Anaphylaxis</option>
                  <option value="OTHER">Other Clinical History</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Title / Diagnosis / Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laparoscopic Appendectomy or Chronic Hypertension"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                />
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Date of Occurrence / Diagnosis *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOccurred}
                    onChange={(e) => setDateOccurred(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Current Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                  >
                    <option value="ONGOING">Ongoing Active</option>
                    <option value="MANAGED">Managed / Under Control</option>
                    <option value="RESOLVED">Fully Resolved / Past</option>
                    <option value="CRITICAL">Critical High-Risk</option>
                  </select>
                </div>
              </div>

              {/* Hospital / Clinic */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Hospital / Medical Center (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. City General Hospital, Apollo Hospital"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                />
              </div>

              {/* Clinical Details / Description */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Clinical Details &amp; Past Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Mention findings, surgical outcome, treatment received, baseline readings (e.g. BP 150/95 mmHg, HbA1c 8.2%), or key precautions."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#042618]/20 focus:border-[#042618]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-xl transition-all shadow-warm-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Save to Timeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
