"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

export default function MatchesList() {
  const { matches, setActiveTab } = useApp();

  if (matches.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-black">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xs"
        >
          {/* Broken heart SVG */}
          <motion.div
            className="flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="w-20 h-20 rounded-3xl bg-[#111] border border-[#48484a] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#636366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
          </motion.div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">No matches yet</h2>
          <p className="text-[#636366] text-sm mb-8 leading-relaxed">
            Swipe right on restaurants you like and they&apos;ll appear here.
          </p>
          <motion.button
            onClick={() => setActiveTab("discover")}
            className="px-8 py-3.5 bg-[#FF2D55] text-white text-sm font-bold rounded-2xl active:scale-95 transition-transform"
            style={{ boxShadow: "0 8px 24px rgba(255,45,85,0.35)" }}
            whileTap={{ scale: 0.95 }}
          >
            Start Swiping
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Your Matches</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#636366] mt-0.5">
            Restaurants you loved
          </p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-[#FF2D55]/15 border border-[#FF2D55]/30 flex items-center justify-center">
          <span className="text-[#FF2D55] text-sm font-black">{matches.length}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
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
                className="w-full flex items-center gap-4 p-3 bg-[#111] rounded-2xl border border-[#48484a] active:scale-[0.98] transition-transform touch-manipulation text-left"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-[72px] h-[72px] rounded-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${match.image})` }}
                  />
                  {/* Rating badge */}
                  <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-[#111] border border-[#48484a] rounded-lg">
                    <span className="text-yellow-400 text-[10px]">★</span>
                    <span className="text-white text-[10px] font-black">{match.rating}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black text-base truncate tracking-tight">{match.name}</h3>
                  <p className="text-[#636366] text-xs mt-0.5 font-medium">{match.cuisine} · {match.price} · {match.distance}</p>
                  {match.isGroupMatch && match.matchedWith && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#30D158]/10 border border-[#30D158]/30 text-[#30D158] text-[10px] font-bold uppercase tracking-wide">
                      Group Match
                    </span>
                  )}
                  {!match.isGroupMatch && match.tags?.[0] && (
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full bg-[#1a1a1a] border border-[#48484a] text-[#636366] text-[10px] font-semibold">
                      {match.tags[0]}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#636366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
