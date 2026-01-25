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
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4d6d]/20 to-[#ff6b8a]/20 flex items-center justify-center mb-6">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
        <p className="text-[#666] text-center mb-8">
          You&apos;ve seen all restaurants. Check back later for more!
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-8 py-3 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold rounded-full"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Card Stack */}
      <div className="flex-1 relative">
        {/* Next Card (Background) */}
        {nextRestaurant && (
          <div className="absolute inset-4 sm:inset-6">
            <RestaurantCard restaurant={nextRestaurant} isBackground />
          </div>
        )}

        {/* Current Card */}
        <motion.div
          className="absolute inset-4 sm:inset-6 cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
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
      <div className="flex items-center justify-center gap-6 py-6 px-4">
        <button
          onClick={() => handleSwipe("left")}
          className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#ff4d6d]/30 flex items-center justify-center transition-all hover:scale-110 hover:border-[#ff4d6d] hover:bg-[#ff4d6d]/10 active:scale-95"
        >
          <span className="text-3xl">✕</span>
        </button>
        
        <button
          onClick={() => handleSwipe("right")}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center shadow-lg shadow-[#ff4d6d]/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-[#ff4d6d]/40 active:scale-95"
        >
          <span className="text-4xl">❤️</span>
        </button>
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
        isBackground ? "scale-[0.95] opacity-50" : "shadow-2xl"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      {/* Like/Nope Indicators */}
      {!isBackground && likeOpacity && nopeOpacity && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-8 px-4 py-2 border-4 border-[#4ade80] rounded-lg rotate-[-20deg]"
          >
            <span className="text-[#4ade80] text-3xl font-black">LIKE</span>
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-8 px-4 py-2 border-4 border-[#ff4d6d] rounded-lg rotate-[20deg]"
          >
            <span className="text-[#ff4d6d] text-3xl font-black">NOPE</span>
          </motion.div>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Name */}
        <h2 className="text-3xl font-bold text-white mb-2">{restaurant.name}</h2>

        {/* Details */}
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            {restaurant.rating}
          </span>
          <span>•</span>
          <span>{restaurant.cuisine}</span>
          <span>•</span>
          <span>{restaurant.price}</span>
          <span>•</span>
          <span>{restaurant.distance}</span>
        </div>
      </div>
    </div>
  );
}
