"use client";
// QR code for the live survey. Props: url (string), size (px, default 256). URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import { QRCodeSVG } from "qrcode.react";
import { copy } from "@/content/copy";

export default function QrBlock({ url, size = 256 }: { url: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded border border-line bg-white p-3">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="text-sm font-semibold">{copy.survey.scan}</p>
      <p className="max-w-[220px] break-all text-center text-xs text-muted">{url}</p>
    </div>
  );
}
