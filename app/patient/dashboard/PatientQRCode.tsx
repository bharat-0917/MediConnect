"use client";

import { QRCodeSVG } from "qrcode.react";

interface PatientQRCodeProps {
  patientId: string;
  patientName: string;
}

export default function PatientQRCode({ patientId, patientName }: PatientQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <QRCodeSVG
        value={patientId}
        size={148}
        bgColor="#ffffff"
        fgColor="#042618"
        level="H"
        includeMargin={false}
      />
      <div className="text-center space-y-0.5">
        <p className="text-[11px] font-bold text-stone-700">{patientName}</p>
        <p className="text-[10px] text-stone-400 font-mono break-all">{patientId}</p>
      </div>
    </div>
  );
}
