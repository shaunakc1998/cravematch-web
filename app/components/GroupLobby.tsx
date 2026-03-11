"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  getRoomParticipants,
  leaveRoom,
  Room as SupabaseRoom,
  Participant as SupabaseParticipant,
  Match as SupabaseMatch,
} from "../lib/roomService";
import SwipeDeck from "./SwipeDeck";

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

/* ── Shared styling tokens ─────────────────────────────────── */
const BG      = "#F7F6F2";
const SURFACE = "#FFFFFF";
const GREEN   = "#16A34A";
const GREEN_L = "#DCFCE7";
const ORANGE  = "#EA580C";
const BORDER  = "#E2DFD8";
const TEXT    = "#1C1917";
const MUTED   = "#78716C";
const LIGHT   = "#A8A29E";

export default function GroupLobby() {
  const { user } = useAuth();
  const [lobbyState,          setLobbyState]          = useState<LobbyState>("idle");
  const [roomCode,            setRoomCode]             = useState("");
  const [joinCode,            setJoinCode]             = useState("");
  const [participants,        setParticipants]         = useState<Participant[]>([]);
  const [currentRoom,         setCurrentRoom]          = useState<SupabaseRoom | null>(null);
  const [error,               setError]                = useState("");
  const [isLoading,           setIsLoading]            = useState(false);
  const [filters,             setFilters]              = useState<SessionFilters>(DEFAULT_FILTERS);
  const [filteredRestaurants, setFilteredRestaurants]  = useState<Restaurant[]>(allRestaurants);

  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [mySwipes,      setMySwipes]      = useState<SwipeData[]>([]);
  const currentIndexRef = useRef(0);

  const [results,       setResults]       = useState<MatchResult[]>([]);
  const [aiReason,      setAiReason]      = useState<string>("");
  const [isLoadingAI,   setIsLoadingAI]   = useState(false);
  const [copied,        setCopied]        = useState(false);

  const roomSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "You";

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const applyFilters = (f: SessionFilters): Restaurant[] =>
    allRestaurants.filter((r) => {
      if (!f.priceLevels.includes(r.priceLevel)) return false;
      if (f.openNow && !r.isOpen) return false;
      if (f.dietary.length > 0 && !f.dietary.every((d) => r.dietary.includes(d))) return false;
      return true;
    });

  const showFilters = () => setLobbyState("filters");

  const createSessionWithFilters = async () => {
    if (!user) { setError("Please log in to host a session"); return; }
    setIsLoading(true);
    try {
      const { room, error: roomError } = await createRoom(user.id, userName);
      if (roomError || !room) { setError(roomError || "Failed to create room"); setIsLoading(false); return; }
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

  const joinSession = async () => {
    if (!user) { setError("Please log in to join"); return; }
    if (joinCode.length !== 4) { setError("Enter a 4-letter code"); return; }
    setIsLoading(true);
    try {
      const { room, error: joinError } = await joinRoom(joinCode, user.id, userName);
      if (joinError || !room) { setError(joinError || "Room not found"); setIsLoading(false); return; }
      setCurrentRoom(room);
      setRoomCode(room.code);
      setLobbyState("lobby");
      setError("");
      const existingParticipants = await getRoomParticipants(room.id);
      setParticipants(existingParticipants.map((p) => ({ id: p.user_id, name: p.name, isReady: p.is_ready })));
    } catch (err) {
      setError("Failed to join. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentRoom) return;
    if (roomSubscriptionRef.current) unsubscribeFromRoom(roomSubscriptionRef.current);
    roomSubscriptionRef.current = subscribeToRoom(
      currentRoom.id,
      (updatedParticipants: SupabaseParticipant[]) => {
        setParticipants(updatedParticipants.map((p) => ({ id: p.user_id, name: p.name, isReady: p.is_ready })));
      },
      (updatedRoom: SupabaseRoom) => {
        setCurrentRoom(updatedRoom);
        if (updatedRoom.status === "active" && lobbyState === "lobby") {
          setLobbyState("swiping");
          setCurrentIndex(0);
          setMySwipes([]);
        }
      },
      (_match: SupabaseMatch) => {}
    );
    return () => {
      if (roomSubscriptionRef.current) { unsubscribeFromRoom(roomSubscriptionRef.current); roomSubscriptionRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  useEffect(() => {
    if (!currentRoom || lobbyState !== "lobby") return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRoomParticipants(currentRoom.id);
        setParticipants(updated.map((p) => ({ id: p.user_id, name: p.name, isReady: p.is_ready })));
      } catch (err) { console.error(err); }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentRoom, lobbyState]);

  useEffect(() => {
    if (!currentRoom || lobbyState !== "lobby") return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.from("rooms").select().eq("id", currentRoom.id).single();
        if (data && data.status === "active") {
          setCurrentRoom(data);
          setLobbyState("swiping");
          setCurrentIndex(0);
          setMySwipes([]);
        }
      } catch (err) { console.error(err); }
    }, 1500);
    return () => clearInterval(interval);
  }, [currentRoom, lobbyState]);

  const startSwiping = async () => {
    if (!currentRoom || !user) return;
    if (participants.length < 2) { setError("Need at least 2 people to start"); return; }
    if (currentRoom.host_id !== user.id) { setError("Only the host can start"); return; }
    setIsLoading(true);
    try {
      const { success, error: startError } = await startSession(currentRoom.id, user.id);
      if (!success || startError) { setError(startError || "Failed to start"); setIsLoading(false); return; }
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

  const startSoloSwiping = async () => {
    if (!currentRoom || !user || currentRoom.host_id !== user.id) return;
    setIsLoading(true);
    try {
      await startSession(currentRoom.id, user.id);
      setLobbyState("swiping");
      setCurrentIndex(0);
      setMySwipes([]);
      setError("");
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };


  const computeResults = async (swipes: SwipeData[]) => {
    if (!currentRoom || !user) return;
    setIsLoadingAI(true);
    try {
      const supabase = createClient();
      const { data: allSwipesRaw } = await supabase.from("swipes").select().eq("room_id", currentRoom.id);
      const allSwipeData: SwipeData[] = (allSwipesRaw || []).map(
        (s: { user_id: string; restaurant_id: string; liked?: boolean; direction?: string }) => ({
          userId: s.user_id, restaurantId: s.restaurant_id, liked: s.liked ?? s.direction === "right",
        })
      );
      for (const sw of swipes) {
        if (!allSwipeData.find((s) => s.userId === sw.userId && s.restaurantId === sw.restaurantId))
          allSwipeData.push(sw);
      }
      const userIds = participants.map((p) => p.id);
      const matchResults = calculateMatches(allSwipeData, filteredRestaurants, userIds);
      if (matchResults.length > 0) {
        try {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ swipes: allSwipeData, restaurants: filteredRestaurants, members: participants.map((p) => ({ id: p.id, name: p.name })) }),
          });
          if (res.ok) {
            const aiData = await res.json();
            if (aiData.topPick?.reason) {
              setAiReason(aiData.topPick.reason);
              if (aiData.topPick.restaurantId !== matchResults[0]?.restaurant.id) {
                const aiRestaurant = filteredRestaurants.find((r) => r.id === aiData.topPick.restaurantId);
                if (aiRestaurant) {
                  matchResults.unshift({
                    restaurant: aiRestaurant,
                    score: matchResults[0]?.score ?? 0.5,
                    likedBy: allSwipeData.filter((s) => s.restaurantId === aiRestaurant.id && s.liked).map((s) => s.userId),
                    matchType: "ai_suggested",
                    reason: aiData.topPick.reason,
                  });
                }
              } else {
                matchResults[0].reason = aiData.topPick.reason;
              }
            }
          }
        } catch (aiErr) { console.error("AI failed:", aiErr); }
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

  useEffect(() => {
    if (!currentRoom || lobbyState !== "waiting") return;
    const supabase = createClient();
    const interval = setInterval(async () => {
      try {
        const { data: swipesData } = await supabase.from("swipes").select("user_id").eq("room_id", currentRoom.id);
        if (!swipesData) return;
        const countByUser: Record<string, number> = {};
        for (const s of swipesData) countByUser[s.user_id] = (countByUser[s.user_id] || 0) + 1;
        setParticipants((prev) => prev.map((p) => ({ ...p, swipeCount: countByUser[p.id] || 0 })));
        const allDone = participants.every((p) => (countByUser[p.id] || 0) >= MAX_SWIPES);
        if (allDone && participants.length > 0) await computeResults(mySwipes);
      } catch (err) { console.error(err); }
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom, lobbyState, participants]);

  const leaveSession = async () => {
    if (roomSubscriptionRef.current) { unsubscribeFromRoom(roomSubscriptionRef.current); roomSubscriptionRef.current = null; }
    if (currentRoom && user) {
      try { await leaveRoom(currentRoom.id, user.id); } catch (err) { console.error(err); }
    }
    setLobbyState("idle");
    setCurrentRoom(null);
    setRoomCode("");
    setJoinCode("");
    setParticipants([]);
    setResults([]);
    setAiReason("");
    setError("");
    setCurrentIndex(0);
    setMySwipes([]);
    setFilters(DEFAULT_FILTERS);
    setFilteredRestaurants(allRestaurants);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const isHost = currentRoom?.host_id === user?.id;

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */

  // ── SWIPING STATE (reuse SwipeDeck) ─────────────────────
  if (lobbyState === "swiping") {
    const pool = filteredRestaurants.slice(0, MAX_SWIPES);
    return (
      <div className="h-full flex flex-col" style={{ background: BG }}>
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>
              Group Session · {roomCode}
            </p>
            <p className="text-sm font-semibold" style={{ color: TEXT }}>
              {currentIndex}/{Math.min(pool.length, MAX_SWIPES)} swiped
            </p>
          </div>
          <button
            onClick={leaveSession}
            className="btn btn-sm btn-ghost"
            style={{ color: MUTED }}
          >
            Leave
          </button>
        </div>

        {/* Swipe deck */}
        <div className="flex-1 min-h-0">
          <SwipeDeck
            filteredRestaurants={pool}
            sessionId={currentRoom?.id}
            maxSwipes={MAX_SWIPES}
            onComplete={(swipes) => {
              setMySwipes(swipes);
              setLobbyState("waiting");
              computeResults(swipes);
            }}
          />
        </div>
      </div>
    );
  }

  // ── WAITING STATE ──────────────────────────────────────
  if (lobbyState === "waiting") {
    return (
      <div
        className="h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ background: BG }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xs w-full"
        >
          {/* Animated spinner */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 rounded-full border-4"
                style={{ borderColor: GREEN_L, borderTopColor: GREEN }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🍽️
              </div>
            </div>
          </div>

          <h2 className="text-xl font-black mb-2" style={{ color: TEXT, letterSpacing: "-0.02em" }}>
            {isLoadingAI ? "Finding the best match…" : "Waiting for the group…"}
          </h2>
          <p className="text-sm mb-6" style={{ color: MUTED }}>
            {isLoadingAI
              ? "AI is analyzing everyone's preferences"
              : "Hang tight while others finish swiping"
            }
          </p>

          {/* Participant progress */}
          <div className="space-y-2.5">
            {participants.map((p) => {
              const count = p.swipeCount ?? (p.id === user?.id ? mySwipes.length : 0);
              const pct   = Math.min(100, Math.round((count / MAX_SWIPES) * 100));
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: GREEN }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>
                        {p.name} {p.id === user?.id && "(you)"}
                      </span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: pct === 100 ? GREEN : LIGHT }}>
                      {pct === 100 ? "Done ✓" : `${count}/${MAX_SWIPES}`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2DFD8" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: pct === 100 ? GREEN : "#86EFAC" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── RESULTS STATE ─────────────────────────────────────
  if (lobbyState === "results") {
    return (
      <div className="h-full flex flex-col" style={{ background: BG }}>
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 border-b"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <h2 className="text-xl font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>
            🎉 Group Results
          </h2>
          <p className="text-xs mt-0.5" style={{ color: LIGHT }}>
            Based on {participants.length} people swiping
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar space-y-3">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="text-4xl mb-3">😔</div>
              <h3 className="text-lg font-black mb-1" style={{ color: TEXT }}>No group matches</h3>
              <p className="text-sm" style={{ color: MUTED }}>
                No one agreed on a place. Try swiping again with different restaurants!
              </p>
            </div>
          ) : (
            results.map((result, i) => {
              const matchBadge =
                result.matchType === "unanimous"
                  ? { label: "Everyone agreed!", bg: GREEN_L, color: GREEN }
                  : result.matchType === "majority"
                  ? { label: `${result.likedBy.length} people liked`, bg: "#FFEDD5", color: ORANGE }
                  : { label: "🤖 AI Pick", bg: "#E0F2FE", color: "#0369A1" };
              return (
                <motion.div
                  key={result.restaurant.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(28,25,23,0.06)" }}
                >
                  {/* Photo */}
                  <div className="relative h-40">
                    <img
                      src={result.restaurant.image}
                      alt={result.restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }}
                    />
                    {/* Rank badge */}
                    <div
                      className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{ background: i === 0 ? "#F59E0B" : "rgba(0,0,0,0.5)" }}
                    >
                      {i === 0 ? "🥇" : i === 1 ? "2" : "3"}
                    </div>
                    <span
                      className="absolute bottom-3 left-3 badge"
                      style={{ background: matchBadge.bg, color: matchBadge.color }}
                    >
                      {matchBadge.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-black text-lg mb-1" style={{ color: TEXT, letterSpacing: "-0.015em" }}>
                      {result.restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm mb-2" style={{ color: MUTED }}>
                      <span>★ {result.restaurant.rating}</span>
                      <span>·</span>
                      <span>{result.restaurant.cuisine}</span>
                      <span>·</span>
                      <span>{result.restaurant.price}</span>
                      <span>·</span>
                      <span>{result.restaurant.distance}</span>
                    </div>
                    {(result.reason || (i === 0 && aiReason)) && (
                      <div
                        className="p-3 rounded-xl text-xs leading-relaxed"
                        style={{ background: "#F3F1EC", color: MUTED }}
                      >
                        🤖 {result.reason || aiReason}
                      </div>
                    )}
                    <motion.button
                      className="btn btn-outline btn-full mt-3"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.restaurant.name)}`,
                          "_blank"
                        )
                      }
                      whileTap={{ scale: 0.97 }}
                    >
                      Open in Maps ↗
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Done button */}
          <motion.button
            className="btn btn-ghost btn-full mt-2"
            onClick={leaveSession}
            style={{ color: MUTED }}
            whileTap={{ scale: 0.97 }}
          >
            Done — Leave Session
          </motion.button>
        </div>
      </div>
    );
  }

  /* ── FILTERS STATE ──────────────────────────────────── */
  if (lobbyState === "filters") {
    return (
      <div className="h-full flex flex-col" style={{ background: BG }}>
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 border-b flex items-center gap-3"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <button
            onClick={() => setLobbyState("idle")}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F3F1EC" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: MUTED }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>Session Filters</h2>
            <p className="text-xs" style={{ color: LIGHT }}>Set preferences for your group</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar space-y-6">
          {/* Price */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: TEXT }}>Price Range</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map((level) => {
                const selected = filters.priceLevels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => setFilters((f) => ({
                      ...f,
                      priceLevels: selected
                        ? f.priceLevels.filter((p) => p !== level)
                        : [...f.priceLevels, level],
                    }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: selected ? GREEN_L : SURFACE,
                      color:      selected ? GREEN   : MUTED,
                      border:     selected ? `1.5px solid #86EFAC` : `1.5px solid ${BORDER}`,
                    }}
                  >
                    {"$".repeat(level)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: TEXT }}>Dietary Options</p>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((option) => {
                const selected = filters.dietary.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => setFilters((f) => ({
                      ...f,
                      dietary: selected ? f.dietary.filter((d) => d !== option) : [...f.dietary, option],
                    }))}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                    style={{
                      background: selected ? GREEN_L : SURFACE,
                      color:      selected ? GREEN   : MUTED,
                      border:     selected ? `1.5px solid #86EFAC` : `1.5px solid ${BORDER}`,
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open Now */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: TEXT }}>Open Now</p>
              <p className="text-xs" style={{ color: LIGHT }}>Only show open restaurants</p>
            </div>
            <button
              onClick={() => setFilters((f) => ({ ...f, openNow: !f.openNow }))}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: filters.openNow ? GREEN : "#E2DFD8" }}
            >
              <motion.div
                animate={{ x: filters.openNow ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 600, damping: 32 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
              />
            </button>
          </div>

          <motion.button
            onClick={createSessionWithFilters}
            disabled={isLoading}
            className="btn btn-primary btn-lg btn-full"
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                Creating room…
              </span>
            ) : "Create Room →"}
          </motion.button>
        </div>
      </div>
    );
  }

  /* ── LOBBY STATE ────────────────────────────────────── */
  if (lobbyState === "lobby") {
    return (
      <div className="h-full flex flex-col" style={{ background: BG }}>
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 border-b"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>Waiting Room</h2>
              <p className="text-xs mt-0.5" style={{ color: LIGHT }}>
                {isHost ? "Share the code to invite friends" : "Waiting for host to start…"}
              </p>
            </div>
            <button onClick={leaveSession} className="btn btn-sm btn-ghost" style={{ color: MUTED }}>Leave</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar space-y-5">
          {/* Room code */}
          <div
            className="p-5 rounded-2xl text-center"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: LIGHT }}>Room Code</p>
            <div
              className="text-4xl font-black tracking-[0.3em] mb-3"
              style={{ color: TEXT, fontFamily: "monospace" }}
            >
              {roomCode}
            </div>
            <button
              onClick={copyCode}
              className="btn btn-outline btn-sm"
            >
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>

          {/* Participants */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: TEXT }}>
              Participants ({participants.length})
            </p>
            <div className="space-y-2">
              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: p.id === currentRoom?.host_id ? ORANGE : GREEN }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: TEXT }}>
                      {p.name} {p.id === user?.id && <span style={{ color: LIGHT }}>(you)</span>}
                    </p>
                    <p className="text-xs" style={{ color: LIGHT }}>
                      {p.id === currentRoom?.host_id ? "Host" : "Guest"}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: GREEN }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-center"
              style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626" }}
            >
              {error}
            </div>
          )}

          {/* Host controls */}
          {isHost && (
            <div className="space-y-2.5">
              <motion.button
                onClick={startSwiping}
                disabled={isLoading || participants.length < 2}
                className="btn btn-primary btn-lg btn-full"
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                    Starting…
                  </span>
                ) : participants.length < 2
                  ? `Waiting for guests… (${participants.length}/2)`
                  : `Start Session (${participants.length} people) →`
                }
              </motion.button>
              <motion.button
                onClick={startSoloSwiping}
                disabled={isLoading}
                className="btn btn-ghost btn-full text-sm"
                style={{ color: MUTED }}
                whileTap={{ scale: 0.97 }}
              >
                Solo mode (no waiting)
              </motion.button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── IDLE STATE (home) ─────────────────────────────── */
  return (
    <div className="h-full flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-5 border-b"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <h2 className="text-xl font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>Group Mode</h2>
        <p className="text-sm mt-0.5" style={{ color: MUTED }}>
          Swipe together, decide together.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar">
        {/* How it works */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: LIGHT }}>
            How it works
          </p>
          <div className="space-y-2.5">
            {[
              { step: "1", icon: "🏠", title: "Host creates a room", desc: "Get a 4-letter code to share" },
              { step: "2", icon: "📲", title: "Friends join", desc: "They enter the code on their device" },
              { step: "3", icon: "👆", title: "Everyone swipes", desc: "Swipe right on places you like" },
              { step: "4", icon: "🎯", title: "See the match", desc: "AI finds what the group agrees on" },
            ].map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "#F3F1EC" }}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: TEXT }}>{title}</p>
                  <p className="text-xs" style={{ color: LIGHT }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action cards */}
        <div className="space-y-3">
          <motion.button
            onClick={showFilters}
            className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #DCFCE7 0%, #ECFDF5 100%)",
              border: "1.5px solid #86EFAC",
              boxShadow: "0 4px 16px rgba(22,163,74,0.12)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "#FFFFFF" }}
            >
              🏠
            </div>
            <div>
              <p className="font-black text-base" style={{ color: TEXT, letterSpacing: "-0.01em" }}>Host a session</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>Create a room and invite friends</p>
            </div>
            <svg className="ml-auto w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: GREEN }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>

          {/* Join section */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "#FFEDD5" }}
              >
                📲
              </div>
              <div>
                <p className="font-black text-base" style={{ color: TEXT, letterSpacing: "-0.01em" }}>Join a session</p>
                <p className="text-xs" style={{ color: MUTED }}>Enter the code from your host</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 4));
                  setError("");
                }}
                placeholder="ABCD"
                maxLength={4}
                className="input flex-1 text-center font-black tracking-[0.25em] uppercase"
                style={{ fontFamily: "monospace", fontSize: "1.1rem" }}
              />
              <motion.button
                onClick={joinSession}
                disabled={isLoading || joinCode.length !== 4}
                className="btn btn-orange"
                whileTap={{ scale: 0.96 }}
              >
                {isLoading ? (
                  <span className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                ) : "Join"}
              </motion.button>
            </div>

            {error && (
              <p className="text-xs text-center font-semibold" style={{ color: "#DC2626" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
