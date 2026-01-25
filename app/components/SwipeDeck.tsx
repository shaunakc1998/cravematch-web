"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, RotateCcw, LogOut } from "lucide-react";
import RestaurantCard from "./RestaurantCard";
import MatchCelebration from "./MatchCelebration";
import { Restaurant, restaurants } from "../data/restaurants";
import { useApp } from "../context/AppContext";

export default function SwipeDeck() {
  const [cards, setCards] = useState<Restaurant[]>([...restaurants].reverse());
  const [swipedCards, setSwipedCards] = useState<
    { restaurant: Restaurant; direction: "left" | "right" }[]
  >([]);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedRestaurant, setMatchedRestaurant] = useState<Restaurant | null>(
    null
  );
  const [isGroupMatch, setIsGroupMatch] = useState(false);

  // Track swipe count for bot logic
  const swipeCountRef = useRef(0);

  const {
    addMatch,
    likeCount,
    incrementLikeCount,
    resetLikeCount,
    groupSession,
    endGroupSession,
  } = useApp();

  // Get partner name from group session
  const partnerName =
    groupSession?.participants.find((p) => p.name !== "You")?.name || "Manasi";

  // Bot swipe logic: 50% random, always right on 3rd card
  const getBotSwipe = (cardIndex: number): "left" | "right" => {
    // Card index is 1-based for this logic
    if (cardIndex === 3) {
      // Always swipe right on 3rd card (for testing)
      return "right";
    }
    // 50% chance to swipe right
    return Math.random() > 0.5 ? "right" : "left";
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (cards.length === 0) return;

    const swipedCard = cards[cards.length - 1];
    swipeCountRef.current += 1;
    const currentSwipeCount = swipeCountRef.current;

    setSwipedCards((prev) => [
      ...prev,
      { restaurant: swipedCard, direction },
    ]);
    setCards((prev) => prev.slice(0, -1));

    // If swiped right (liked)
    if (direction === "right") {
      incrementLikeCount();

      // Group mode logic
      if (groupSession?.isActive) {
        // Get bot's swipe decision
        const botSwipe = getBotSwipe(currentSwipeCount);

        // If both user and bot swiped right, it's a group match!
        if (botSwipe === "right") {
          addMatch(swipedCard, true, partnerName);
          setMatchedRestaurant(swipedCard);
          setIsGroupMatch(true);
          setShowMatch(true);
        } else {
          // Only user liked, not a group match
          addMatch(swipedCard, false);
        }
      } else {
        // Solo mode
        addMatch(swipedCard, false);
        // Trigger match celebration on every 2nd like
        const newLikeCount = likeCount + 1;
        if (newLikeCount % 2 === 0) {
          setMatchedRestaurant(swipedCard);
          setIsGroupMatch(false);
          setShowMatch(true);
        }
      }
    }
  };

  const handleUndo = () => {
    if (swipedCards.length === 0) return;

    const lastSwiped = swipedCards[swipedCards.length - 1];
    setSwipedCards((prev) => prev.slice(0, -1));
    setCards((prev) => [...prev, lastSwiped.restaurant]);
    swipeCountRef.current = Math.max(0, swipeCountRef.current - 1);
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    handleSwipe(direction);
  };

  const handleCloseMatch = () => {
    setShowMatch(false);
    setMatchedRestaurant(null);
    setIsGroupMatch(false);
  };

  const handleLetsEat = () => {
    setShowMatch(false);
    setMatchedRestaurant(null);
    setIsGroupMatch(false);
  };

  const handleReset = () => {
    setCards([...restaurants].reverse());
    resetLikeCount();
    swipeCountRef.current = 0;
  };

  const handleLeaveSession = () => {
    endGroupSession();
    handleReset();
  };

  return (
    <>
      <div className="relative flex-1 w-full flex flex-col">
        {/* Live Status Bar (Group Mode) */}
        {groupSession?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-[#2a2a2a] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* Pulsing red dot */}
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-white font-medium text-sm">
                Live Session with{" "}
                <span className="text-[#ff4d6d]">{partnerName}</span>
              </span>
            </div>
            <button
              onClick={handleLeaveSession}
              className="p-2 text-[#6b7280] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Card Stack Area */}
        <div className="relative flex-1 w-full px-4 pt-2 pb-2">
          <div className="relative w-full h-full">
            <AnimatePresence mode="popLayout">
              {cards.length > 0 ? (
                cards.slice(-2).map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onSwipe={handleSwipe}
                    isTop={index === cards.slice(-2).length - 1}
                  />
                ))
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                    <Heart className="w-10 h-10 text-[#ff4d6d]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No more restaurants!
                  </h3>
                  <p className="text-[#6b7280] mb-6">
                    You&apos;ve seen all the options. Tap below to start over.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-[#ff4d6d] text-white font-semibold rounded-full active:scale-95 transition-transform"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 py-4 px-4">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={swipedCards.length === 0}
            className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a] disabled:opacity-30 active:scale-90 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-yellow-500" />
          </button>

          {/* Nope Button */}
          <button
            onClick={() => handleButtonSwipe("left")}
            disabled={cards.length === 0}
            className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center border-2 border-[#ff4d6d] disabled:opacity-30 active:scale-90 active:bg-[#ff4d6d]/20 transition-all"
          >
            <X className="w-8 h-8 text-[#ff4d6d]" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => handleButtonSwipe("right")}
            disabled={cards.length === 0}
            className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center border-2 border-[#10b981] disabled:opacity-30 active:scale-90 active:bg-[#10b981]/20 transition-all"
          >
            <Heart className="w-8 h-8 text-[#10b981]" />
          </button>

          {/* Placeholder for symmetry */}
          <div className="w-12 h-12" />
        </div>
      </div>

      {/* Match Celebration Modal */}
      <MatchCelebration
        restaurant={matchedRestaurant}
        isOpen={showMatch}
        onClose={handleCloseMatch}
        onLetsEat={handleLetsEat}
        isGroupMatch={isGroupMatch}
        partnerName={partnerName}
      />
    </>
  );
}
