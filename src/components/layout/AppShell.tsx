"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { AutopilotProvider } from "@/context/AutopilotProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AutopilotProvider>
      <div className="ap-app-bg min-h-screen">
        <Sidebar />
        <main className="lg:pl-[var(--ap-sidebar)] pt-14 lg:pt-0 min-h-screen">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </AutopilotProvider>
  );
}
