"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { restaurants as allRestaurants, Restaurant } from "../data/restaurants";
import { useApp } from "../context/AppContext";
import { SwipeData } from "../lib/algorithm";
import { createClient } from "../lib/supabase";

interface SwipeDeckProps {
  filteredRestaurants?: Restaurant[]; // if provided, use instead of all restaurants
  sessionId?: string; // if in group mode, record swipes to Supabase
  onComplete?: (swipes: SwipeData[]) => void; // callback when all swiped
  maxSwipes?: number; // default 25
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

    // Record to Supabase in group mode
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
      <div className="h-full flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-xs"
        >
          <motion.div
            className="text-6xl mb-6 inline-block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-[#6b7280] mb-8 text-sm leading-relaxed">
            You&apos;ve seen all restaurants. Check back later for more!
          </p>
          <motion.button
            onClick={() => {
              setCurrentIndex(0);
              setLocalSwipes([]);
            }}
            className="px-8 py-3.5 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 active:scale-95 transition-transform"
            whileTap={{ scale: 0.95 }}
          >
            Start Over
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col select-none">
      {/* Counter */}
      <div className="flex-shrink-0 flex items-center justify-center py-2">
        <span className="text-[#4b5563] text-xs font-medium tabular-nums">
          {currentIndex + 1} <span className="text-[#2d2d2d]">/</span> {restaurantPool.length}
        </span>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative mx-4 min-h-0">
        {/* Next card */}
        {nextRestaurant && (
          <motion.div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ scale: nextCardScale, opacity: nextCardOpacity }}
          >
            <CardContent restaurant={nextRestaurant} />
          </motion.div>
        )}

        {/* Current card */}
        {currentRestaurant && (
          <motion.div
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none rounded-3xl overflow-hidden shadow-2xl"
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

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center justify-center gap-5 py-5 px-8">
        {/* Pass */}
        <motion.button
          onClick={() => handleSwipe("left")}
          className="w-[60px] h-[60px] rounded-full border-2 border-white/10 bg-[#0d0d0d] flex items-center justify-center shadow-lg touch-manipulation"
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <svg className="w-6 h-6 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Like */}
        <motion.button
          onClick={() => handleSwipe("right")}
          className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-xl touch-manipulation relative"
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400 }}
          style={{ boxShadow: "0 8px 30px rgba(244,63,94,0.4)" }}
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </motion.button>
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
    <div className="relative w-full h-full bg-[#0d0d0d]">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Swipe indicators */}
      {likeOpacity && (
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-5 px-4 py-2 rounded-xl border-[3px] border-[#10b981] rotate-[-18deg]"
        >
          <span className="text-[#10b981] text-2xl font-black tracking-widest">YUM</span>
        </motion.div>
      )}
      {nopeOpacity && (
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-5 px-4 py-2 rounded-xl border-[3px] border-[#f43f5e] rotate-[18deg]"
        >
          <span className="text-[#f43f5e] text-2xl font-black tracking-widest">NOPE</span>
        </motion.div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-white tracking-tight mb-2 leading-none">
          {restaurant.name}
        </h2>

        <div className="flex items-center gap-3 text-sm text-white/70">
          <span className="flex items-center gap-1">
            <span className="text-amber-400">★</span>
            <span className="text-white font-semibold">{restaurant.rating}</span>
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
          <span>{restaurant.cuisine}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
          <span className="font-medium text-white/90">{restaurant.price}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.distance}
          </span>
        </div>
      </div>
    </div>
  );
}
