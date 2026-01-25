"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

export default function MatchesList() {
  const { matches, setActiveTab } = useApp();

  const handleCardClick = (restaurantName: string) => {
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
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Empty state icon */}
          <motion.div
            className="relative w-28 h-28 mx-auto mb-8"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f43f5e]/15 to-[#fb7185]/5 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#f43f5e]/10 to-transparent border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <span className="text-5xl opacity-60">❤️</span>
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-white mb-3 tracking-tight"
          >
            No matches yet
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#a1a1aa] mb-8 leading-relaxed"
          >
            Start swiping to find restaurants you love! Your matches will appear here.
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleGoToDiscover}
            className="relative px-8 py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl overflow-hidden group shadow-lg shadow-[#f43f5e]/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Go to Discover
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 hide-scrollbar">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Matches</h2>
          <p className="text-[#52525b] text-sm mt-0.5">Restaurants you loved</p>
        </div>
        <motion.span 
          className="px-4 py-2 bg-gradient-to-r from-[#f43f5e]/15 to-[#f43f5e]/5 text-[#fb7185] text-sm font-bold rounded-full border border-[#f43f5e]/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        >
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </motion.span>
      </motion.div>

      {/* Match Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => handleCardClick(match.name)}
              className="group relative flex items-center gap-4 p-4 bg-[#111] rounded-2xl border border-[rgba(255,255,255,0.06)] cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f43f5e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-xl bg-cover bg-center shadow-lg"
                  style={{ backgroundImage: `url(${match.image})` }}
                />
                {/* Rating badge */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center gap-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-white text-xs font-semibold">{match.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 relative">
                <h3 className="text-white font-semibold text-lg truncate mb-1 group-hover:text-[#fb7185] transition-colors">
                  {match.name}
                </h3>
                <p className="text-[#52525b] text-sm">
                  {match.cuisine} • {match.price} • {match.distance}
                </p>

                {/* Group Match Badge */}
                {match.isGroupMatch && match.matchedWith && (
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#f43f5e]/15 to-[#f43f5e]/5 text-[#fb7185] text-xs font-medium rounded-full border border-[#f43f5e]/20">
                      <span>❤️</span>
                      <span>Matched with {match.matchedWith}</span>
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 relative">
                <motion.div
                  className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center group-hover:bg-[#f43f5e]/10 group-hover:border-[#f43f5e]/20 transition-all"
                  whileHover={{ scale: 1.1 }}
                >
                  <svg 
                    className="w-5 h-5 text-[#52525b] group-hover:text-[#f43f5e] transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom padding for safe area */}
      <div className="h-6" />
    </div>
  );
}
