"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-12 relative flex flex-col justify-between">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full z-10 relative flex-grow flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Issue Prescription
            </h1>
            <p className="text-slate-400 text-sm">
              Issuing prescription to patient: <span className="text-teal-400 font-semibold">{patientName}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/dashboard/appointments")}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm"
          >
            Cancel
          </button>
        </header>

        {success ? (
          <div className="max-w-xl mx-auto text-center bg-slate-800/40 border border-slate-700/60 p-10 rounded-3xl mt-8">
            <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-3xl mx-auto mb-6">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Prescription Issued</h2>
            <p className="text-slate-400 mb-8">
              The digital prescription has been recorded in the database, compiled to a PDF document, and shared with the patient dashboard.
            </p>
            <button
              onClick={() => router.push("/doctor/dashboard/appointments")}
              className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl shadow-lg"
            >
              Back to Appointments
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Link to appointment */}
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Associate with Appointment (Optional)
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
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
            <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-3xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
                <h3 className="text-lg font-bold text-white">Medication List</h3>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-4 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-semibold rounded-xl text-xs transition-colors"
                >
                  + Add Medicine
                </button>
              </div>

              <div className="space-y-6">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="grid sm:grid-cols-4 gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl relative"
                  >
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Paracetamol"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Dosage</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500mg"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Frequency</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Twice daily"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(idx, "frequency", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="relative pr-8">
                      <label className="block text-[10px] text-slate-500 mb-1">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(idx, "duration", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-teal-500"
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="absolute right-0 bottom-2 text-red-500 hover:text-red-400 text-sm font-bold w-6 h-6 flex items-center justify-center"
                        >
                          ×
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
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl shadow-lg transition-all"
            >
              {loading ? "Compiling & Uploading Prescription..." : "Confirm & Issue Prescription"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
