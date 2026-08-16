"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, Plus, Trash2, ArrowLeft, CheckCircle2, FileText } from "lucide-react";
import { createPrescription } from "@/app/actions/appointment";
import { jsPDF } from "jspdf";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface AppointmentOption {
  id: string;
  scheduledAt: Date;
  reasonForVisit: string;
}

interface PrescribeFormProps {
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorUserId: string;
  appointments: AppointmentOption[];
}

export default function PrescribeForm({
  patientId,
  patientName,
  doctorName,
  doctorUserId,
  appointments,
}: PrescribeFormProps) {
  const router = useRouter();

  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddRow = () => {
    setMedications((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const handleRemoveRow = (idx: number) => {
    if (medications.length === 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedicationChange = (idx: number, field: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === idx ? { ...med, [field]: value } : med))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const invalid = medications.some(
      (med) => !med.name.trim() || !med.dosage.trim() || !med.frequency.trim() || !med.duration.trim()
    );
    if (invalid) {
      setError("Please fill out all fields for the medications.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Create prescription record
      const res = await createPrescription(
        doctorUserId,
        patientId,
        selectedAppointmentId || null,
        medications
      );

      if (!res.success || !res.prescriptionId) {
        setError(res.error || "Failed to create prescription in database");
        setLoading(false);
        return;
      }

      const prescriptionId = res.prescriptionId;

      // 2. Generate PDF using jsPDF
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("MEDICONNECT DIGITAL PRESCRIPTION", 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Prescription ID: ${prescriptionId}`, 20, 30);
      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, 36);
      doc.text(`Doctor: ${doctorName}`, 20, 42);
      doc.text(`Patient: ${patientName}`, 20, 48);
      doc.line(20, 54, 190, 54);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Rx Medications:", 20, 64);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      let y = 74;
      medications.forEach((med, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${idx + 1}. ${med.name} (${med.dosage})`, 20, y);
        doc.text(`   Frequency: ${med.frequency} | Duration: ${med.duration}`, 20, y + 6);
        y += 18;
      });

      doc.line(20, y + 6, 190, y + 6);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("This is a digitally generated medical prescription issued via MediConnect secure portal.", 20, y + 16);

      const pdfBlob = doc.output("blob");

      // 3. Upload PDF to server
      const formData = new FormData();
      formData.append("file", pdfBlob, `prescription-${prescriptionId}.pdf`);
      formData.append("prescriptionId", prescriptionId);

      const uploadRes = await fetch("/api/doctor/prescriptions/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError("Prescription recorded, but PDF compilation upload failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during prescription compiling.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 font-sans p-6 sm:p-10 relative flex flex-col justify-between">
      <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#E0F2E7]/40 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full z-10 relative flex-grow flex flex-col">
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
              Issue Digital Prescription
            </h1>
            <p className="text-stone-600 text-sm mt-0.5">
              Prescribing for patient: <span className="text-[#042618] font-bold">{patientName}</span>
            </p>
          </div>
        </header>

        {success ? (
          <div className="max-w-xl mx-auto text-center bg-white border border-stone-200/80 p-10 rounded-3xl mt-8 shadow-warm-sm">
            <div className="w-16 h-16 rounded-full bg-[#E0F2E7] text-[#042618] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#042618] mb-2">Prescription Issued Successfully</h2>
            <p className="text-stone-600 text-xs mb-8 leading-relaxed">
              The digital prescription has been logged to the patient&apos;s EHR record, signed with doctor credentials, and exported as a downloadable PDF in their portal.
            </p>
            <button
              onClick={() => router.push("/doctor/dashboard/appointments")}
              className="px-8 py-3 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all"
            >
              Back to Appointments
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Link to appointment */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-warm-sm">
              <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                Associate with Consultation (Optional)
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full bg-stone-50/70 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#042618]"
              >
                <option value="">No appointment association</option>
                {appointments.map((appt) => (
                  <option key={appt.id} value={appt.id}>
                    {new Date(appt.scheduledAt).toLocaleDateString()} - {appt.reasonForVisit}
                  </option>
                ))}
              </select>
            </div>

            {/* Medications list */}
            <div className="bg-white border border-stone-200/80 p-6 sm:p-8 rounded-3xl shadow-warm-sm space-y-6">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#042618]" />
                  <h3 className="text-base font-bold text-[#042618]">Medication Regimen</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E0F2E7] hover:bg-[#D0EBD9] text-[#042618] font-bold rounded-xl text-xs transition-colors border border-[#C1E5D0]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="space-y-4">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="grid sm:grid-cols-4 gap-3 p-4 bg-stone-50/70 border border-stone-200/80 rounded-2xl relative"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Drug Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amoxicillin"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#042618]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Dosage</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500mg"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#042618]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Frequency</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Twice daily after food"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(idx, "frequency", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#042618]"
                      />
                    </div>
                    <div className="relative pr-8">
                      <label className="block text-[11px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(idx, "duration", e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#042618]"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="absolute right-0 bottom-2 text-rose-500 hover:text-rose-700 font-bold w-6 h-6 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#042618] hover:bg-[#073824] text-white font-bold rounded-2xl text-xs shadow-warm-sm transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{loading ? "Compiling & Uploading Prescription..." : "Sign & Issue Digital Prescription"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
