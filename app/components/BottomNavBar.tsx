"use client";

import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

type TabType = "discover" | "matches" | "group";

interface NavItem {
  id: TabType;
  label: string;
  emoji: string;
}

const navItems: NavItem[] = [
  { id: "discover", label: "Discover", emoji: "🔍" },
  { id: "matches", label: "Matches", emoji: "❤️" },
  { id: "group", label: "Group", emoji: "👥" },
];

export default function BottomNavBar() {
  const { activeTab, setActiveTab, matches } = useApp();

  return (
    <nav className="safe-area-bottom bg-[#0a0a0a] border-t border-[#1a1a1a]">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const hasNotification = item.id === "matches" && matches.length > 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center py-2 px-6 rounded-xl transition-all"
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#ff4d6d]/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}

              {/* Icon */}
              <div className="relative">
                <motion.span
                  className="text-2xl block"
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  {item.emoji}
                </motion.span>

                {/* Notification Badge */}
                {hasNotification && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4d6d] rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-[10px] font-bold">
                      {matches.length > 9 ? "9+" : matches.length}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium mt-1 transition-colors ${
                  isActive ? "text-[#ff4d6d]" : "text-[#6b6b6b]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
