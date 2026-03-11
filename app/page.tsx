"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import GroupLobby from "./components/GroupLobby";
import SwipeDeck from "./components/SwipeDeck";
import MatchesList from "./components/MatchesList";
import BottomNavBar from "./components/BottomNavBar";
import { AppProvider } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const { activeTab } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[#FF2D55] flex items-center justify-center"
            animate={{ boxShadow: ["0 0 20px rgba(255,45,85,0.3)", "0 0 50px rgba(255,45,85,0.6)", "0 0 20px rgba(255,45,85,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-white text-2xl font-black tracking-tight">CM</span>
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <header
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 border-b border-[#1a1a1a]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: "12px" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF2D55] flex items-center justify-center">
            <span className="text-white text-xs font-black tracking-tight">CM</span>
          </div>
          <span className="text-white text-lg font-black tracking-tight">CraveMatch</span>
        </div>

        {/* Avatar / sign out */}
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#48484a] flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
        >
          <span className="text-white text-xs font-bold">{userInitial}</span>
        </button>
      </header>

      {/* Tab content */}
      <main
        className="flex-1 min-h-0 overflow-hidden"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {activeTab === "discover" && <SwipeDeck />}
            {activeTab === "matches" && <MatchesList />}
            {activeTab === "group" && <GroupLobby />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavBar />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
