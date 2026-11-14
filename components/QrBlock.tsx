"use client";
// Big QR code for the judge survey. Props: url (string). URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import { QRCodeSVG } from "qrcode.react";
import { copy } from "@/content/copy";

export default function QrBlock({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded border border-gray-300 bg-white p-4">
        <QRCodeSVG value={url} size={256} />
      </div>
      <p className="text-lg font-semibold">{copy.judges.scan}</p>
      <p className="text-xs text-gray-500">{url}</p>
    </div>
  );
}
