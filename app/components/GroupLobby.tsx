"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthContext";
import { restaurants, Restaurant } from "../data/restaurants";
import { createClient } from "../lib/supabase";
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
  startSession,
  recordSwipe,
  getRoomParticipants,
  getRoomMatches,
  checkConsensus,
  createMatch,
  leaveRoom,
  Room as SupabaseRoom,
  Participant as SupabaseParticipant,
  Match as SupabaseMatch
} from "../lib/roomService";

type SessionState = "idle" | "waiting" | "swiping" | "matched";

interface Participant {
  id: string;
  name: string;
  isReady: boolean;
}

export default function GroupLobby() {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedRestaurant, setMatchedRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState("");
  const [currentRoom, setCurrentRoom] = useState<SupabaseRoom | null>(null);
  const roomSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const currentIndexRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  // Keep ref in sync with state so polling closures always see latest value
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "You";

  // Host a new session
  const hostSession = async () => {
    if (!user) {
      setError("Please log in to host a session");
      return;
    }

    setIsLoading(true);
    try {
      const { room, error: roomError } = await createRoom(user.id, userName);
      
      if (roomError) {
        setError(roomError);
        setIsLoading(false);
        return;
      }

      if (room) {
        setCurrentRoom(room);
        setRoomCode(room.code);
        setParticipants([{ id: user.id, name: userName, isReady: true }]);
        setSessionState("waiting");
        setError("");
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing session
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
      
      if (joinError) {
        setError(joinError);
        setIsLoading(false);
        return;
      }

      if (room) {
        setCurrentRoom(room);
        setRoomCode(room.code);
        setSessionState("waiting");
        setError("");
        
        // Fetch existing participants immediately
        const existingParticipants = await getRoomParticipants(room.id);
        const formattedParticipants = existingParticipants.map(p => ({
          id: p.user_id,
          name: p.name,
          isReady: p.is_ready
        }));
        setParticipants(formattedParticipants);
      }
    } catch (err) {
      setError("Failed to join room. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription — depends on room ID only to prevent re-subscription
  // every time the room object is updated by polling
  useEffect(() => {
    if (!currentRoom) return;

    if (roomSubscriptionRef.current) {
      unsubscribeFromRoom(roomSubscriptionRef.current);
    }

    roomSubscriptionRef.current = subscribeToRoom(
      currentRoom.id,
      (updatedParticipants: SupabaseParticipant[]) => {
        setParticipants(updatedParticipants.map(p => ({
          id: p.user_id,
          name: p.name,
          isReady: p.is_ready
        })));
      },
      (updatedRoom: SupabaseRoom) => {
        setCurrentRoom(updatedRoom);
        if (updatedRoom.status === "active") {
          setSessionState("swiping");
        }
      },
      (match: SupabaseMatch) => {
        const matched = restaurants.find(r => r.id === match.restaurant_id);
        if (matched) {
          setMatchedRestaurant(matched);
          setSessionState("matched");
        }
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

  // Fetch participants periodically as fallback
  useEffect(() => {
    if (!currentRoom || sessionState !== "waiting") return;

    const interval = setInterval(async () => {
      try {
        const updatedParticipants = await getRoomParticipants(currentRoom.id);
        const formattedParticipants = updatedParticipants.map(p => ({
          id: p.user_id,
          name: p.name,
          isReady: p.is_ready
        }));
        setParticipants(formattedParticipants);
      } catch (err) {
        console.error("Error polling participants:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentRoom, sessionState]);

  // Poll room status as fallback for real-time — only needed while waiting
  useEffect(() => {
    if (!currentRoom || sessionState !== "waiting") return;

    const supabase = createClient();

    const interval = setInterval(async () => {
      try {
        const { data: updatedRoom, error } = await supabase
          .from("rooms")
          .select()
          .eq("id", currentRoom.id)
          .single();

        if (error) {
          console.error("Error polling room status:", error);
          return;
        }

        if (updatedRoom && updatedRoom.status !== currentRoom.status) {
          setCurrentRoom(updatedRoom);
          if (updatedRoom.status === "active" && sessionState === "waiting") {
            setSessionState("swiping");
          }
        }
      } catch (err) {
        console.error("Error polling room status:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom, sessionState]);

  // Poll for matches and check consensus
  useEffect(() => {
    if (!currentRoom || sessionState !== "swiping") return;

    const interval = setInterval(async () => {
      try {
        // Check for existing matches
        const matches = await getRoomMatches(currentRoom.id);
        if (matches.length > 0) {
          const matched = restaurants.find(r => r.id === matches[0].restaurant_id);
          if (matched) {
            setMatchedRestaurant(matched);
            setSessionState("matched");
            return;
          }
        }

        // Check for consensus on current restaurant (use ref to avoid stale closure)
        const currentRestaurant = restaurants[currentIndexRef.current];
        if (currentRestaurant) {
          const hasConsensus = await checkConsensus(currentRoom.id, currentRestaurant.id);
          if (hasConsensus) {
            const { success } = await createMatch(currentRoom.id, currentRestaurant.id);
            if (success) {
              setMatchedRestaurant(currentRestaurant);
              setSessionState("matched");
            }
          }
        }
      } catch (err) {
        console.error("Error polling matches:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom, sessionState]);

  // Start swiping (host only)
  const startSwiping = async () => {
    if (participants.length < 2) {
      setError("Need at least 2 people to start!");
      return;
    }

    if (!currentRoom || !user) {
      setError("Room or user not found");
      return;
    }

    // Only host can start
    if (currentRoom.host_id !== user.id) {
      setError("Only the host can start the session");
      return;
    }

    setIsLoading(true);
    try {
      // Call startSession to update database
      const { success, error: startError } = await startSession(currentRoom.id, user.id);
      
      if (!success || startError) {
        setError(startError || "Failed to start session");
        setIsLoading(false);
        return;
      }

      // Update local state
      setSessionState("swiping");
      setCurrentIndex(0);
      setError("");
    } catch (err) {
      setError("Failed to start swiping session");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle swipe
  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentRoom || !user) {
      setError("Room or user not found");
      return;
    }

    const restaurant = restaurants[currentIndex];
    
    // Record swipe to database
    try {
      const { success, error: swipeError } = await recordSwipe(
        currentRoom.id,
        user.id,
        restaurant.id,
        direction
      );

      if (!success || swipeError) {
        console.error("Failed to record swipe:", swipeError);
      } else {
        console.log(`Swipe recorded: ${direction} on ${restaurant.name}`);
      }
    } catch (err) {
      console.error("Error recording swipe:", err);
    }

    setCurrentIndex(prev => prev < restaurants.length - 1 ? prev + 1 : 0);
  };

  // Leave session
  const leaveSession = async () => {
    if (roomSubscriptionRef.current) {
      unsubscribeFromRoom(roomSubscriptionRef.current);
      roomSubscriptionRef.current = null;
    }
    if (currentRoom && user) {
      await leaveRoom(currentRoom.id, user.id);
    }
    setSessionState("idle");
    setRoomCode("");
    setJoinCode("");
    setParticipants([]);
    setCurrentIndex(0);
    setMatchedRestaurant(null);
    setError("");
    setCurrentRoom(null);
  };

  // IDLE STATE
  if (sessionState === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center"
        >
          {/* Hero Icon */}
          <motion.div
            className="relative w-24 h-24 mx-auto mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f43f5e]/20 to-[#fb7185]/10 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#f43f5e]/10 to-transparent border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <motion.span 
                className="text-5xl"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                👥
              </motion.span>
            </div>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            className="text-3xl font-bold text-white mb-3 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Swipe Together
          </motion.h1>
          <motion.p 
            className="text-[#a1a1aa] mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Create a session and invite friends. When everyone matches on a restaurant, it&apos;s time to eat!
          </motion.p>

          {/* Host Button */}
          <motion.button
            onClick={hostSession}
            disabled={isLoading}
            className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-4 overflow-hidden group disabled:opacity-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-2">
              <span className="text-xl">🎉</span>
              <span>{isLoading ? "Creating..." : "Host a Session"}</span>
            </span>
          </motion.button>

          {/* Divider */}
          <motion.div 
            className="flex items-center gap-4 my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(255,255,255,0.06)]" />
            <span className="text-[#52525b] text-sm font-medium">or join a friend</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(255,255,255,0.06)]" />
          </motion.div>

          {/* Join Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="relative mb-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                className="w-full bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl px-6 py-4 text-white text-center text-2xl tracking-[0.4em] font-bold placeholder:text-[#3f3f46] placeholder:tracking-[0.4em] placeholder:font-normal focus:outline-none focus:border-[#f43f5e] focus:ring-2 focus:ring-[#f43f5e]/10 transition-all"
                maxLength={4}
              />
              {joinCode.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#f43f5e]/10 flex items-center justify-center">
                    <span className="text-[#f43f5e] text-sm font-bold">{joinCode.length}/4</span>
                  </div>
                </motion.div>
              )}
            </div>
            <button
              onClick={joinSession}
              disabled={joinCode.length !== 4 || isLoading}
              className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.06)] text-white font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all"
            >
              {isLoading ? "Joining..." : "Join Session"}
            </button>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[#fb7185] text-sm mt-4 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // WAITING STATE - Show participants and start button
  if (sessionState === "waiting") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm text-center"
        >
          {/* Room Code Display */}
          <motion.div
            className="mb-8 p-6 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[#52525b] text-sm mb-2">Room Code</p>
            <p className="text-4xl font-bold text-[#f43f5e] tracking-widest">{roomCode}</p>
          </motion.div>

          {/* Participants */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4">Participants ({participants.length})</h2>
            <div className="space-y-2">
              {participants.map((p) => (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-[#111] rounded-xl border border-[rgba(255,255,255,0.06)]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-white text-sm font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium flex-1">{p.name}</span>
                  {p.isReady && <span className="text-[#10b981] text-sm">✓ Ready</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Start Button — host only */}
          {currentRoom?.host_id === user?.id && (
            <motion.button
              onClick={startSwiping}
              disabled={participants.length < 2 || isLoading}
              className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-4 overflow-hidden group disabled:opacity-50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                <span>{isLoading ? "Starting..." : "Start Swiping"}</span>
              </span>
            </motion.button>
          )}

          {/* Leave Button */}
          <motion.button
            onClick={() => leaveSession().catch(console.error)}
            className="w-full py-3 bg-[#111] border border-[rgba(255,255,255,0.06)] text-[#a1a1aa] font-semibold rounded-2xl hover:bg-[rgba(255,255,255,0.05)] transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Leave Session
          </motion.button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[#fb7185] text-sm mt-4 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // SWIPING STATE - Show swipe deck
  if (sessionState === "swiping") {
    const currentRestaurant = restaurants[currentIndex];
    const nextRestaurant = restaurants[currentIndex + 1];

    return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header with room info */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p className="text-[#52525b] text-xs">Room: {roomCode}</p>
            <p className="text-white text-sm font-semibold">{participants.length} swiping</p>
          </div>
          <motion.button
            onClick={() => leaveSession().catch(console.error)}
            className="px-4 py-2 bg-[#111] border border-[rgba(255,255,255,0.06)] text-[#a1a1aa] text-sm rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Leave
          </motion.button>
        </div>

        {/* Card Stack */}
        <div className="flex-1 relative px-4 py-2">
          {/* Next Card (Background) */}
          {nextRestaurant && (
            <div className="absolute inset-4 sm:inset-6">
              <RestaurantCardComponent restaurant={nextRestaurant} isBackground />
            </div>
          )}

          {/* Current Card */}
          {currentRestaurant && (
            <motion.div
              className="absolute inset-4 sm:inset-6 cursor-grab active:cursor-grabbing touch-none"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <RestaurantCardComponent restaurant={currentRestaurant} />
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 py-4 px-4 pb-20">
          <motion.button
            onClick={() => handleSwipe("left")}
            className="relative w-16 h-16 rounded-full bg-[#111] border-2 border-[rgba(255,255,255,0.08)] flex items-center justify-center group shadow-lg flex-shrink-0"
            whileHover={{ scale: 1.1, borderColor: "rgba(244, 63, 94, 0.5)" }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span 
              className="text-3xl"
              whileHover={{ scale: 1.2, rotate: 90 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              ✕
            </motion.span>
          </motion.button>
          
          <motion.button
            onClick={() => handleSwipe("right")}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-xl shadow-[#f43f5e]/30 group flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span 
              className="text-4xl"
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              ❤️
            </motion.span>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-30 blur-lg -z-10" />
          </motion.button>
        </div>
      </div>
    );
  }

  // MATCHED STATE - Show celebration
  if (sessionState === "matched" && matchedRestaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-sm"
        >
          <motion.div
            className="mb-6"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          >
            <span className="text-7xl block">🎊</span>
          </motion.div>

          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
            IT&apos;S A MATCH!
          </h1>

          <motion.div
            className="relative w-full max-w-xs mx-auto mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#f43f5e]/30 to-transparent blur-xl" />
            
            <div className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={matchedRestaurant.image}
                  alt={matchedRestaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
              </div>
              
              <div className="p-5 -mt-6 relative">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {matchedRestaurant.name}
                </h2>
                <div className="flex items-center gap-2 text-[#a1a1aa] text-sm">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-semibold text-white">{matchedRestaurant.rating}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#52525b]" />
                  <span>{matchedRestaurant.cuisine}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 w-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => setSessionState("swiping")}
              className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-bold text-lg rounded-2xl overflow-hidden group shadow-xl shadow-[#f43f5e]/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                <span>🍽️</span>
                <span>Let&apos;s Eat!</span>
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setSessionState("swiping");
                setMatchedRestaurant(null);
              }}
              className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.08)] text-[#a1a1aa] font-semibold rounded-2xl hover:bg-[rgba(255,255,255,0.05)] hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Keep Swiping
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}

function RestaurantCardComponent({ 
  restaurant, 
  isBackground = false,
}: { 
  restaurant: Restaurant;
  isBackground?: boolean;
}) {
  return (
    <div 
      className={`relative w-full h-full rounded-3xl overflow-hidden ${
        isBackground ? "scale-[0.95] opacity-40" : "shadow-2xl"
      }`}
    >
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {!isBackground && (
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">{restaurant.name}</h2>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">★</span>
              <span className="font-semibold">{restaurant.rating}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{restaurant.cuisine}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="font-medium">{restaurant.price}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span>{restaurant.distance}</span>
          </div>
        </div>
      )}

      {!isBackground && (
        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
      )}
    </div>
  );
}
