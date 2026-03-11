"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Restaurant } from "../data/restaurants";

interface MatchCelebrationProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onLetsEat: () => void;
  isGroupMatch?: boolean;
  partnerName?: string;
}

const CONFETTI_COLORS = [
  "#16A34A", "#22C55E", "#86EFAC",  // greens
  "#EA580C", "#F97316", "#FED7AA",  // oranges
  "#FCD34D", "#F59E0B",             // yellows
  "#0EA5E9", "#BAE6FD",             // blues
];

export default function MatchCelebration({
  restaurant,
  isOpen,
  onClose,
  onLetsEat,
  isGroupMatch = false,
  partnerName = "Friend",
}: MatchCelebrationProps) {
  if (!restaurant) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(28,25,23,0.6)", backdropFilter: "blur(12px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Confetti */}
          {[...Array(36)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-sm pointer-events-none"
              style={{
                width:  Math.random() * 9 + 4,
                height: Math.random() * 9 + 4,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                left: `${Math.random() * 100}%`,
                top: "-2%",
              }}
              animate={{
                y:       ["0vh", "105vh"],
                x:       [0, (Math.random() - 0.5) * 260],
                rotate:  [0, Math.random() * 900],
                opacity: [1, 1, 0.2],
              }}
              transition={{
                duration:    3.5 + Math.random() * 2.5,
                delay:       Math.random() * 0.8,
                repeat:      Infinity,
                ease:        "easeIn",
              }}
            />
          ))}

          {/* Sheet */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0"
            initial={{ y: 80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2DFD8",
                boxShadow: "0 24px 64px rgba(28,25,23,0.20), 0 8px 24px rgba(28,25,23,0.10)",
              }}
            >
              {/* Top strip */}
              <div
                className="relative px-6 pt-6 pb-5 text-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #DCFCE7 0%, #ECFDF5 50%, #FFF7ED 100%)",
                  borderBottom: "1px solid #E2DFD8",
                }}
              >
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "rgba(28,25,23,0.08)" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{ color: "#78716C" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Icon */}
                <motion.div
                  className="text-5xl mb-3 block"
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.8 }}
                >
                  {isGroupMatch ? "🎊" : "✨"}
                </motion.div>

                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#78716C" }}>
                  {isGroupMatch ? `You & ${partnerName} both love` : "You matched with"}
                </p>
                <h2
                  className="text-2xl font-black"
                  style={{ color: "#1C1917", letterSpacing: "-0.02em" }}
                >
                  {isGroupMatch ? "a place!" : "a craving!"}
                </h2>
              </div>

              {/* Restaurant card */}
              <div className="p-4">
                <div
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl"
                  style={{
                    background: "#F7F6F2",
                    border: "1px solid #E2DFD8",
                  }}
                >
                  {/* Photo */}
                  <div
                    className="w-16 h-16 rounded-xl flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${restaurant.image})` }}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-black text-base truncate"
                      style={{ color: "#1C1917", letterSpacing: "-0.01em" }}
                    >
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: "#78716C" }}>
                      <span>★ {restaurant.rating}</span>
                      <span style={{ color: "#C8C4BC" }}>·</span>
                      <span>{restaurant.cuisine}</span>
                      <span style={{ color: "#C8C4BC" }}>·</span>
                      <span>{restaurant.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: "#A8A29E" }}>
                      <span>📍 {restaurant.distance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-5 flex flex-col gap-2.5">
                <motion.button
                  onClick={onLetsEat}
                  className="btn btn-primary btn-lg btn-full"
                  whileTap={{ scale: 0.97 }}
                >
                  {isGroupMatch ? "🎉 Let's Go!" : "🍽️ Let's Eat!"}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="btn btn-ghost btn-full"
                  style={{ color: "#A8A29E" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Keep Swiping
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
