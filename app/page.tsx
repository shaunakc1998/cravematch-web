"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import GroupLobby from "./components/GroupLobby";
import { AppProvider } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";

function AppContent() {
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
    <div className="h-full w-full bg-[#0a0a0a]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff4d6d]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#ff6b8a]/5 rounded-full blur-[150px]" />
      </div>

      {/* Main App */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-full flex flex-col max-w-lg mx-auto"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center">
              <span className="text-sm">🍽️</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-white">Crave</span>
              <span className="text-[#ff4d6d]">Match</span>
            </h1>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#252525] hover:border-[#333] transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{userInitial}</span>
            </div>
            <span className="text-[#888] text-sm font-medium hidden sm:block">
              {userName}
            </span>
          </button>
        </header>

        {/* Main Content - Group Lobby Only */}
        <div className="flex-1 overflow-hidden">
          <GroupLobby />
        </div>
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
