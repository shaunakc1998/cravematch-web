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
      <div
        className="h-full flex flex-col items-center justify-center gap-8"
        style={{ background: "#F7F6F2" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Logo mark */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#16A34A", boxShadow: "0 8px 24px rgba(22,163,74,0.35)" }}
          >
            <span style={{ fontSize: "1.75rem" }}>🌿</span>
          </div>

          {/* App name */}
          <div className="text-center">
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: "#1C1917", letterSpacing: "-0.03em" }}
            >
              CraveMatch
            </h1>
            <p className="text-sm mt-1" style={{ color: "#A8A29E" }}>
              Loading your session…
            </p>
          </div>

          {/* Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "#16A34A" }}
                animate={{ scale: [0.7, 1, 0.7], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "You";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="h-full flex flex-col" style={{ background: "#F7F6F2" }}>
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 border-b"
        style={{
          background: "#FFFFFF",
          borderColor: "#E2DFD8",
          paddingTop: "calc(env(safe-area-inset-top) + 10px)",
          paddingBottom: "10px",
          boxShadow: "0 1px 0 0 #E2DFD8",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: "#16A34A" }}
          >
            🌿
          </div>
          <span
            className="text-lg font-black tracking-tight"
            style={{ color: "#1C1917", letterSpacing: "-0.03em" }}
          >
            Crave<span style={{ color: "#16A34A" }}>Match</span>
          </span>
        </div>

        {/* User avatar + sign out */}
        <button
          onClick={signOut}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all active:scale-95"
          style={{
            background: "#DCFCE7",
            color: "#15803D",
            border: "1.5px solid #86EFAC",
          }}
          title={`Signed in as ${userName} — tap to sign out`}
        >
          {userInitial}
        </button>
      </header>

      {/* ── Tab content ───────────────────────────────── */}
      <main
        className="flex-1 min-h-0 overflow-hidden"
        style={{ paddingBottom: "calc(68px + env(safe-area-inset-bottom))" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="h-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {activeTab === "discover" && <SwipeDeck />}
            {activeTab === "matches"  && <MatchesList />}
            {activeTab === "group"    && <GroupLobby />}
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
