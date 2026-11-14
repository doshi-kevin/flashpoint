"use client";
// QR code for the live survey. Props: url (string), size (px, default 256). URL comes from NEXT_PUBLIC_JUDGE_SURVEY_URL.
import { QRCodeSVG } from "qrcode.react";
import FlashpointMark from "./FlashpointMark";
import { copy } from "@/content/copy";

export default function QrBlock({ url, size = 256 }: { url: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-md border-2 border-ink bg-white p-3">
        <QRCodeSVG value={url} size={size} fgColor="#1c1b18" bgColor="#ffffff" />
      </div>
      <p className="text-lg font-extrabold">
        <span className="marker">{copy.survey.scan}</span>
      </p>
      <FlashpointMark label="Survey hosted on Flashpoint" />
      <p className="max-w-[240px] break-all text-center font-mono text-xs text-muted">{url}</p>
    </div>
  );
}
