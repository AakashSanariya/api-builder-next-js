"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  Layers,
  Zap,
  Github,
  HelpCircle,
  LogOut
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/forms" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", comingSoon: true },
  { icon: Layers, label: "Integrations", path: "/integrations", comingSoon: true },
  { icon: Settings, label: "System Settings", path: "/settings", comingSoon: true },
];

const MainSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-[280px] bg-white border-r h-full flex flex-col shrink-0 z-50">
      {/* Brand Header */}
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/forms")}>
          <div className="w-10 h-10 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:rotate-12 transition-all duration-500">
            <Zap size={24} fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 font-display tracking-tight leading-none">API</h1>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">Builder</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <motion.button
              key={item.label}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !item.comingSoon && router.push(item.path)}
              disabled={item.comingSoon}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
                ${isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                }
                ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-indigo-600"} />
                <span className="text-sm font-bold font-display">{item.label}</span>
              </div>

              {item.comingSoon && (
                <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 bg-gray-100 text-gray-400 rounded-md">Soon</span>
              )}

              {isActive && (
                <motion.div layoutId="nav-glow" className="absolute left-[-16px] w-1 h-8 bg-indigo-600 rounded-r-full shadow-[4px_0_15px_rgb(79,70,229,0.8)]" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-6 mt-auto">
        <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white overflow-hidden shadow-sm">
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Pro" alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-gray-900 truncate">Admin Entity</h4>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
              <Github size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
              <HelpCircle size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.2em] text-center mt-6">
          v1.0.4 Production Build
        </p>
      </div>
    </aside>
  );
};

export default MainSidebar;
