"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Star } from "lucide-react";
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
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? 1 : 0.5,
        scale: isTop ? 1 : 0.95,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.2 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Card Container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.image})` }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* LIKE Indicator */}
        {isTop && (
          <motion.div
            className="absolute top-8 left-6 px-4 py-2 border-4 border-[#10b981] rounded-lg rotate-[-20deg]"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-[#10b981] text-3xl font-black tracking-wider">
              YUM!
            </span>
          </motion.div>
        )}

        {/* NOPE Indicator */}
        {isTop && (
          <motion.div
            className="absolute top-8 right-6 px-4 py-2 border-4 border-[#ff4d6d] rounded-lg rotate-[20deg]"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-[#ff4d6d] text-3xl font-black tracking-wider">
              NOPE
            </span>
          </motion.div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Tags */}
          <div className="flex gap-2 mb-3">
            {restaurant.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Restaurant Name */}
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {restaurant.name}
          </h2>

          {/* Details Row */}
          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{restaurant.rating}</span>
            </div>
            <span className="text-white/40">•</span>
            <span className="font-medium">{restaurant.cuisine}</span>
            <span className="text-white/40">•</span>
            <span className="font-medium">{restaurant.price}</span>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.distance}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
