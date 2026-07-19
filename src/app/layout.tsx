import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Copilot from "@/components/Copilot";

export const metadata: Metadata = {
  title: "PropPulse — AI Lead-to-Deal CRM",
  description: "AI-powered real-estate CRM for Indian developers & brokers.",
};

// Set the theme before first paint so there's no light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('pp-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-canvas">{children}</main>
        <Copilot />
      </body>
    </html>
  );
}
