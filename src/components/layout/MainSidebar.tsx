"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  Layers,
  Zap,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/forms" },
  { icon: GitBranch, label: "Relationships", path: "/relationships" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Layers, label: "Integrations", path: "/integrations", comingSoon: true },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MainSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`bg-card border-r h-full flex flex-col shrink-0 z-50 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[280px]'}`}>
      {/* Brand Header */}
      <div className={`${collapsed ? 'p-3 pb-6' : 'p-8 pb-12'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} group cursor-pointer`} onClick={() => router.push("/forms")}>
          <div className="w-10 h-10 bg-primary rounded-[1.25rem] flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 group-hover:rotate-12 transition-all duration-500 shrink-0">
            <Zap size={24} fill="currentColor" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-xl font-black text-foreground font-display tracking-tight leading-none">API</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Builder</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-2`}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <motion.button
              key={item.label}
              whileHover={{ x: collapsed ? 0 : 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !item.comingSoon && router.push(item.path)}
              disabled={item.comingSoon}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 rounded-2xl transition-all duration-300 group relative
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
                ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-4'}`}>
                <item.icon size={20} className={isActive ? "text-primary-foreground" : "group-hover:text-primary"} />
                {!collapsed && <span className="text-sm font-bold font-display">{item.label}</span>}
              </div>

              {!collapsed && item.comingSoon && (
                <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 bg-muted text-muted-foreground rounded-md">Soon</span>
              )}

              {isActive && !collapsed && (
                <motion.div layoutId="nav-glow" className="absolute left-[-16px] w-1 h-8 bg-primary rounded-r-full shadow-[4px_0_15px_hsl(var(--primary)/0.8)]" />
              )}

              {collapsed && isActive && (
                <motion.div layoutId="nav-glow-mobile" className="absolute left-[-8px] w-1 h-6 bg-primary rounded-r-full shadow-[4px_0_15px_hsl(var(--primary)/0.8)]" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className={`px-4 py-2 border-t border-border hidden md:block`}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Collapse Toggle - Desktop */}
      <div className={`px-4 py-2 border-t border-border hidden md:block`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Footer Info */}
      <div className={`${collapsed ? 'p-3' : 'p-6'} mt-auto`}>
        {!collapsed ? (
          <div className="bg-muted rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-card overflow-hidden shadow-sm shrink-0 flex items-center justify-center text-primary font-black text-lg">
                {user ? user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-foreground truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </h4>
                <p className="text-[8px] text-muted-foreground font-bold truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <button
                onClick={() => logout()}
                className="w-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all flex items-center justify-center gap-2"
                title="Sign Out"
              >
                <LogOut size={18} />
                <span className="text-[9px] font-black uppercase tracking-wider">Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-card overflow-hidden shadow-sm flex items-center justify-center text-primary font-black text-lg">
              {user ? user.firstName.charAt(0).toUpperCase() : "A"}
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {!collapsed && (
          <p className="text-[8px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em] text-center mt-6">
            v1.0.4 Production Build
          </p>
        )}
      </div>
    </aside>
  );
};

export default MainSidebar;
