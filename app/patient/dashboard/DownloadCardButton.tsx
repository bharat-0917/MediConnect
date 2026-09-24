"use client";

import { useState } from "react";
import { Download, Check, Printer } from "lucide-react";
import { jsPDF } from "jspdf";

interface PatientProfileData {
  id: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  emergencyContact: string;
  address: string | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface DownloadCardButtonProps {
  profile: PatientProfileData;
  canvasId?: string;
}

export default function DownloadCardButton({ profile, canvasId = "patient-card-qr-canvas" }: DownloadCardButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // 1. Get QR code image as Data URL from canvas
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      let qrDataUrl: string | null = null;
      if (canvas) {
        qrDataUrl = canvas.toDataURL("image/png");
      }

      // 2. Create card-sized PDF (Standard ID-1 / CR80 card or neat medical card: 85.6mm x 54mm, or postcard 120mm x 80mm)
      // We will make a professional high-quality card layout: 130mm x 85mm landscape
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [130, 85],
      });

      // Background
      doc.setFillColor(250, 249, 245);
      doc.rect(0, 0, 130, 85, "F");

      // Header Banner - Forest Green
      doc.setFillColor(4, 38, 24);
      doc.rect(0, 0, 130, 16, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("MEDICONNECT HEALTH CARD", 8, 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(224, 242, 231);
      doc.text("Verified Patient Digital Identity", 8, 12.5);

      // Card Body Left: Patient Demographics
      const patientName = profile.user.name || "Patient";
      doc.setTextColor(4, 38, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(patientName, 8, 23);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Patient ID: ${profile.id}`, 8, 27);

      // Decorative divider
      doc.setDrawColor(220, 220, 215);
      doc.setLineWidth(0.3);
      doc.line(8, 29.5, 82, 29.5);

      // Demographics 2-column key-values on left side
      const dobFormatted = profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toLocaleDateString(undefined, {
            month: "numeric",
            day: "numeric",
            year: "numeric",
          })
        : "Not specified";

      const fieldsLeft = [
        { label: "DATE OF BIRTH", value: dobFormatted },
        { label: "BLOOD GROUP", value: profile.bloodGroup || "Not specified" },
        { label: "PHONE", value: profile.user.phone || "Not specified" },
      ];

      const fieldsRight = [
        { label: "GENDER", value: profile.gender || "Not specified" },
        { label: "EMERGENCY CONTACT", value: profile.emergencyContact || "Not specified" },
        { label: "EMAIL", value: profile.user.email || "Not specified" },
      ];

      let startY = 34;
      fieldsLeft.forEach((f, idx) => {
        const y = startY + idx * 8.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(130, 130, 130);
        doc.text(f.label, 8, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 30);
        doc.text(f.value, 8, y + 3.8);
      });

      fieldsRight.forEach((f, idx) => {
        const y = startY + idx * 8.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(130, 130, 130);
        doc.text(f.label, 46, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 30);
        const valText = f.value.length > 22 ? f.value.substring(0, 20) + "..." : f.value;
        doc.text(valText, 46, y + 3.8);
      });

      // Address at bottom
      const addrY = 62;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(130, 130, 130);
      doc.text("HOME ADDRESS", 8, addrY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(40, 40, 40);
      const splitAddress = doc.splitTextToSize(profile.address || "Not specified", 74);
      doc.text(splitAddress, 8, addrY + 3.5);

      // Card Body Right: QR Code Box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(193, 229, 208);
      doc.roundedRect(86, 20, 36, 50, 3, 3, "FD");

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", 89, 23, 30, 30);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(4, 38, 24);
      doc.text("SCAN TO ACCESS EHR", 104, 57.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(120, 120, 120);
      doc.text("MediConnect Practitioner Portal", 104, 61.5, { align: "center" });

      // Footer line
      doc.setFillColor(224, 242, 231);
      doc.rect(0, 77, 130, 8, "F");

      doc.setFont("helvetica", "italic");
      doc.setFontSize(5.5);
      doc.setTextColor(4, 38, 24);
      doc.text("Carry this card for walk-in hospital & clinic visits. Valid across all verified MediConnect doctors.", 65, 82, {
        align: "center",
      });

      // Save PDF
      doc.save(`MediConnect-Card-${patientName.replace(/\s+/g, "_")}.pdf`);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Failed to generate PDF card:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#042618] hover:bg-[#073824] text-white text-xs font-bold rounded-xl transition-all shadow-warm-sm hover:shadow-warm-md disabled:opacity-50"
      title="Download printable physical health card with QR code"
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          <span>Card Downloaded!</span>
        </>
      ) : downloading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-[#E0F2E7]" />
          <span>Download Card (PDF)</span>
        </>
      )}
    </button>
  );
}
