"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthContext";
import { restaurants as allRestaurants, Restaurant } from "../data/restaurants";
import { createClient } from "../lib/supabase";
import { SessionFilters } from "../context/AppContext";
import { SwipeData, calculateMatches, MatchResult } from "../lib/algorithm";
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
  startSession,
  recordSwipe,
  getRoomParticipants,
  getRoomMatches,
  leaveRoom,
  Room as SupabaseRoom,
  Participant as SupabaseParticipant,
  Match as SupabaseMatch,
} from "../lib/roomService";

type LobbyState = "idle" | "filters" | "lobby" | "swiping" | "waiting" | "results";

interface Participant {
  id: string;
  name: string;
  isReady: boolean;
  swipeCount?: number;
}

const DEFAULT_FILTERS: SessionFilters = {
  radius: 5,
  priceLevels: [1, 2, 3, 4],
  dietary: [],
  openNow: false,
};

const DIETARY_OPTIONS = [
  "Vegan Options",
  "Vegetarian Options",
  "Halal",
  "Gluten-Free Options",
];

const MAX_SWIPES = 20;

export default function GroupLobby() {
  const { user } = useAuth();
  const [lobbyState, setLobbyState] = useState<LobbyState>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentRoom, setCurrentRoom] = useState<SupabaseRoom | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SessionFilters>(DEFAULT_FILTERS);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(allRestaurants);

  // Swiping state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mySwipes, setMySwipes] = useState<SwipeData[]>([]);
  const currentIndexRef = useRef(0);

  // Results state
  const [results, setResults] = useState<MatchResult[]>([]);
  const [aiReason, setAiReason] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomSubscriptionRef = useRef<RealtimeChannel | null>(null);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "You";

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Apply filters to get restaurant list
  const applyFilters = (f: SessionFilters): Restaurant[] => {
    return allRestaurants.filter((r) => {
      if (!f.priceLevels.includes(r.priceLevel)) return false;
      if (f.openNow && !r.isOpen) return false;
      if (f.dietary.length > 0) {
        const hasAll = f.dietary.every((d) => r.dietary.includes(d));
        if (!hasAll) return false;
      }
      return true;
    });
  };

  // HOST: show filters screen first
  const showFilters = () => {
    setLobbyState("filters");
  };

  // HOST: create room after setting filters
  const createSessionWithFilters = async () => {
    if (!user) {
      setError("Please log in to host a session");
      return;
    }
    setIsLoading(true);
    try {
      const { room, error: roomError } = await createRoom(user.id, userName);
      if (roomError || !room) {
        setError(roomError || "Failed to create room");
        setIsLoading(false);
        return;
      }
      const filtered = applyFilters(filters);
      setFilteredRestaurants(filtered.length > 0 ? filtered : allRestaurants);
      setCurrentRoom(room);
      setRoomCode(room.code);
      setParticipants([{ id: user.id, name: userName, isReady: true }]);
      setLobbyState("lobby");
      setError("");
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // JOIN: join existing room
  const joinSession = async () => {
    if (!user) {
      setError("Please log in to join a session");
      return;
    }
    if (joinCode.length !== 4) {
      setError("Please enter a 4-letter code");
      return;
    }
    setIsLoading(true);
    try {
      const { room, error: joinError } = await joinRoom(joinCode, user.id, userName);
      if (joinError || !room) {
        setError(joinError || "Room not found");
        setIsLoading(false);
        return;
      }
      setCurrentRoom(room);
      setRoomCode(room.code);
      setLobbyState("lobby");
      setError("");

      const existingParticipants = await getRoomParticipants(room.id);
      setParticipants(
        existingParticipants.map((p) => ({
          id: p.user_id,
          name: p.name,
          isReady: p.is_ready,
        }))
      );
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to room realtime updates
  useEffect(() => {
    if (!currentRoom) return;

    if (roomSubscriptionRef.current) {
      unsubscribeFromRoom(roomSubscriptionRef.current);
    }

    roomSubscriptionRef.current = subscribeToRoom(
      currentRoom.id,
      (updatedParticipants: SupabaseParticipant[]) => {
        setParticipants(
          updatedParticipants.map((p) => ({
            id: p.user_id,
            name: p.name,
            isReady: p.is_ready,
          }))
        );
      },
      (updatedRoom: SupabaseRoom) => {
        setCurrentRoom(updatedRoom);
        if (updatedRoom.status === "active" && lobbyState === "lobby") {
          setLobbyState("swiping");
          setCurrentIndex(0);
          setMySwipes([]);
        }
      },
      (_match: SupabaseMatch) => {
        // matches handled via polling
      }
    );

    return () => {
      if (roomSubscriptionRef.current) {
        unsubscribeFromRoom(roomSubscriptionRef.current);
        roomSubscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  // Poll participants while in lobby
  useEffect(() => {
    if (!currentRoom || lobbyState !== "lobby") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRoomParticipants(currentRoom.id);
        setParticipants(
          updated.map((p) => ({ id: p.user_id, name: p.name, isReady: p.is_ready }))
        );
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentRoom, lobbyState]);

  // Poll room status as fallback while in lobby
  useEffect(() => {
    if (!currentRoom || lobbyState !== "lobby") return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("rooms")
          .select()
          .eq("id", currentRoom.id)
          .single();
        if (data && data.status === "active") {
          setCurrentRoom(data);
          setLobbyState("swiping");
          setCurrentIndex(0);
          setMySwipes([]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [currentRoom, lobbyState]);

  // START SWIPING (host only)
  const startSwiping = async () => {
    if (!currentRoom || !user) return;
    if (participants.length < 2) {
      setError("Need at least 2 people to start (or you can swipe solo)");
      return;
    }
    if (currentRoom.host_id !== user.id) {
      setError("Only the host can start the session");
      return;
    }
    setIsLoading(true);
    try {
      const { success, error: startError } = await startSession(currentRoom.id, user.id);
      if (!success || startError) {
        setError(startError || "Failed to start session");
        setIsLoading(false);
        return;
      }
      setLobbyState("swiping");
      setCurrentIndex(0);
      setMySwipes([]);
      setError("");
    } catch (err) {
      setError("Failed to start swiping session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Solo start (bypass 2-person requirement)
  const startSoloSwiping = async () => {
    if (!currentRoom || !user) return;
    if (currentRoom.host_id !== user.id) return;
    setIsLoading(true);
    try {
      await startSession(currentRoom.id, user.id);
      setLobbyState("swiping");
      setCurrentIndex(0);
      setMySwipes([]);
      setError("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle a swipe during group session
  const handleGroupSwipe = async (liked: boolean) => {
    if (!currentRoom || !user) return;
    const restaurant = filteredRestaurants[currentIndex];
    if (!restaurant) return;

    try {
      await recordSwipe(
        currentRoom.id,
        user.id,
        restaurant.id,
        liked ? "right" : "left"
      );
    } catch (err) {
      console.error("Failed to record swipe:", err);
    }

    const swipe: SwipeData = { userId: user.id, restaurantId: restaurant.id, liked };
    const updatedSwipes = [...mySwipes, swipe];
    setMySwipes(updatedSwipes);

    const nextIdx = currentIndex + 1;

    if (nextIdx >= Math.min(filteredRestaurants.length, MAX_SWIPES)) {
      // Done swiping — move to waiting
      setLobbyState("waiting");
      // Try to compute results
      await computeResults(updatedSwipes);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const computeResults = async (swipes: SwipeData[]) => {
    if (!currentRoom || !user) return;

    setIsLoadingAI(true);
    try {
      // Fetch all swipes for this room from Supabase
      const supabase = createClient();
      const { data: allSwipesRaw } = await supabase
        .from("swipes")
        .select()
        .eq("room_id", currentRoom.id);

      // Build SwipeData list from DB
      const allSwipeData: SwipeData[] = (allSwipesRaw || []).map(
        (s: { user_id: string; restaurant_id: string; liked?: boolean; direction?: string }) => ({
          userId: s.user_id,
          restaurantId: s.restaurant_id,
          liked: s.liked ?? s.direction === "right",
        })
      );

      // Merge local swipes (in case Supabase hasn't updated yet)
      for (const sw of swipes) {
        if (!allSwipeData.find((s) => s.userId === sw.userId && s.restaurantId === sw.restaurantId)) {
          allSwipeData.push(sw);
        }
      }

      const userIds = participants.map((p) => p.id);
      const matchResults = calculateMatches(allSwipeData, filteredRestaurants, userIds);

      // Get AI recommendation if we have results
      if (matchResults.length > 0) {
        try {
          const membersPayload = participants.map((p) => ({ id: p.id, name: p.name }));
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              swipes: allSwipeData,
              restaurants: filteredRestaurants,
              members: membersPayload,
            }),
          });
          if (res.ok) {
            const aiData = await res.json();
            if (aiData.topPick?.reason) {
              setAiReason(aiData.topPick.reason);
              // Mark top result as ai_suggested if different from calculated top
              if (aiData.topPick.restaurantId !== matchResults[0]?.restaurant.id) {
                const aiRestaurant = filteredRestaurants.find(
                  (r) => r.id === aiData.topPick.restaurantId
                );
                if (aiRestaurant) {
                  matchResults.unshift({
                    restaurant: aiRestaurant,
                    score: matchResults[0]?.score ?? 0.5,
                    likedBy: allSwipeData
                      .filter((s) => s.restaurantId === aiRestaurant.id && s.liked)
                      .map((s) => s.userId),
                    matchType: "ai_suggested",
                    reason: aiData.topPick.reason,
                  });
                }
              } else {
                matchResults[0].reason = aiData.topPick.reason;
              }
            }
          }
        } catch (aiErr) {
          console.error("AI recommendation failed:", aiErr);
        }
      }

      setResults(matchResults.slice(0, 3));
      setLobbyState("results");
    } catch (err) {
      console.error("Error computing results:", err);
      setLobbyState("results");
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Poll swipe counts from other participants while waiting
  useEffect(() => {
    if (!currentRoom || lobbyState !== "waiting") return;
    const supabase = createClient();

    const interval = setInterval(async () => {
      try {
        // Check if all participants have finished
        const { data: swipesData } = await supabase
          .from("swipes")
          .select("user_id")
          .eq("room_id", currentRoom.id);

        if (!swipesData) return;

        const countByUser: Record<string, number> = {};
        for (const s of swipesData) {
          countByUser[s.user_id] = (countByUser[s.user_id] || 0) + 1;
        }

        // Update participant swipe counts
        setParticipants((prev) =>
          prev.map((p) => ({ ...p, swipeCount: countByUser[p.id] || 0 }))
        );

        // If all participants have done MAX_SWIPES, move to results
        const allDone = participants.every(
          (p) => (countByUser[p.id] || 0) >= MAX_SWIPES
        );
        if (allDone && participants.length > 0) {
          await computeResults(mySwipes);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom, lobbyState, participants]);

  const leaveSession = async () => {
    if (roomSubscriptionRef.current) {
      unsubscribeFromRoom(roomSubscriptionRef.current);
      roomSubscriptionRef.current = null;
    }
    if (currentRoom && user) {
      await leaveRoom(currentRoom.id, user.id);
    }
    setLobbyState("idle");
    setRoomCode("");
    setJoinCode("");
    setParticipants([]);
    setCurrentIndex(0);
    setMySwipes([]);
    setResults([]);
    setAiReason("");
    setError("");
    setCurrentRoom(null);
    setFilters(DEFAULT_FILTERS);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── IDLE STATE ──────────────────────────────────────────────────────────────
  if (lobbyState === "idle") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <motion.div
              className="text-6xl inline-block mb-4"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              👥
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Swipe Together</h1>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Match with friends on where to eat. When everyone agrees, it&apos;s decided.
            </p>
          </div>

          <motion.button
            onClick={showFilters}
            className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-3 shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-transform touch-manipulation"
            whileTap={{ scale: 0.97 }}
          >
            Host a Session
          </motion.button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[#4b5563] text-xs">or join with a code</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="mb-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="ABCD"
              maxLength={4}
              className="w-full bg-[#0d0d0d] border border-white/[0.07] rounded-2xl px-5 py-4 text-white text-center text-3xl tracking-[0.5em] font-bold placeholder:text-[#2d2d2d] focus:outline-none focus:border-[#f43f5e]/50 transition-all"
            />
          </div>
          <button
            onClick={joinSession}
            disabled={joinCode.length !== 4 || isLoading}
            className="w-full py-4 bg-[#0d0d0d] border border-white/[0.07] text-white font-semibold rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform touch-manipulation"
          >
            {isLoading ? "Joining..." : "Join Session"}
          </button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#f43f5e] text-sm text-center mt-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ── FILTERS STATE ────────────────────────────────────────────────────────────
  if (lobbyState === "filters") {
    const togglePrice = (level: number) => {
      setFilters((prev) => ({
        ...prev,
        priceLevels: prev.priceLevels.includes(level)
          ? prev.priceLevels.filter((l) => l !== level)
          : [...prev.priceLevels, level],
      }));
    };

    const toggleDietary = (opt: string) => {
      setFilters((prev) => ({
        ...prev,
        dietary: prev.dietary.includes(opt)
          ? prev.dietary.filter((d) => d !== opt)
          : [...prev.dietary, opt],
      }));
    };

    const priceLabelMap: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

    return (
      <div className="h-full flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <button
            onClick={() => setLobbyState("idle")}
            className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center touch-manipulation"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-white font-bold text-lg">Session Setup</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Location */}
          <div>
            <label className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-2 block">
              Location
            </label>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0d0d0d] border border-white/[0.07] rounded-xl">
              <svg className="w-4 h-4 text-[#f43f5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white/70 text-sm">Using your location</span>
            </div>
          </div>

          {/* Radius */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider">
                Radius
              </label>
              <span className="text-white text-sm font-semibold">{filters.radius} mi</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={filters.radius}
              onChange={(e) => setFilters((prev) => ({ ...prev, radius: Number(e.target.value) }))}
              className="w-full accent-[#f43f5e]"
            />
            <div className="flex justify-between text-[#4b5563] text-xs mt-1">
              <span>1 mi</span>
              <span>20 mi</span>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-2 block">
              Price Range
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => togglePrice(level)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all touch-manipulation ${
                    filters.priceLevels.includes(level)
                      ? "bg-[#f43f5e]/20 border-[#f43f5e]/60 text-white"
                      : "bg-[#0d0d0d] border-white/[0.07] text-[#4b5563]"
                  }`}
                >
                  {priceLabelMap[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <label className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider mb-2 block">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleDietary(opt)}
                  className={`px-3 py-2 rounded-full text-xs font-medium border transition-all touch-manipulation ${
                    filters.dietary.includes(opt)
                      ? "bg-[#f43f5e]/20 border-[#f43f5e]/60 text-white"
                      : "bg-[#0d0d0d] border-white/[0.07] text-[#4b5563]"
                  }`}
                >
                  {filters.dietary.includes(opt) ? "● " : "○ "}{opt}
                </button>
              ))}
            </div>
          </div>

          {/* Open Now */}
          <div className="flex items-center justify-between py-3 px-4 bg-[#0d0d0d] border border-white/[0.07] rounded-xl">
            <span className="text-white text-sm font-medium">Open Now</span>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, openNow: !prev.openNow }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                filters.openNow ? "bg-[#f43f5e]" : "bg-[#1a1a1a]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  filters.openNow ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Create button */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06]">
          <motion.button
            onClick={createSessionWithFilters}
            disabled={isLoading || filters.priceLevels.length === 0}
            className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Creating..." : "Create Session →"}
          </motion.button>
          {error && <p className="text-[#f43f5e] text-sm text-center mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  // ── LOBBY STATE ──────────────────────────────────────────────────────────────
  if (lobbyState === "lobby") {
    const isHost = currentRoom?.host_id === user?.id;
    return (
      <div className="h-full flex flex-col p-5 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
          {/* Room code */}
          <div className="text-center mb-6">
            <p className="text-[#4b5563] text-xs mb-2 uppercase tracking-wider font-medium">
              Session Code
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#0d0d0d] border border-white/[0.07] rounded-2xl">
              <span className="text-4xl font-black text-[#f43f5e] tracking-[0.3em]">{roomCode}</span>
              <button
                onClick={copyCode}
                className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center touch-manipulation"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[#4b5563] text-xs mt-2">Share this code with friends</p>
          </div>

          {/* Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">
                Members ({participants.length}/6)
              </span>
            </div>
            <div className="space-y-2">
              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-[#0d0d0d] rounded-xl border border-white/[0.07]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium flex-1">{p.name}</span>
                  {currentRoom?.host_id === p.id && (
                    <span className="text-[#f43f5e] text-xs font-medium">Host</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Start button (host only) */}
          {isHost ? (
            <>
              <motion.button
                onClick={startSwiping}
                disabled={participants.length < 2 || isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-2 shadow-lg shadow-rose-500/20 disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? "Starting..." : "Start Swiping →"}
              </motion.button>
              {participants.length < 2 && (
                <button
                  onClick={startSoloSwiping}
                  disabled={isLoading}
                  className="w-full py-3 text-[#4b5563] text-sm mb-3 touch-manipulation"
                >
                  Or swipe solo
                </button>
              )}
            </>
          ) : (
            <div className="w-full py-4 bg-[#0d0d0d] border border-white/[0.07] rounded-2xl text-center text-[#4b5563] text-sm mb-3">
              Waiting for host to start...
            </div>
          )}

          <button
            onClick={() => leaveSession().catch(console.error)}
            className="w-full py-3.5 bg-[#0d0d0d] border border-white/[0.07] text-[#6b7280] font-semibold rounded-2xl active:scale-[0.98] transition-transform touch-manipulation"
          >
            Leave Session
          </button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#f43f5e] text-sm text-center mt-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ── SWIPING STATE ────────────────────────────────────────────────────────────
  if (lobbyState === "swiping") {
    const pool = filteredRestaurants.slice(0, MAX_SWIPES);
    const currentRestaurant = pool[currentIndex];
    const nextRestaurant = pool[currentIndex + 1];
    const progress = `${currentIndex + 1}/${pool.length}`;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div>
            <p className="text-[#4b5563] text-xs">Room · {roomCode}</p>
            <p className="text-white text-sm font-semibold">
              You: {progress}
              {participants.length > 1 && (
                <span className="text-[#4b5563] text-xs ml-2">
                  · {participants.filter((p) => p.id !== user?.id).map((p) => `${p.name}: ${p.swipeCount ?? 0}/${MAX_SWIPES}`).join(" · ")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => leaveSession().catch(console.error)}
            className="px-4 py-2 bg-[#0d0d0d] border border-white/[0.07] text-[#6b7280] text-sm rounded-xl active:scale-95 transition-transform touch-manipulation"
          >
            Leave
          </button>
        </div>

        {/* Card */}
        <div className="flex-1 relative mx-4 my-3 min-h-0">
          {nextRestaurant && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-50 scale-[0.95]">
              <GroupCardContent restaurant={nextRestaurant} />
            </div>
          )}
          {currentRestaurant ? (
            <motion.div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
              <GroupCardContent restaurant={currentRestaurant} />
            </motion.div>
          ) : null}
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4">
          <motion.button
            onClick={() => handleGroupSwipe(false)}
            className="w-[60px] h-[60px] rounded-full border-2 border-white/10 bg-[#0d0d0d] flex items-center justify-center touch-manipulation"
            whileTap={{ scale: 0.88 }}
          >
            <svg className="w-6 h-6 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          <motion.button
            onClick={() => handleGroupSwipe(true)}
            className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center touch-manipulation"
            whileTap={{ scale: 0.88 }}
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

  // ── WAITING STATE ────────────────────────────────────────────────────────────
  if (lobbyState === "waiting") {
    const others = participants.filter((p) => p.id !== user?.id);
    const waitingFor = others.filter((p) => (p.swipeCount ?? 0) < MAX_SWIPES);

    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-10 h-10 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">All swiped!</h2>

          {isLoadingAI ? (
            <p className="text-[#9ca3af] text-sm">Getting AI recommendations...</p>
          ) : waitingFor.length > 0 ? (
            <>
              <p className="text-[#9ca3af] text-sm mb-6">
                Waiting for {waitingFor.length} more {waitingFor.length === 1 ? "person" : "people"}...
              </p>
              <div className="space-y-2">
                {others.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0d0d0d] rounded-xl border border-white/[0.06]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm flex-1 text-left">{p.name}</span>
                    <span className="text-[#4b5563] text-xs">{p.swipeCount ?? 0}/{MAX_SWIPES}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[#9ca3af] text-sm">Calculating your matches...</p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── RESULTS STATE ────────────────────────────────────────────────────────────
  if (lobbyState === "results") {
    const topResult = results[0];
    const otherResults = results.slice(1);

    const openInMaps = (name: string) => {
      const query = encodeURIComponent(name);
      window.open(`https://maps.google.com/?q=${query}`, "_blank");
    };

    return (
      <div className="h-full flex flex-col overflow-y-auto">
        <div className="px-5 py-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="text-4xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {topResult?.matchType === "unanimous"
                ? "Perfect Match!"
                : topResult?.matchType === "majority"
                ? "You Found a Match!"
                : "AI Pick for Your Group"}
            </h1>
            <p className="text-[#6b7280] text-sm">
              {topResult
                ? topResult.matchType === "unanimous"
                  ? "Everyone agreed on this one"
                  : topResult.matchType === "majority"
                  ? `${topResult.likedBy.length}/${participants.length} people liked this`
                  : "Based on your group's dish preferences"
                : "Here are the best options for your group"}
            </p>
          </motion.div>

          {topResult ? (
            <>
              {/* Top pick card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl overflow-hidden border border-white/[0.07] mb-4"
              >
                <div className="relative h-52">
                  <img
                    src={topResult.restaurant.image}
                    alt={topResult.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  {topResult.matchType === "unanimous" && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#10b981]/90 text-white text-xs font-bold">
                      Everyone liked this
                    </div>
                  )}
                  {topResult.matchType === "ai_suggested" && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#f43f5e]/90 text-white text-xs font-bold">
                      AI Pick
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[#0d0d0d]">
                  <h2 className="text-xl font-bold text-white mb-1">{topResult.restaurant.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-2">
                    <span className="text-amber-400">★</span>
                    <span className="text-white font-semibold">{topResult.restaurant.rating}</span>
                    <span>·</span>
                    <span>{topResult.restaurant.price}</span>
                    <span>·</span>
                    <span>{topResult.restaurant.distance}</span>
                  </div>
                  {(topResult.reason || aiReason) && (
                    <p className="text-[#9ca3af] text-xs leading-relaxed mb-3">
                      {topResult.reason || aiReason}
                    </p>
                  )}
                  {topResult.matchType !== "ai_suggested" && (
                    <p className="text-[#10b981] text-xs font-medium mb-3">
                      {topResult.likedBy.length}/{participants.length} people liked this
                    </p>
                  )}
                  <button
                    onClick={() => openInMaps(topResult.restaurant.name)}
                    className="w-full py-3 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-xl text-sm touch-manipulation"
                  >
                    Open in Maps →
                  </button>
                </div>
              </motion.div>

              {/* Other options */}
              {otherResults.length > 0 && (
                <div className="mb-4">
                  <p className="text-[#4b5563] text-xs font-medium uppercase tracking-wider mb-3">
                    Other great options
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {otherResults.map((result) => (
                      <motion.div
                        key={result.restaurant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d0d0d]"
                        onClick={() => openInMaps(result.restaurant.name)}
                      >
                        <div className="relative h-24">
                          <img
                            src={result.restaurant.image}
                            alt={result.restaurant.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-white text-xs font-semibold truncate">
                            {result.restaurant.name}
                          </p>
                          <p className="text-[#4b5563] text-xs">
                            {result.restaurant.price} · {result.likedBy.length}/{participants.length} liked
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#6b7280] text-sm">No matches found. Try again with different preferences!</p>
            </div>
          )}

          <button
            onClick={() => leaveSession().catch(console.error)}
            className="w-full py-3.5 bg-[#0d0d0d] border border-white/[0.07] text-[#6b7280] font-semibold rounded-2xl touch-manipulation mb-6"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function GroupCardContent({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="relative w-full h-full bg-[#0d0d0d]">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{restaurant.name}</h2>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <span className="text-amber-400">★</span>
          <span className="text-white font-semibold">{restaurant.rating}</span>
          <span>·</span>
          <span>{restaurant.cuisine}</span>
          <span>·</span>
          <span className="text-white/90">{restaurant.price}</span>
        </div>
      </div>
    </div>
  );
}
