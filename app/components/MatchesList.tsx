"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

export default function MatchesList() {
  const { matches, setActiveTab } = useApp();

  if (matches.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xs"
        >
          <motion.div
            className="text-5xl mb-5 inline-block"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💔
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">No matches yet</h2>
          <p className="text-[#6b7280] text-sm mb-7 leading-relaxed">
            Swipe right on restaurants you like and they&apos;ll show up here.
          </p>
          <motion.button
            onClick={() => setActiveTab("discover")}
            className="px-7 py-3 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white text-sm font-semibold rounded-2xl shadow-lg shadow-rose-500/25 active:scale-95 transition-transform"
            whileTap={{ scale: 0.95 }}
          >
            Start Swiping
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Matches</h2>
          <p className="text-[#4b5563] text-xs mt-0.5">Restaurants you loved</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] text-xs font-bold">
          {matches.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-4">
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {matches.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.name)}`, "_blank")}
                className="w-full flex items-center gap-3.5 p-3.5 bg-[#0d0d0d] rounded-2xl border border-white/[0.07] active:scale-[0.98] transition-transform touch-manipulation text-left"
              >
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-[68px] h-[68px] rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${match.image})` }}
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#0d0d0d] border border-white/10 rounded-lg flex items-center gap-0.5">
                    <span className="text-amber-400 text-[10px]">★</span>
                    <span className="text-white text-[10px] font-bold">{match.rating}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{match.name}</h3>
                  <p className="text-[#4b5563] text-xs mt-0.5">{match.cuisine} · {match.price} · {match.distance}</p>
                  {match.isGroupMatch && match.matchedWith && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] text-[10px] font-medium">
                      ❤️ {match.matchedWith}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#4b5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
