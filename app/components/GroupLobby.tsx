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
      setLobbyState("waiting");
      await computeResults(updatedSwipes);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const computeResults = async (swipes: SwipeData[]) => {
    if (!currentRoom || !user) return;

    setIsLoadingAI(true);
    try {
      const supabase = createClient();
      const { data: allSwipesRaw } = await supabase
        .from("swipes")
        .select()
        .eq("room_id", currentRoom.id);

      const allSwipeData: SwipeData[] = (allSwipesRaw || []).map(
        (s: { user_id: string; restaurant_id: string; liked?: boolean; direction?: string }) => ({
          userId: s.user_id,
          restaurantId: s.restaurant_id,
          liked: s.liked ?? s.direction === "right",
        })
      );

      for (const sw of swipes) {
        if (!allSwipeData.find((s) => s.userId === sw.userId && s.restaurantId === sw.restaurantId)) {
          allSwipeData.push(sw);
        }
      }

      const userIds = participants.map((p) => p.id);
      const matchResults = calculateMatches(allSwipeData, filteredRestaurants, userIds);

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
        const { data: swipesData } = await supabase
          .from("swipes")
          .select("user_id")
          .eq("room_id", currentRoom.id);

        if (!swipesData) return;

        const countByUser: Record<string, number> = {};
        for (const s of swipesData) {
          countByUser[s.user_id] = (countByUser[s.user_id] || 0) + 1;
        }

        setParticipants((prev) =>
          prev.map((p) => ({ ...p, swipeCount: countByUser[p.id] || 0 }))
        );

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
      <div className="h-full flex flex-col items-center justify-center p-6 overflow-y-auto bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Hero icon */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              className="w-24 h-24 rounded-3xl bg-[#111] border border-[#48484a] flex items-center justify-center mb-5"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg className="w-12 h-12 text-[#FF2D55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Swipe Together</h1>
            <p className="text-[#636366] text-sm text-center leading-relaxed max-w-[260px]">
              Match with friends on where to eat. Everyone votes, the best place wins.
            </p>
          </div>

          {/* Host button */}
          <motion.button
            onClick={showFilters}
            className="w-full py-4 rounded-2xl text-white font-bold text-base mb-4 touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
              boxShadow: "0 8px 24px rgba(255,45,85,0.35)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            Host a Session
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#222]" />
            <span className="text-[#636366] text-xs font-semibold uppercase tracking-widest">or join</span>
            <div className="flex-1 h-px bg-[#222]" />
          </div>

          {/* Join code input */}
          <div className="mb-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="ABCD"
              maxLength={4}
              className="w-full bg-[#111] border border-[#48484a] rounded-2xl px-5 py-4 text-white text-center text-3xl tracking-[0.5em] font-black placeholder:text-[#333] focus:outline-none focus:border-[#FF2D55] transition-colors"
            />
          </div>
          <motion.button
            onClick={joinSession}
            disabled={joinCode.length !== 4 || isLoading}
            className="w-full py-4 bg-[#111] border border-[#48484a] text-white font-bold rounded-2xl disabled:opacity-30 active:scale-[0.98] transition-transform touch-manipulation"
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Joining..." : "Join Session"}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#FF2D55] text-sm text-center mt-4 font-medium"
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
      <div className="h-full flex flex-col bg-black overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
          <button
            onClick={() => setLobbyState("idle")}
            className="w-9 h-9 rounded-xl bg-[#111] border border-[#48484a] flex items-center justify-center touch-manipulation"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-white font-black text-lg tracking-tight">Session Setup</h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#636366]">Customize your session</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          {/* Location */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#636366] mb-3 block">
              Location
            </label>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#111] border border-[#48484a] rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-[#FF2D55]/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#FF2D55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-white/70 text-sm font-medium">Using your current location</span>
            </div>
          </div>

          {/* Radius */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#636366]">
                Search Radius
              </label>
              <span className="text-white text-sm font-black">{filters.radius} mi</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={filters.radius}
              onChange={(e) => setFilters((prev) => ({ ...prev, radius: Number(e.target.value) }))}
              className="w-full accent-[#FF2D55] h-1 rounded-full"
            />
            <div className="flex justify-between text-[#636366] text-xs mt-2 font-medium">
              <span>1 mi</span>
              <span>20 mi</span>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#636366] mb-3 block">
              Price Range
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => togglePrice(level)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all touch-manipulation ${
                    filters.priceLevels.includes(level)
                      ? "bg-[#FF2D55]/15 border-[#FF2D55]/50 text-white"
                      : "bg-[#111] border-[#48484a] text-[#636366]"
                  }`}
                >
                  {priceLabelMap[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#636366] mb-3 block">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleDietary(opt)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all touch-manipulation ${
                    filters.dietary.includes(opt)
                      ? "bg-[#FF2D55]/15 border-[#FF2D55]/50 text-white"
                      : "bg-[#111] border-[#48484a] text-[#636366]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Open Now toggle */}
          <div className="flex items-center justify-between py-4 px-4 bg-[#111] border border-[#48484a] rounded-2xl">
            <div>
              <span className="text-white text-sm font-bold">Open Now</span>
              <p className="text-[#636366] text-xs mt-0.5">Only show open restaurants</p>
            </div>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, openNow: !prev.openNow }))}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                filters.openNow ? "bg-[#FF2D55]" : "bg-[#333]"
              }`}
            >
              <motion.span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ x: filters.openNow ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Create button */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-[#1a1a1a]">
          <motion.button
            onClick={createSessionWithFilters}
            disabled={isLoading || filters.priceLevels.length === 0}
            className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-transform touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
              boxShadow: "0 8px 24px rgba(255,45,85,0.35)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Creating Room..." : "Create Session →"}
          </motion.button>
          {error && <p className="text-[#FF2D55] text-sm text-center mt-3 font-medium">{error}</p>}
        </div>
      </div>
    );
  }

  // ── LOBBY STATE ──────────────────────────────────────────────────────────────
  if (lobbyState === "lobby") {
    const isHost = currentRoom?.host_id === user?.id;
    return (
      <div className="h-full flex flex-col bg-black overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 px-5 py-6">

          {/* Room code hero */}
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#636366] mb-3">
              Session Code
            </p>
            <div className="inline-flex flex-col items-center gap-3 px-8 py-5 bg-[#111] border border-[#48484a] rounded-3xl">
              <span
                className="font-black text-white tracking-[0.4em]"
                style={{ fontSize: "48px", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}
              >
                {roomCode}
              </span>
              <button
                onClick={copyCode}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all touch-manipulation ${
                  copied
                    ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                    : "bg-[#1a1a1a] border-[#48484a] text-[#636366]"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <p className="text-[#636366] text-xs mt-3 font-medium">Share this code with your friends</p>
          </div>

          {/* Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#636366]">
                Members
              </p>
              <span className="text-xs font-black text-white bg-[#1a1a1a] border border-[#48484a] px-2 py-0.5 rounded-full">
                {participants.length}/6
              </span>
            </div>
            <div className="space-y-2">
              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3.5 bg-[#111] rounded-2xl border border-[#48484a]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FF2D55] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-bold flex-1">{p.name}</span>
                  {currentRoom?.host_id === p.id && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF2D55] bg-[#FF2D55]/10 border border-[#FF2D55]/30 px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isHost ? (
            <>
              <motion.button
                onClick={startSwiping}
                disabled={participants.length < 2 || isLoading}
                className="w-full py-4 rounded-2xl text-white font-bold mb-2 disabled:opacity-30 active:scale-[0.98] transition-transform touch-manipulation"
                style={{
                  background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
                  boxShadow: "0 8px 24px rgba(255,45,85,0.35)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? "Starting..." : "Start Swiping →"}
              </motion.button>
              {participants.length < 2 && (
                <button
                  onClick={startSoloSwiping}
                  disabled={isLoading}
                  className="w-full py-3 text-[#636366] text-sm font-medium mb-3 touch-manipulation"
                >
                  Or swipe solo
                </button>
              )}
            </>
          ) : (
            <div className="w-full py-4 bg-[#111] border border-[#48484a] rounded-2xl text-center text-[#636366] text-sm font-medium mb-3">
              Waiting for host to start...
            </div>
          )}

          <button
            onClick={() => leaveSession().catch(console.error)}
            className="w-full py-3.5 bg-[#111] border border-[#48484a] text-[#636366] font-bold rounded-2xl active:scale-[0.98] transition-transform touch-manipulation"
          >
            Leave Session
          </button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#FF2D55] text-sm text-center mt-3 font-medium"
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
      <div className="h-full flex flex-col bg-black">
        {/* Swiping header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#636366]">
              Room · {roomCode}
            </p>
            <p className="text-white text-sm font-black">
              {progress}
              {participants.length > 1 && (
                <span className="text-[#636366] text-xs font-medium ml-2">
                  · {participants.filter((p) => p.id !== user?.id).map((p) => `${p.name}: ${p.swipeCount ?? 0}/${MAX_SWIPES}`).join(" · ")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => leaveSession().catch(console.error)}
            className="px-3 py-1.5 bg-[#111] border border-[#48484a] text-[#636366] text-xs font-bold rounded-xl active:scale-95 transition-transform touch-manipulation"
          >
            Leave
          </button>
        </div>

        {/* Card */}
        <div className="flex-1 relative my-3 min-h-0">
          {nextRestaurant && (
            <div className="absolute inset-0 overflow-hidden opacity-50 scale-[0.95]">
              <GroupCardContent restaurant={nextRestaurant} />
            </div>
          )}
          {currentRestaurant ? (
            <motion.div className="absolute inset-0 overflow-hidden shadow-2xl">
              <GroupCardContent restaurant={currentRestaurant} />
            </motion.div>
          ) : null}
        </div>

        {/* Swipe buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-6 py-4 px-8">
          <motion.button
            onClick={() => handleGroupSwipe(false)}
            className="w-14 h-14 rounded-full border border-[#333] bg-[#111] flex items-center justify-center touch-manipulation"
            whileTap={{ scale: 0.88 }}
          >
            <svg className="w-6 h-6 text-[#636366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          <motion.button
            onClick={() => handleGroupSwipe(true)}
            className="w-16 h-16 rounded-full flex items-center justify-center touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
              boxShadow: "0 8px 30px rgba(255,45,85,0.45)",
            }}
            whileTap={{ scale: 0.88 }}
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
      <div className="h-full flex flex-col items-center justify-center p-6 bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl bg-[#111] border border-[#48484a] flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-10 h-10 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">All done!</h2>

          {isLoadingAI ? (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-[#636366] text-sm font-medium">Getting AI recommendations...</p>
            </div>
          ) : waitingFor.length > 0 ? (
            <>
              <p className="text-[#636366] text-sm mb-6 font-medium">
                Waiting for {waitingFor.length} more {waitingFor.length === 1 ? "person" : "people"}
              </p>
              <div className="space-y-2">
                {others.map((p) => {
                  const done = (p.swipeCount ?? 0) >= MAX_SWIPES;
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-[#111] rounded-2xl border border-[#48484a]">
                      <div className="w-8 h-8 rounded-full bg-[#FF2D55] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-bold flex-1 text-left">{p.name}</span>
                      {done ? (
                        <svg className="w-4 h-4 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-[#636366] text-xs font-bold">{p.swipeCount ?? 0}/{MAX_SWIPES}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-[#636366] text-sm font-medium mt-2">Calculating your matches...</p>
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
      <div className="h-full flex flex-col overflow-y-auto bg-black">
        <div className="px-5 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            {/* Celebration icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-3xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              {topResult?.matchType === "unanimous"
                ? "Perfect Match!"
                : topResult?.matchType === "majority"
                ? "You Found a Match!"
                : "AI Pick for Your Group"}
            </h1>
            <p className="text-[#636366] text-sm font-medium">
              {topResult
                ? topResult.matchType === "unanimous"
                  ? "Everyone agreed on this one"
                  : topResult.matchType === "majority"
                  ? `${topResult.likedBy.length}/${participants.length} people liked this`
                  : "Based on your group's preferences"
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
                className="rounded-3xl overflow-hidden border border-[#48484a] mb-4"
              >
                <div className="relative h-52">
                  <img
                    src={topResult.restaurant.image}
                    alt={topResult.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  {topResult.matchType === "unanimous" && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#30D158] text-white text-[10px] font-black uppercase tracking-widest">
                      Everyone liked this
                    </div>
                  )}
                  {topResult.matchType === "ai_suggested" && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#FF2D55] text-white text-[10px] font-black uppercase tracking-widest">
                      AI Pick
                    </div>
                  )}
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                      {topResult.restaurant.name}
                    </h2>
                  </div>
                </div>
                <div className="p-4 bg-[#111]">
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white font-black">{topResult.restaurant.rating}</span>
                    <span className="text-[#48484a]">·</span>
                    <span className="text-[#636366] font-medium">{topResult.restaurant.price}</span>
                    <span className="text-[#48484a]">·</span>
                    <span className="text-[#636366] font-medium">{topResult.restaurant.distance}</span>
                  </div>
                  {(topResult.reason || aiReason) && (
                    <p className="text-[#636366] text-xs leading-relaxed mb-3 font-medium">
                      {topResult.reason || aiReason}
                    </p>
                  )}
                  {topResult.matchType !== "ai_suggested" && (
                    <p className="text-[#30D158] text-xs font-bold mb-3 uppercase tracking-wide">
                      {topResult.likedBy.length}/{participants.length} people liked this
                    </p>
                  )}
                  <button
                    onClick={() => openInMaps(topResult.restaurant.name)}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm touch-manipulation"
                    style={{
                      background: "linear-gradient(135deg, #FF2D55 0%, #FF6B6B 100%)",
                      boxShadow: "0 6px 20px rgba(255,45,85,0.35)",
                    }}
                  >
                    Open in Maps →
                  </button>
                </div>
              </motion.div>

              {/* Other options */}
              {otherResults.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#636366] mb-3">
                    Other great options
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {otherResults.map((result) => (
                      <motion.div
                        key={result.restaurant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden border border-[#48484a] bg-[#111] cursor-pointer active:scale-[0.98] transition-transform"
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
                          <p className="text-white text-xs font-black truncate">
                            {result.restaurant.name}
                          </p>
                          <p className="text-[#636366] text-xs font-medium">
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
              <p className="text-[#636366] text-sm font-medium">No matches found. Try again with different preferences!</p>
            </div>
          )}

          <button
            onClick={() => leaveSession().catch(console.error)}
            className="w-full py-4 bg-[#111] border border-[#48484a] text-[#636366] font-bold rounded-2xl touch-manipulation mb-6 active:scale-[0.98] transition-transform"
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
    <div className="relative w-full h-full bg-[#111]">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {restaurant.vibes?.[0] && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF2D55] mb-1 block">
            {restaurant.vibes[0]}
          </span>
        )}
        <h2 className="text-[26px] font-black text-white tracking-tight leading-tight mb-2">
          {restaurant.name}
        </h2>
        <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
          <span className="text-yellow-400">★</span>
          <span className="text-white font-bold">{restaurant.rating}</span>
          <span className="text-[#48484a]">·</span>
          <span>{restaurant.price}</span>
          <span className="text-[#48484a]">·</span>
          <span>{restaurant.cuisine}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map((tag) => (
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
