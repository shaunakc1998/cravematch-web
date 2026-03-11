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
  const [localSwipes, setLocalSwipes] = useState<SwipeData[]>([]);
  const { addMatch } = useApp();

  const restaurantPool = (filteredRestaurants ?? allRestaurants).slice(0, maxSwipes);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);
  const nextCardScale = useTransform(x, [-150, 0, 150], [1, 0.93, 1]);
  const nextCardOpacity = useTransform(x, [-150, 0, 150], [1, 0.5, 1]);

  useEffect(() => {
    x.set(0);
  }, [currentIndex, x]);

  const currentRestaurant = restaurantPool[currentIndex];
  const nextRestaurant = restaurantPool[currentIndex + 1];

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentRestaurant) return;

    const liked = direction === "right";

    if (liked) {
      addMatch(currentRestaurant);
    }

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
          {
            room_id: sessionId,
            restaurant_id: currentRestaurant.id,
            liked,
          },
          { onConflict: "room_id,user_id,restaurant_id" }
        );
      } catch (err) {
        console.error("Failed to record swipe to Supabase:", err);
      }
    }

    animate(x, direction === "left" ? -500 : 500, {
      duration: 0.35,
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
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    if (offset > 80 || velocity > 500) {
      handleSwipe("right");
    } else if (offset < -80 || velocity < -500) {
      handleSwipe("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  if (currentIndex >= restaurantPool.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-xs"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl bg-[#111] border border-[#48484a] flex items-center justify-center mx-auto mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-10 h-10 text-[#FF2D55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">All caught up!</h2>
          <p className="text-[#636366] mb-8 text-sm leading-relaxed">
            You&apos;ve seen all restaurants. Check your matches or start over.
          </p>
          <motion.button
            onClick={() => {
              setCurrentIndex(0);
              setLocalSwipes([]);
            }}
            className="px-8 py-3.5 bg-[#FF2D55] text-white font-bold rounded-2xl active:scale-95 transition-transform"
            style={{ boxShadow: "0 8px 24px rgba(255,45,85,0.35)" }}
            whileTap={{ scale: 0.95 }}
          >
            Start Over
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const totalDots = Math.min(restaurantPool.length, 7);
  const dotStartIdx = Math.max(0, Math.min(currentIndex - 3, restaurantPool.length - totalDots));

  return (
    <div className="h-full flex flex-col select-none bg-black">
      {/* Card Stack — fills available space */}
      <div className="flex-1 relative min-h-0">
        {/* Next card */}
        {nextRestaurant && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{ scale: nextCardScale, opacity: nextCardOpacity }}
          >
            <CardContent restaurant={nextRestaurant} />
          </motion.div>
        )}

        {/* Current card */}
        {currentRestaurant && (
          <motion.div
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none overflow-hidden shadow-2xl"
            style={{ x, rotate, scale: cardScale }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
          >
            <CardContent
              restaurant={currentRestaurant}
              likeOpacity={likeOpacity}
              nopeOpacity={nopeOpacity}
            />
          </motion.div>
        )}
      </div>

      {/* Dot progress + buttons */}
      <div className="flex-shrink-0 px-6 pt-3 pb-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: totalDots }).map((_, i) => {
            const realIdx = dotStartIdx + i;
            const isActive = realIdx === currentIndex;
            return (
              <motion.div
                key={realIdx}
                animate={{
                  width: isActive ? 20 : 6,
                  backgroundColor: isActive ? "#FF2D55" : "#48484a",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="h-1.5 rounded-full"
              />
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Pass */}
          <motion.button
            onClick={() => handleSwipe("left")}
            className="w-14 h-14 rounded-full border border-[#333] bg-[#111] flex items-center justify-center touch-manipulation"
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <svg className="w-6 h-6 text-[#636366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Like */}
          <motion.button
            onClick={() => handleSwipe("right")}
            className="w-16 h-16 rounded-full flex items-center justify-center touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
              boxShadow: "0 8px 30px rgba(255,45,85,0.45)",
            }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function CardContent({
  restaurant,
  likeOpacity,
  nopeOpacity,
}: {
  restaurant: Restaurant;
  likeOpacity?: ReturnType<typeof useTransform<number, number>>;
  nopeOpacity?: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <div className="relative w-full h-full bg-[#111]">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Deep gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* LIKE stamp */}
      {likeOpacity && (
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-5 rotate-[-18deg]"
        >
          <div className="px-3 py-1.5 rounded-xl border-[3px] border-[#30D158]">
            <span className="text-[#30D158] text-xl font-black tracking-widest">LIKE</span>
          </div>
        </motion.div>
      )}

      {/* NOPE stamp */}
      {nopeOpacity && (
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-5 rotate-[18deg]"
        >
          <div className="px-3 py-1.5 rounded-xl border-[3px] border-[#FF2D55]">
            <span className="text-[#FF2D55] text-xl font-black tracking-widest">NOPE</span>
          </div>
        </motion.div>
      )}

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent pt-20">
        {/* Vibe tag */}
        {restaurant.vibes?.[0] && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF2D55] mb-1 block">
            {restaurant.vibes[0]}
          </span>
        )}

        {/* Name */}
        <h2 className="text-[26px] font-black text-white leading-tight tracking-tight mb-2">
          {restaurant.name}
        </h2>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-sm text-white/80 mb-3">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="font-bold text-white">{restaurant.rating}</span>
          </span>
          <span className="text-[#48484a]">·</span>
          <span>{restaurant.price}</span>
          <span className="text-[#48484a]">·</span>
          <span>{restaurant.distance}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold backdrop-blur-sm border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
