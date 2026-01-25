"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Restaurant } from "../data/restaurants";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export default function RestaurantCard({
  restaurant,
  onSwipe,
  isTop,
}: RestaurantCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Swipe indicator opacity
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      onSwipe("right");
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? scale : 0.95,
        opacity: isTop ? 1 : 0.5,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.6 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        transition: { duration: 0.25 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Card Container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.image})` }}
        />

        {/* Gradient Overlay - Enhanced for better readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Top gradient for indicators */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />

        {/* YUM! Indicator */}
        {isTop && (
          <motion.div
            className="absolute top-8 left-6 px-5 py-2.5 border-4 border-[#10b981] rounded-xl rotate-[-15deg] bg-[#10b981]/10 backdrop-blur-sm"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-[#10b981] text-3xl font-black tracking-wide drop-shadow-lg">
              YUM!
            </span>
          </motion.div>
        )}

        {/* NOPE Indicator */}
        {isTop && (
          <motion.div
            className="absolute top-8 right-6 px-5 py-2.5 border-4 border-[#f43f5e] rounded-xl rotate-[15deg] bg-[#f43f5e]/10 backdrop-blur-sm"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-[#f43f5e] text-3xl font-black tracking-wide drop-shadow-lg">
              NOPE
            </span>
          </motion.div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Restaurant Name */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            {restaurant.name}
          </h2>

          {/* Details Row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-white/90">
            {/* Rating */}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="font-bold text-sm">{restaurant.rating}</span>
            </div>
            
            {/* Cuisine */}
            <span className="font-medium text-sm">{restaurant.cuisine}</span>
            
            <span className="w-1 h-1 rounded-full bg-white/50" />
            
            {/* Price */}
            <span className="font-semibold text-sm">{restaurant.price}</span>
            
            <span className="w-1 h-1 rounded-full bg-white/50" />
            
            {/* Distance */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{restaurant.distance}</span>
            </div>
          </div>
        </div>

        {/* Subtle border */}
        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
        
        {/* Top shine effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </motion.div>
  );
}
