"use client";
// QR code for the live survey. Props: url (string), size (px, default 256). URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import { QRCodeSVG } from "qrcode.react";
import { copy } from "@/content/copy";

export default function QrBlock({ url, size = 256 }: { url: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-line bg-white p-4">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="font-serif text-xl">{copy.judges.scan}</p>
      <p className="text-xs text-muted">{url}</p>
    </div>
  );
}
