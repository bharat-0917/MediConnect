"use client";

import { QRCodeCanvas } from "qrcode.react";

interface PatientQRCodeProps {
  patientId: string;
  patientName: string;
  size?: number;
  canvasId?: string;
  showDetails?: boolean;
}

export default function PatientQRCode({
  patientId,
  patientName,
  size = 148,
  canvasId = "patient-card-qr-canvas",
  showDetails = true,
}: PatientQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeCanvas
        id={canvasId}
        value={patientId}
        size={size}
        bgColor="#ffffff"
        fgColor="#042618"
        level="H"
        includeMargin={false}
      />
      {showDetails && (
        <div className="text-center space-y-0.5">
          <p className="text-[11px] font-bold text-stone-700">{patientName}</p>
          <p className="text-[10px] text-stone-400 font-mono break-all">{patientId}</p>
        </div>
      )}
    </div>
  );
}
