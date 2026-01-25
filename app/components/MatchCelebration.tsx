"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Users } from "lucide-react";
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
  partnerName = "Manasi",
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
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-8 text-center"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Icon animation */}
            <motion.div
              className="mb-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              {isGroupMatch ? (
                <Users className="w-12 h-12 text-[#ff4d6d]" />
              ) : (
                <Sparkles className="w-12 h-12 text-[#ff4d6d]" />
              )}
            </motion.div>

            {/* Match text */}
            <motion.h1
              className="text-5xl font-black text-white mb-2 tracking-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              IT&apos;S A
            </motion.h1>
            <motion.h1
              className="text-6xl font-black text-[#ff4d6d] mb-4 tracking-tight"
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
            >
              MATCH!
            </motion.h1>

            {/* Group match subtitle */}
            {isGroupMatch && (
              <motion.p
                className="text-white/80 text-lg mb-6 font-medium"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                You and {partnerName} both like
              </motion.p>
            )}

            {/* Restaurant image */}
            <motion.div
              className="relative w-48 h-48 rounded-3xl overflow-hidden mb-4 shadow-2xl"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${restaurant.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </motion.div>

            {/* Restaurant name */}
            <motion.h2
              className="text-2xl font-bold text-white mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {restaurant.name}
            </motion.h2>
            <motion.p
              className="text-white/60 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {restaurant.cuisine} • {restaurant.price} • {restaurant.distance}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3 w-full max-w-xs"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={onLetsEat}
                className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-bold text-lg rounded-full active:scale-95 transition-transform shadow-lg shadow-[#ff4d6d]/30"
              >
                {isGroupMatch ? "🎉 Let's Go!" : "Let's Eat! 🍽️"}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-white/10 text-white font-semibold rounded-full active:scale-95 transition-transform border border-white/20"
              >
                Keep Swiping
              </button>
            </motion.div>
          </motion.div>

          {/* Confetti-like particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? "#ff4d6d" : "#10b981",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                y: [0, -100 - Math.random() * 100],
                x: [(Math.random() - 0.5) * 100],
              }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
