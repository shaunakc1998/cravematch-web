"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { restaurants, Restaurant } from "../data/restaurants";
import { useApp } from "../context/AppContext";

export default function SwipeDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const { addMatch } = useApp();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const currentRestaurant = restaurants[currentIndex];
  const nextRestaurant = restaurants[currentIndex + 1];

  useEffect(() => {
    x.set(0);
    setExitDirection(null);
  }, [currentIndex, x]);

  const handleSwipe = (direction: "left" | "right") => {
    setExitDirection(direction);
    
    if (direction === "right" && currentRestaurant) {
      addMatch(currentRestaurant);
    }

    animate(x, direction === "left" ? -400 : 400, {
      duration: 0.3,
      onComplete: () => {
        setCurrentIndex((prev) => prev + 1);
      },
    });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  if (currentIndex >= restaurants.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center"
        >
          {/* Celebration Icon */}
          <motion.div
            className="relative w-28 h-28 mx-auto mb-8"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f43f5e]/20 to-[#fb7185]/10 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#f43f5e]/10 to-transparent border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">All caught up!</h2>
          <p className="text-[#a1a1aa] mb-8 max-w-xs mx-auto leading-relaxed">
            You&apos;ve seen all restaurants. Check back later for more delicious options!
          </p>
          
          <motion.button
            onClick={() => setCurrentIndex(0)}
            className="relative px-8 py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl overflow-hidden group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Card Stack */}
      <div className="flex-1 relative px-4 py-2">
        {/* Next Card (Background) */}
        {nextRestaurant && (
          <div className="absolute inset-4 sm:inset-6">
            <RestaurantCard restaurant={nextRestaurant} isBackground />
          </div>
        )}

        {/* Current Card */}
        <motion.div
          className="absolute inset-4 sm:inset-6 cursor-grab active:cursor-grabbing touch-none"
          style={{ x, rotate, scale }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
        >
          <RestaurantCard 
            restaurant={currentRestaurant} 
            likeOpacity={likeOpacity}
            nopeOpacity={nopeOpacity}
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-8 py-6 px-4 safe-area-bottom">
        <motion.button
          onClick={() => handleSwipe("left")}
          className="relative w-16 h-16 rounded-full bg-[#111] border-2 border-[rgba(255,255,255,0.08)] flex items-center justify-center group shadow-lg"
          whileHover={{ scale: 1.1, borderColor: "rgba(244, 63, 94, 0.5)" }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span 
            className="text-3xl"
            whileHover={{ scale: 1.2, rotate: 90 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            ✕
          </motion.span>
          {/* Tooltip */}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#52525b] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Nope
          </span>
        </motion.button>
        
        <motion.button
          onClick={() => handleSwipe("right")}
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-xl shadow-[#f43f5e]/30 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span 
            className="text-4xl"
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            ❤️
          </motion.span>
          {/* Glow effect */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-30 blur-lg -z-10" />
          {/* Tooltip */}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#52525b] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Like
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function RestaurantCard({ 
  restaurant, 
  isBackground = false,
  likeOpacity,
  nopeOpacity 
}: { 
  restaurant: Restaurant;
  isBackground?: boolean;
  likeOpacity?: ReturnType<typeof useTransform<number, number>>;
  nopeOpacity?: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <div 
      className={`relative w-full h-full rounded-3xl overflow-hidden ${
        isBackground ? "scale-[0.95] opacity-40" : "shadow-2xl"
      }`}
    >
      {/* Image */}
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Like/Nope Indicators */}
      {!isBackground && likeOpacity && nopeOpacity && (
        <>
          {/* LIKE Indicator */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 px-5 py-2.5 border-4 border-[#10b981] rounded-xl rotate-[-15deg] bg-[#10b981]/10 backdrop-blur-sm"
          >
            <span className="text-[#10b981] text-3xl font-black tracking-wide">YUM!</span>
          </motion.div>
          
          {/* NOPE Indicator */}
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-6 px-5 py-2.5 border-4 border-[#f43f5e] rounded-xl rotate-[15deg] bg-[#f43f5e]/10 backdrop-blur-sm"
          >
            <span className="text-[#f43f5e] text-3xl font-black tracking-wide">NOPE</span>
          </motion.div>
        </>
      )}

      {/* Content */}
      {!isBackground && (
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Name */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">{restaurant.name}</h2>

          {/* Details */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★</span>
              <span className="font-semibold">{restaurant.rating}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{restaurant.cuisine}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-medium">{restaurant.price}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {restaurant.distance}
            </span>
          </div>
        </div>
      )}

      {/* Subtle border glow for active card */}
      {!isBackground && (
        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
      )}
    </div>
  );
}
