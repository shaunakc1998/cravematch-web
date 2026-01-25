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
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(244, 63, 94, 0.2) 0%, transparent 60%)",
                top: "20%",
                left: "50%",
                x: "-50%",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Confetti particles */}
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-sm"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: 
                  i % 4 === 0 ? "#f43f5e" : 
                  i % 4 === 1 ? "#10b981" : 
                  i % 4 === 2 ? "#fbbf24" : 
                  "#3b82f6",
                left: `${Math.random() * 100}%`,
                top: "-5%",
              }}
              animate={{
                y: ["0vh", "110vh"],
                x: [0, (Math.random() - 0.5) * 300],
                rotate: [0, Math.random() * 1080],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                delay: Math.random() * 1,
                repeat: Infinity,
                ease: "easeIn",
              }}
            />
          ))}

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-6 text-center max-w-md mx-auto"
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#111] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#a1a1aa] hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Celebration icon */}
            <motion.div
              className="mb-6"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 1.5,
              }}
            >
              <div className="relative">
                <span className="text-7xl block">
                  {isGroupMatch ? "🎊" : "✨"}
                </span>
                <motion.div
                  className="absolute -inset-4 rounded-full bg-[#f43f5e]/20 blur-xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Match text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-1 tracking-tight">
                IT&apos;S A
              </h1>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
            >
              <h1 className="text-6xl sm:text-7xl font-extrabold text-gradient mb-4 tracking-tight">
                MATCH!
              </h1>
            </motion.div>

            {/* Group match subtitle */}
            {isGroupMatch && (
              <motion.p
                className="text-[#a1a1aa] text-lg mb-6 font-medium"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                You and <span className="text-white font-semibold">{partnerName}</span> both love
              </motion.p>
            )}

            {/* Restaurant card */}
            <motion.div
              className="relative w-full max-w-xs mb-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Card glow */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#f43f5e]/30 to-transparent blur-xl" />
              
              <div className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-2xl">
                {/* Shine effect on border */}
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[rgba(255,255,255,0.15)] to-transparent pointer-events-none" />
                
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
                </div>
                
                {/* Content */}
                <div className="p-5 -mt-6 relative">
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {restaurant.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[#a1a1aa] text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold text-white">{restaurant.rating}</span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#52525b]" />
                    <span>{restaurant.cuisine}</span>
                    <span className="w-1 h-1 rounded-full bg-[#52525b]" />
                    <span>{restaurant.price}</span>
                    <span className="w-1 h-1 rounded-full bg-[#52525b]" />
                    <span>{restaurant.distance}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3 w-full max-w-xs"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={onLetsEat}
                className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-bold text-lg rounded-2xl overflow-hidden group shadow-xl shadow-[#f43f5e]/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <span>{isGroupMatch ? "🎉" : "🍽️"}</span>
                  <span>{isGroupMatch ? "Let's Go!" : "Let's Eat!"}</span>
                </span>
              </motion.button>
              
              <motion.button
                onClick={onClose}
                className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.08)] text-[#a1a1aa] font-semibold rounded-2xl hover:bg-[rgba(255,255,255,0.05)] hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Keep Swiping
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
