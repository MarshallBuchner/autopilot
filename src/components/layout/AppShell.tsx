"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { IntroGate } from "@/components/landing/IntroGate";
import { AutopilotProvider } from "@/context/AutopilotProvider";

function ShellChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  return (
    <div className="ap-app-bg min-h-screen">
      <Sidebar />
      <main className="min-h-screen pt-14 lg:pl-[var(--ap-sidebar)] lg:pt-0">
        <div
          className={`mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 ${
            isDashboard ? "lg:py-7" : "lg:py-8"
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AutopilotProvider>
      {pathname === "/" ? (
        <IntroGate>
          <ShellChrome>{children}</ShellChrome>
        </IntroGate>
      ) : (
        <ShellChrome>{children}</ShellChrome>
      )}
    </AutopilotProvider>
  );
}
