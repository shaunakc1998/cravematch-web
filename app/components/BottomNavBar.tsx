"use client";

import { Search, Users, Heart } from "lucide-react";
import { useApp, TabType } from "../context/AppContext";
import { motion } from "framer-motion";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  tab: TabType;
}

export default function BottomNavBar() {
  const { activeTab, setActiveTab, matches } = useApp();

  const navItems: NavItem[] = [
    {
      icon: <Search className="w-6 h-6" />,
      label: "Discover",
      tab: "discover",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      label: "Matches",
      tab: "matches",
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Group",
      tab: "group",
    },
  ];

  return (
    <nav className="w-full bg-[#0a0a0a] border-t border-[#1a1a1a] safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          const hasNotification = item.tab === "matches" && matches.length > 0;

          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? "text-[#ff4d6d]"
                  : "text-[#6b7280] active:text-white"
              }`}
            >
              <div className="relative">
                {item.icon}
                {hasNotification && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff4d6d] rounded-full flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white">
                      {matches.length > 9 ? "9+" : matches.length}
                    </span>
                  </motion.div>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1 h-1 bg-[#ff4d6d] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
