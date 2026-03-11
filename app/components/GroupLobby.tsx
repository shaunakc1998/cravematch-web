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
      <div className="h-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Icon */}
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

          {/* Host button */}
          <motion.button
            onClick={hostSession}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-3 shadow-lg shadow-rose-500/25 disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Creating..." : "🎉  Host a Session"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[#4b5563] text-xs">or join with a code</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Join input */}
          <div className="mb-3">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
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

          {/* Error */}
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

  // WAITING STATE
  if (sessionState === "waiting") {
    return (
      <div className="h-full flex flex-col p-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
          {/* Room code */}
          <div className="text-center mb-6">
            <p className="text-[#4b5563] text-xs mb-1.5 uppercase tracking-wider font-medium">Room Code</p>
            <div className="inline-block px-8 py-4 bg-[#0d0d0d] border border-white/[0.07] rounded-2xl">
              <span className="text-4xl font-black text-[#f43f5e] tracking-[0.3em]">{roomCode}</span>
            </div>
            <p className="text-[#4b5563] text-xs mt-2">Share this code with friends</p>
          </div>

          {/* Participants */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">Participants</span>
              <span className="text-[#4b5563] text-xs">{participants.length} joined</span>
            </div>
            <div className="space-y-2">
              {participants.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-[#0d0d0d] rounded-xl border border-white/[0.07]"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-white text-xs font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium flex-1">{p.name}</span>
                  {p.isReady && <span className="text-[#10b981] text-xs font-medium">Ready</span>}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Start button (host only) */}
          {currentRoom?.host_id === user?.id && (
            <motion.button
              onClick={startSwiping}
              disabled={participants.length < 2 || isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-3 shadow-lg shadow-rose-500/20 disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? "Starting..." : "Start Swiping"}
            </motion.button>
          )}
          {currentRoom?.host_id !== user?.id && (
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
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[#f43f5e] text-sm text-center mt-3">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // SWIPING STATE
  if (sessionState === "swiping") {
    const currentRestaurant = restaurants[currentIndex];
    const nextRestaurant = restaurants[currentIndex + 1];
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div>
            <p className="text-[#4b5563] text-xs">Room · {roomCode}</p>
            <p className="text-white text-sm font-semibold">{participants.length} swiping</p>
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
          {currentRestaurant && (
            <motion.div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
              <GroupCardContent restaurant={currentRestaurant} />
            </motion.div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4">
          <motion.button
            onClick={() => handleSwipe("left")}
            className="w-[60px] h-[60px] rounded-full border-2 border-white/10 bg-[#0d0d0d] flex items-center justify-center touch-manipulation"
            whileTap={{ scale: 0.88 }}
          >
            <svg className="w-6 h-6 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          <motion.button
            onClick={() => handleSwipe("right")}
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

  // MATCHED STATE
  if (sessionState === "matched" && matchedRestaurant) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            className="text-6xl mb-4 inline-block"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
          >
            🎊
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-1 tracking-tight">IT&apos;S A MATCH!</h1>
          <p className="text-[#6b7280] text-sm mb-6">Everyone agreed on this one</p>

          <div className="relative mb-6 rounded-3xl overflow-hidden border border-white/[0.07]">
            <div className="h-44 overflow-hidden">
              <img src={matchedRestaurant.image} alt={matchedRestaurant.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 bg-[#0d0d0d] text-left">
              <h2 className="text-xl font-bold text-white mb-1">{matchedRestaurant.name}</h2>
              <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                <span className="text-amber-400">★</span>
                <span className="text-white font-semibold">{matchedRestaurant.rating}</span>
                <span>·</span>
                <span>{matchedRestaurant.cuisine}</span>
                <span>·</span>
                <span>{matchedRestaurant.price}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <motion.button
              onClick={() => setSessionState("swiping")}
              className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-bold rounded-2xl shadow-lg shadow-rose-500/25 active:scale-[0.98] touch-manipulation"
              whileTap={{ scale: 0.97 }}
            >
              🍽️  Let&apos;s Eat!
            </motion.button>
            <button
              onClick={() => { setSessionState("swiping"); setMatchedRestaurant(null); }}
              className="w-full py-4 bg-[#0d0d0d] border border-white/[0.07] text-[#6b7280] font-semibold rounded-2xl active:scale-[0.98] touch-manipulation"
            >
              Keep Swiping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

function GroupCardContent({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="relative w-full h-full bg-[#0d0d0d]">
      <img src={restaurant.image} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {restaurant.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs border border-white/10">{tag}</span>
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
