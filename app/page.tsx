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
      <div className="h-full flex items-center justify-center bg-[#040404]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-2xl"
            animate={{ boxShadow: ["0 0 20px rgba(244,63,94,0.3)", "0 0 50px rgba(244,63,94,0.6)", "0 0 20px rgba(244,63,94,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-3xl">🍽️</span>
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"
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
    <div className="h-full flex flex-col bg-[#040404]" style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)", paddingBottom: "14px" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-lg shadow-rose-500/20">
              <span className="text-base">🍽️</span>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Crave</span>
            <span className="text-[#f43f5e]">Match</span>
          </span>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] active:scale-95 transition-transform touch-manipulation"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-md shadow-rose-500/20">
            <span className="text-white text-xs font-bold">{userInitial}</span>
          </div>
          <span className="text-[#4b5563] text-xs font-medium">Out</span>
        </button>
      </header>

      {/* Divider */}
      <div className="flex-shrink-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-5" />

      {/* Tab content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
