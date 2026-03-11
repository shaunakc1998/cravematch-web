"use client";

import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

type TabType = "discover" | "matches" | "group";

const tabs: {
  id: TabType;
  label: string;
  emoji: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    id: "discover",
    label: "Discover",
    emoji: "🔍",
    icon: (active) =>
      active ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 2a9 9 0 105.618 16.032l4.675 4.675a1 1 0 001.414-1.414l-4.675-4.675A9 9 0 0011 2zm0 2a7 7 0 110 14A7 7 0 0111 4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
      ),
  },
  {
    id: "matches",
    label: "Saved",
    emoji: "❤️",
    icon: (active) =>
      active ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
  },
  {
    id: "group",
    label: "Group",
    emoji: "👥",
    icon: (active) =>
      active ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
  },
];

export default function BottomNavBar() {
  const { activeTab, setActiveTab, matches } = useApp();

  return (
    <nav
      className="flex-shrink-0"
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2DFD8",
        boxShadow: "0 -4px 20px rgba(28,25,23,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive     = activeTab === tab.id;
          const isMatches    = tab.id === "matches";
          const hasNotif     = isMatches && matches.length > 0;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative touch-manipulation"
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 600, damping: 32 }}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-3 inset-y-1.5 rounded-2xl"
                  style={{ background: "#DCFCE7" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <motion.span
                  animate={{ color: isActive ? "#15803D" : "#A8A29E" }}
                  transition={{ duration: 0.15 }}
                >
                  {tab.icon(isActive)}
                </motion.span>

                {/* Notification badge */}
                {hasNotif && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                    style={{
                      background: "#EA580C",
                      border: "2px solid #FFFFFF",
                    }}
                  >
                    <span className="text-white text-[9px] font-black leading-none">
                      {matches.length > 9 ? "9+" : matches.length}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <motion.span
                animate={{
                  color: isActive ? "#15803D" : "#A8A29E",
                  fontWeight: isActive ? 700 : 500,
                }}
                transition={{ duration: 0.15 }}
                className="relative z-10 text-[10px] leading-none"
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
