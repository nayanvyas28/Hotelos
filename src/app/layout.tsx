import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { SyncProvider } from "@/context/SyncContext";
import LoginGuard from "@/components/layout/LoginGuard";
import CommandCenter from "@/components/layout/CommandCenter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HotelOS — Commercial Property Management System",
  description: "Premium commercial hotel PMS SaaS console with AI smart assistant, OTA distributions, cashflows ledger, and live guest digital portals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider>
          <SyncProvider>
            <LoginGuard>
              {children}
              <CommandCenter />
            </LoginGuard>
          </SyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
