"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { restaurants as allRestaurants, Restaurant } from "../data/restaurants";
import { useApp } from "../context/AppContext";
import { SwipeData } from "../lib/algorithm";
import { createClient } from "../lib/supabase";

interface SwipeDeckProps {
  filteredRestaurants?: Restaurant[];
  sessionId?: string;
  onComplete?: (swipes: SwipeData[]) => void;
  maxSwipes?: number;
}

export default function SwipeDeck({
  filteredRestaurants,
  sessionId,
  onComplete,
  maxSwipes = 25,
}: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSwipes, setLocalSwipes]   = useState<SwipeData[]>([]);
  const { addMatch } = useApp();

  const restaurantPool = (filteredRestaurants ?? allRestaurants).slice(0, maxSwipes);

  const x              = useMotionValue(0);
  const rotate         = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity    = useTransform(x, [40, 130], [0, 1]);
  const nopeOpacity    = useTransform(x, [-130, -40], [1, 0]);
  const cardScale      = useTransform(x, [-200, 0, 200], [0.96, 1, 0.96]);
  const nextCardScale  = useTransform(x, [-140, 0, 140], [1, 0.92, 1]);
  const nextCardOpacity = useTransform(x, [-140, 0, 140], [1, 0.45, 1]);

  useEffect(() => { x.set(0); }, [currentIndex, x]);

  const currentRestaurant = restaurantPool[currentIndex];
  const nextRestaurant    = restaurantPool[currentIndex + 1];

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentRestaurant) return;
    const liked = direction === "right";

    if (liked) addMatch(currentRestaurant);

    const swipeData: SwipeData = {
      userId: "solo",
      restaurantId: currentRestaurant.id,
      liked,
    };

    const updatedSwipes = [...localSwipes, swipeData];
    setLocalSwipes(updatedSwipes);

    if (sessionId) {
      try {
        const supabase = createClient();
        await supabase.from("swipes").upsert(
          { room_id: sessionId, restaurant_id: currentRestaurant.id, liked },
          { onConflict: "room_id,user_id,restaurant_id" }
        );
      } catch (err) {
        console.error("Failed to record swipe:", err);
      }
    }

    animate(x, direction === "left" ? -520 : 520, {
      duration: 0.32,
      ease: [0.36, 0, 0.66, -0.56],
      onComplete: () => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        if (nextIdx >= restaurantPool.length && onComplete) {
          onComplete(updatedSwipes);
        }
      },
    });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > 80 || velocity.x > 500)        handleSwipe("right");
    else if (offset.x < -80 || velocity.x < -500) handleSwipe("left");
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  // ── Empty state ─────────────────────────────────────────────────
  if (currentIndex >= restaurantPool.length) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "#F7F6F2" }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="max-w-xs"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl"
            style={{
              background: "#DCFCE7",
              border: "2px solid #BBF7D0",
              boxShadow: "0 8px 24px rgba(22,163,74,0.15)",
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🎉
          </motion.div>
          <h2
            className="text-2xl font-black mb-2 tracking-tight"
            style={{ color: "#1C1917", letterSpacing: "-0.02em" }}
          >
            You&apos;re all caught up!
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#78716C" }}>
            You&apos;ve seen every restaurant. Check your Saved tab or start again.
          </p>
          <motion.button
            onClick={() => { setCurrentIndex(0); setLocalSwipes([]); }}
            className="btn btn-primary btn-lg"
            whileTap={{ scale: 0.96 }}
          >
            Start Over
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const totalDots  = Math.min(restaurantPool.length, 7);
  const dotStart   = Math.max(0, Math.min(currentIndex - 3, restaurantPool.length - totalDots));
  const progress   = Math.round(((currentIndex) / restaurantPool.length) * 100);

  return (
    <div className="h-full flex flex-col select-none" style={{ background: "#F7F6F2" }}>

      {/* ── Progress bar ───────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: "#A8A29E" }}>
            {currentIndex} of {restaurantPool.length}
          </span>
          <span className="text-xs font-semibold" style={{ color: "#A8A29E" }}>
            {progress}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "#E2DFD8" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #16A34A, #22C55E)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ── Card stack ─────────────────────────────────── */}
      <div className="flex-1 relative min-h-0 px-4 py-2">
        {/* Shadow/background card */}
        {nextRestaurant && (
          <motion.div
            className="absolute inset-4 rounded-3xl overflow-hidden"
            style={{
              scale: nextCardScale,
              opacity: nextCardOpacity,
              boxShadow: "0 8px 32px rgba(28,25,23,0.12)",
              transformOrigin: "bottom center",
            }}
          >
            <CardFace restaurant={nextRestaurant} />
          </motion.div>
        )}

        {/* Active draggable card */}
        {currentRestaurant && (
          <motion.div
            className="absolute inset-4 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            style={{
              x,
              rotate,
              scale: cardScale,
              boxShadow: "0 12px 40px rgba(28,25,23,0.16), 0 4px 12px rgba(28,25,23,0.08)",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.75}
            onDragEnd={handleDragEnd}
          >
            <CardFace
              restaurant={currentRestaurant}
              likeOpacity={likeOpacity}
              nopeOpacity={nopeOpacity}
            />
          </motion.div>
        )}
      </div>

      {/* ── Controls ───────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-2 pb-4">
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: totalDots }).map((_, i) => {
            const realIdx = dotStart + i;
            const isActive = realIdx === currentIndex;
            return (
              <motion.div
                key={realIdx}
                animate={{
                  width:           isActive ? 22 : 7,
                  backgroundColor: isActive ? "#16A34A" : "#C8C4BC",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="h-1.5 rounded-full"
              />
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-5">
          {/* Pass */}
          <motion.button
            onClick={() => handleSwipe("left")}
            className="btn-icon btn-icon-lg flex items-center justify-center"
            style={{
              background: "#FFFFFF",
              border: "2px solid #E2DFD8",
              boxShadow: "0 4px 16px rgba(28,25,23,0.08)",
              borderRadius: "9999px",
            }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ color: "#DC2626" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Like */}
          <motion.button
            onClick={() => handleSwipe("right")}
            className="btn-icon btn-icon-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
              boxShadow: "0 8px 28px rgba(22,163,74,0.40)",
              borderRadius: "9999px",
            }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.button>

          {/* Skip hint */}
          <div className="w-[56px] h-[56px]" />
        </div>

        {/* Hint text */}
        <p className="text-center text-xs mt-3" style={{ color: "#C8C4BC" }}>
          Swipe right to save · left to skip
        </p>
      </div>
    </div>
  );
}

/* ── Card face component ───────────────────────────────────── */
function CardFace({
  restaurant,
  likeOpacity,
  nopeOpacity,
}: {
  restaurant: Restaurant;
  likeOpacity?: ReturnType<typeof useTransform<number, number>>;
  nopeOpacity?: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <div className="relative w-full h-full" style={{ background: "#1C1917" }}>
      {/* Photo */}
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay — lighter at top, dark at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* LIKE stamp */}
      {likeOpacity && (
        <motion.div
          style={{ opacity: likeOpacity }}
          className="swipe-stamp swipe-stamp-like"
        >
          LIKE ✓
        </motion.div>
      )}

      {/* NOPE stamp */}
      {nopeOpacity && (
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="swipe-stamp swipe-stamp-nope"
        >
          NOPE ✕
        </motion.div>
      )}

      {/* Info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Cuisine pill */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="badge"
            style={{
              background: "rgba(22,163,74,0.85)",
              color: "white",
              backdropFilter: "blur(8px)",
              fontSize: "10px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {restaurant.cuisine}
          </span>
          {restaurant.vibes?.[0] && (
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                fontSize: "10px",
              }}
            >
              {restaurant.vibes[0]}
            </span>
          )}
        </div>

        {/* Name */}
        <h2
          className="text-white font-black leading-tight mb-2"
          style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}
        >
          {restaurant.name}
        </h2>

        {/* Meta row */}
        <div className="flex items-center gap-2.5 text-sm text-white/80 mb-3">
          <span className="flex items-center gap-1">
            <span style={{ color: "#FCD34D" }}>★</span>
            <span className="font-bold text-white">{restaurant.rating}</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>•</span>
          <span>{restaurant.price}</span>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>•</span>
          <span>{restaurant.distance}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-white/90 text-[11px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
