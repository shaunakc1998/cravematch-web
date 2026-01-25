"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import SwipeDeck from "./components/SwipeDeck";
import BottomNavBar from "./components/BottomNavBar";
import MatchesList from "./components/MatchesList";
import GroupLobby from "./components/GroupLobby";
import { AppProvider, useApp } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";

function AppContent() {
  const { activeTab } = useApp();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center shadow-2xl shadow-[#ff4d6d]/25">
            <span className="text-3xl">🍽️</span>
          </div>
          <div className="w-6 h-6 border-2 border-[#ff4d6d]/30 border-t-[#ff4d6d] rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff4d6d]/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#ff6b8a]/3 rounded-full blur-[150px]" />
      </div>

      {/* Main App Container */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="app-container flex flex-col bg-[#0a0a0a] relative overflow-hidden"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 safe-area-top border-b border-[#141414]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center">
              <span className="text-sm">🍽️</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-white">Crave</span>
              <span className="text-[#ff4d6d]">Match</span>
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{userInitial}</span>
              </div>
              <span className="text-[#8b8b8b] text-sm font-medium hidden sm:block">
                {userName}
              </span>
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "discover" && (
              <motion.div
                key="discover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <SwipeDeck />
              </motion.div>
            )}

            {activeTab === "matches" && (
              <motion.div
                key="matches"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <MatchesList />
              </motion.div>
            )}

            {activeTab === "group" && (
              <motion.div
                key="group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <GroupLobby />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar />
      </motion.main>
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
