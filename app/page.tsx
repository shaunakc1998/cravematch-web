"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
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
  const { activeTab, groupSession } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.1)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center gap-6"
        >
          {/* Logo with glow */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-2xl"
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(244, 63, 94, 0.3)",
                  "0 0 60px rgba(244, 63, 94, 0.5)",
                  "0 0 30px rgba(244, 63, 94, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-4xl">🍽️</span>
            </motion.div>
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-20 blur-2xl" />
          </div>
          
          {/* Loading spinner */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-[#f43f5e]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[#f43f5e]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-[#f43f5e]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
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
    <div className="h-screen w-full bg-[#050505] overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 60%)",
            top: "-30%",
            left: "-20%",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251, 113, 133, 0.06) 0%, transparent 60%)",
            bottom: "-20%",
            right: "-20%",
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Main App Container */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex-1 flex flex-col max-w-lg mx-auto w-full"
        style={{ minHeight: 0 }}
      >
        {/* Premium Header */}
        <header className="relative z-10 flex items-center justify-between px-5 py-4 safe-area-top">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-lg shadow-[#f43f5e]/20">
                <span className="text-lg">🍽️</span>
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-30 blur-md -z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-white">Crave</span>
                <span className="text-[#f43f5e]">Match</span>
              </h1>
            </div>
          </motion.div>

          {/* User Menu */}
          <motion.button
            onClick={signOut}
            className="group flex items-center gap-3 px-3 py-2 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-md shadow-[#f43f5e]/20">
                <span className="text-white text-sm font-bold">{userInitial}</span>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#050505]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-sm font-medium leading-tight">{userName}</p>
              <p className="text-[#52525b] text-xs leading-tight">Tap to sign out</p>
            </div>
            <svg 
              className="w-4 h-4 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors hidden sm:block" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </motion.button>
        </header>

        {/* Subtle divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent mx-5" />

        {/* Main Content */}
        <motion.div 
          className="flex-1 overflow-hidden min-h-0 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Show GroupLobby if in a group session, otherwise show tab content */}
          {groupSession?.isActive ? (
            <GroupLobby />
          ) : (
            <>
              {activeTab === "discover" && <SwipeDeck />}
              {activeTab === "matches" && <MatchesList />}
              {activeTab === "group" && <GroupLobby />}
            </>
          )}
        </motion.div>

        {/* Bottom Navigation */}
        {!groupSession?.isActive && <BottomNavBar />}
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
