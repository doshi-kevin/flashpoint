// Root layout: global nav + page container. Janvi: restyle here and in globals.css.
import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.appName, description: copy.tagline };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
