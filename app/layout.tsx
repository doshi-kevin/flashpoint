// Root layout: fonts (Inter + Newsreader, as on flashpoint.ai), global nav, page container.
import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { copy } from "@/content/copy";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = { title: copy.appName, description: copy.tagline };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
