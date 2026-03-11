"use client";

import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

type TabType = "discover" | "matches" | "group";

const tabs: { id: TabType; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "discover",
    label: "Discover",
    icon: (active) => active ? (
      <svg className="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    id: "matches",
    label: "Matches",
    icon: (active) => active ? (
      <svg className="w-[24px] h-[24px]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ) : (
      <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: "group",
    label: "Group",
    icon: (active) => active ? (
      <svg className="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
        <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
      </svg>
    ) : (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

export default function BottomNavBar() {
  const { activeTab, setActiveTab, matches } = useApp();

  return (
    <nav
      className="flex-shrink-0 bg-black border-t border-[#222]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isMatches = tab.id === "matches";
          const hasNotif = isMatches && matches.length > 0;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center touch-manipulation ${
                isMatches ? "py-2 px-6" : "py-2 px-5"
              }`}
              style={{ minHeight: "60px" }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="relative">
                <motion.div
                  className={isActive ? "text-[#FF2D55]" : "text-[#636366]"}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {tab.icon(isActive)}
                </motion.div>

                {hasNotif && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-[#FF2D55] flex items-center justify-center border-2 border-black px-0.5"
                  >
                    <span className="text-white text-[8px] font-black leading-none">
                      {matches.length > 9 ? "9+" : matches.length}
                    </span>
                  </motion.div>
                )}
              </div>

              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-[#FF2D55] mt-0.5 tracking-tight"
                >
                  {tab.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
