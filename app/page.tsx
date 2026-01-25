"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#ff4d6d] animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <main className="flex flex-col h-full w-full max-w-md mx-auto bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-area-top">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-white">Crave</span>
          <span className="text-[#ff4d6d]">Match</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b7280]">
            Hi, <span className="text-white font-medium">{userName}</span>
          </span>
          <button
            onClick={signOut}
            className="p-2 text-[#6b7280] hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
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
