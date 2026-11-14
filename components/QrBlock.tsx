"use client";
// Big QR code for the judge survey. Props: url (string). URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import { QRCodeSVG } from "qrcode.react";
import { copy } from "@/content/copy";

export default function QrBlock({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl bg-cream p-5">
        <QRCodeSVG value={url} size={256} bgColor="#f3f1ec" fgColor="#121110" />
      </div>
      <p className="font-serif text-2xl">{copy.judges.scan}</p>
      <p className="text-xs text-muted">{url}</p>
    </div>
  );
}
