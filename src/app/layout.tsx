import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Copilot from "@/components/Copilot";

export const metadata: Metadata = {
  title: "PropPulse — AI Lead-to-Deal CRM",
  description: "AI-powered real-estate CRM for Indian developers & brokers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-60 min-h-screen">{children}</main>
        <Copilot />
      </body>
    </html>
  );
}
