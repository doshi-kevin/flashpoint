// Root layout: top header + content + footer. Fonts: Hanken Grotesk (UI), DM Mono (data, labels), Newsreader (quoted words).
import type { Metadata } from "next";
import { Hanken_Grotesk, DM_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import { copy } from "@/content/copy";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono" });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader" });

export const metadata: Metadata = { title: copy.appName, description: copy.tagline };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${dmMono.variable} ${newsreader.variable}`}>
      <body className="antialiased">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-8 sm:px-8">{children}</main>
        <footer className="border-t border-line/60 bg-soft/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-2 px-4 py-5 font-mono text-xs text-muted sm:flex-row sm:px-8">
            <span className="uppercase tracking-wider">{copy.footer.left}</span>
            <span>{copy.footer.right}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
