"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Utensils, Users, Sparkles } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center glow-primary">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-[#ff4d6d] animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <div className="h-full w-full flex items-center justify-center">
      {/* Animated Background */}
      <div className="animated-bg" />

      {/* Desktop Sidebar - Left */}
      <div className="desktop-sidebar hidden xl:flex flex-col items-start mr-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center glow-primary">
              <Utensils className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-white">Crave</span>
                <span className="gradient-text">Match</span>
              </h1>
              <p className="text-[#6b7280] text-sm">Find your next meal together</p>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#ff4d6d]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Swipe to Discover</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">
                  Browse through delicious restaurants. Swipe right on what you crave!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Group Sessions</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">
                  Create a room, invite friends, and find a restaurant everyone loves.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 rounded-2xl bg-[#1a1a1a]/50 border border-[#2a2a2a]">
            <p className="text-[#6b7280] text-xs">
              💡 <span className="text-white">Pro tip:</span> Share your room code with friends to start a group session!
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main App Container */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="app-container flex flex-col bg-[#0a0a0a] relative"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 safe-area-top border-b border-[#1a1a1a] lg:border-none">
          <h1 className="text-xl font-bold tracking-tight lg:hidden">
            <span className="text-white">Crave</span>
            <span className="text-[#ff4d6d]">Match</span>
          </h1>
          <div className="hidden lg:block">
            <span className="text-sm text-[#6b7280]">Welcome back!</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6b7280]">
              <span className="hidden sm:inline">Hi, </span>
              <span className="text-white font-medium">{userName}</span>
            </span>
            <button
              onClick={signOut}
              className="p-2 text-[#6b7280] hover:text-white hover:bg-[#1a1a1a] rounded-xl transition-all"
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
      </motion.main>

      {/* Desktop Sidebar - Right (Stats/Info) */}
      <div className="desktop-sidebar hidden xl:flex flex-col items-start ml-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
          
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280] text-sm">Restaurants Swiped</span>
                <span className="text-2xl font-bold text-white">0</span>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280] text-sm">Matches Found</span>
                <span className="text-2xl font-bold text-[#ff4d6d]">0</span>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280] text-sm">Group Sessions</span>
                <span className="text-2xl font-bold text-[#10b981]">0</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#ff4d6d]/10 to-[#ff6b8a]/5 border border-[#ff4d6d]/20">
            <h4 className="text-white font-semibold mb-2">🎉 New Feature</h4>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Group sessions are now live! Create a room and swipe together with friends.
            </p>
          </div>
        </motion.div>
      </div>
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
