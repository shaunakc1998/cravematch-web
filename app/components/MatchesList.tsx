"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Heart, Search } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function MatchesList() {
  const { matches, setActiveTab } = useApp();

  const handleCardClick = (restaurantName: string) => {
    // Open Google Maps with the restaurant name
    const encodedName = encodeURIComponent(restaurantName);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedName}`,
      "_blank"
    );
  };

  const handleGoToDiscover = () => {
    setActiveTab("discover");
  };

  // Empty State
  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6"
        >
          <Heart className="w-12 h-12 text-[#ff4d6d] opacity-50" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          No matches yet
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#6b7280] mb-8 max-w-xs"
        >
          Start swiping to find restaurants you love!
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleGoToDiscover}
          className="px-6 py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-bold rounded-full active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-[#ff4d6d]/30"
        >
          <Search className="w-5 h-5" />
          Go to Discover
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Your Matches</h2>
        <span className="px-3 py-1 bg-[#ff4d6d]/20 text-[#ff4d6d] text-sm font-semibold rounded-full">
          {matches.length}
        </span>
      </div>

      {/* Match Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCardClick(match.name)}
              className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] active:bg-[#252525] transition-colors cursor-pointer"
            >
              {/* Thumbnail */}
              <div
                className="w-20 h-20 rounded-xl bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${match.image})` }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">
                  {match.name}
                </h3>
                <p className="text-[#6b7280] text-sm mt-0.5">
                  {match.cuisine} • {match.price}
                </p>

                {/* Group Match Badge */}
                {match.isGroupMatch && match.matchedWith && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff4d6d]/20 text-[#ff4d6d] text-xs font-medium rounded-full">
                      ❤️ Matched with {match.matchedWith}
                    </span>
                  </div>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight className="w-5 h-5 text-[#6b7280] flex-shrink-0" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
