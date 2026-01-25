"use client";

import { AnimatePresence, motion } from "framer-motion";
import SwipeDeck from "./components/SwipeDeck";
import BottomNavBar from "./components/BottomNavBar";
import MatchesList from "./components/MatchesList";
import GroupLobby from "./components/GroupLobby";
import { AppProvider, useApp } from "./context/AppContext";

function AppContent() {
  const { activeTab } = useApp();

  return (
    <main className="flex flex-col h-full w-full max-w-md mx-auto bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-center py-4 safe-area-top">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-white">Crave</span>
          <span className="text-[#ff4d6d]">Match</span>
        </h1>
      </header>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "discover" && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <SwipeDeck />
          </motion.div>
        )}

        {activeTab === "matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <MatchesList />
          </motion.div>
        )}

        {activeTab === "group" && (
          <motion.div
            key="group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <GroupLobby />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </main>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
