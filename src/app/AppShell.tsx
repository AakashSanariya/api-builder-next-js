"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import MainSidebar from "../components/layout/MainSidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Define routes that should NOT have the global sidebar
  const isPublicRoute = pathname?.startsWith("/view");
  const isBuilderRoute = pathname?.startsWith("/builder");
  
  // Dashboard, API Docs, View, and other settings should show sidebar
  const showSidebar = !isBuilderRoute && pathname !== "/";

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFF]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px]"
            >
              <MainSidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <MainSidebar />
      </div>

      <main className="flex-1 overflow-y-auto relative custom-scrollbar min-w-0">
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <PanelLeftOpen size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <PanelLeftClose size={14} fill="white" />
            </div>
            <span className="text-sm font-black text-gray-900">API Builder</span>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
        <div className="relative z-10">
            {children}
        </div>
      </main>
    </div>
  );
}
