"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MainSidebar from "../components/layout/MainSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define routes that should NOT have the global sidebar
  const isPublicRoute = pathname?.startsWith("/view");
  const isBuilderRoute = pathname?.startsWith("/builder");
  
  // Dashboard, API Docs, and other settings should show sidebar
  const showSidebar = !isPublicRoute && !isBuilderRoute && pathname !== "/";

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFF]">
      <MainSidebar />
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
        <div className="relative z-10">
            {children}
        </div>
      </main>
    </div>
  );
}
