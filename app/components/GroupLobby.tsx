"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { restaurants, Restaurant } from "../data/restaurants";

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

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "You";

  // Generate a random 4-letter code
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  // Host a new session
  const hostSession = () => {
    const code = generateCode();
    setRoomCode(code);
    setParticipants([{ id: user?.id || "1", name: userName, isReady: true }]);
    setSessionState("waiting");
    setError("");
  };

  // Join an existing session
  const joinSession = () => {
    if (joinCode.length !== 4) {
      setError("Please enter a 4-letter code");
      return;
    }
    // In a real app, this would validate the code with the backend
    setRoomCode(joinCode.toUpperCase());
    setParticipants([
      { id: "host", name: "Host", isReady: true },
      { id: user?.id || "2", name: userName, isReady: true },
    ]);
    setSessionState("waiting");
    setError("");
  };

  // Start swiping (only when 2+ participants)
  const startSwiping = () => {
    if (participants.length < 2) {
      setError("Need at least 2 people to start!");
      return;
    }
    setSessionState("swiping");
    setCurrentIndex(0);
  };

  // Handle swipe
  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      // Simulate that all participants liked this restaurant
      // In a real app, this would sync with other participants
      const restaurant = restaurants[currentIndex];
      
      // For demo: 30% chance of match when swiping right
      if (Math.random() > 0.7) {
        setMatchedRestaurant(restaurant);
        setSessionState("matched");
        return;
      }
    }

    // Move to next restaurant
    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more restaurants
      setCurrentIndex(0);
    }
  };

  // Leave session
  const leaveSession = () => {
    setSessionState("idle");
    setRoomCode("");
    setJoinCode("");
    setParticipants([]);
    setCurrentIndex(0);
    setMatchedRestaurant(null);
    setError("");
  };

  // Simulate someone joining (for demo)
  useEffect(() => {
    if (sessionState === "waiting" && participants.length === 1) {
      const timer = setTimeout(() => {
        setParticipants((prev) => [
          ...prev,
          { id: "friend", name: "Friend", isReady: true },
        ]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionState, participants.length]);

  // IDLE STATE - Create or Join
  if (sessionState === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d]/20 to-[#ff6b8a]/20 flex items-center justify-center mb-6">
          <span className="text-4xl">👥</span>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Swipe Together</h1>
        <p className="text-[#666] text-center mb-8 max-w-xs">
          Create a session and invite friends. When everyone matches on a restaurant, it&apos;s time to eat!
        </p>

        <button
          onClick={hostSession}
          className="w-full max-w-xs py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold rounded-xl mb-4 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          🎉 Host a Session
        </button>

        <div className="flex items-center gap-4 w-full max-w-xs my-4">
          <div className="flex-1 h-px bg-[#222]" />
          <span className="text-[#666] text-sm">or join</span>
          <div className="flex-1 h-px bg-[#222]" />
        </div>

        <div className="w-full max-w-xs">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="Enter code"
            className="w-full bg-[#1a1a1a] border border-[#252525] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] placeholder:text-[#444] placeholder:tracking-normal placeholder:text-base focus:outline-none focus:border-[#ff4d6d] transition-colors mb-3"
            maxLength={4}
          />
          <button
            onClick={joinSession}
            disabled={joinCode.length !== 4}
            className="w-full py-3 bg-[#1a1a1a] border border-[#252525] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#222]"
          >
            Join Session
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  // WAITING STATE - Waiting for participants
  if (sessionState === "waiting") {
    return (
      <div className="flex-1 flex flex-col p-6">
        {/* Room Code */}
        <div className="text-center mb-8">
          <p className="text-[#666] text-sm mb-2">Share this code with friends</p>
          <div className="bg-[#1a1a1a] border border-[#252525] rounded-2xl p-6 inline-block">
            <p className="text-4xl font-bold text-white tracking-[0.3em]">{roomCode}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-4">
            Participants ({participants.length})
          </h3>
          <div className="space-y-3">
            {participants.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 bg-[#1a1a1a] border border-[#252525] rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center">
                  <span className="text-white font-semibold">{p.name[0]}</span>
                </div>
                <span className="text-white font-medium flex-1">{p.name}</span>
                <span className="text-green-400 text-sm">Ready ✓</span>
              </motion.div>
            ))}
          </div>

          {participants.length < 2 && (
            <div className="mt-4 p-4 bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-xl text-center">
              <div className="w-6 h-6 border-2 border-[#ff4d6d]/30 border-t-[#ff4d6d] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[#666] text-sm">Waiting for friends to join...</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          {participants.length >= 2 && (
            <button
              onClick={startSwiping}
              className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
            >
              🚀 Start Swiping
            </button>
          )}
          <button
            onClick={leaveSession}
            className="w-full py-3 bg-[#1a1a1a] border border-[#252525] text-[#888] font-medium rounded-xl transition-all hover:bg-[#222]"
          >
            Leave Session
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    );
  }

  // SWIPING STATE
  if (sessionState === "swiping") {
    const restaurant = restaurants[currentIndex];
    
    return (
      <div className="flex-1 flex flex-col">
        {/* Progress */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[#666] text-sm">
            {currentIndex + 1} / {restaurants.length}
          </span>
          <div className="flex -space-x-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] border-2 border-[#0a0a0a] flex items-center justify-center"
              >
                <span className="text-white text-xs font-semibold">{p.name[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 p-4">
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {restaurant.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{restaurant.name}</h2>
              <div className="flex items-center gap-3 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {restaurant.rating}
                </span>
                <span>•</span>
                <span>{restaurant.cuisine}</span>
                <span>•</span>
                <span>{restaurant.price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 py-6 px-4">
          <button
            onClick={() => handleSwipe("left")}
            className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#ff4d6d]/30 flex items-center justify-center transition-all hover:scale-110 hover:border-[#ff4d6d] active:scale-95"
          >
            <span className="text-3xl">✕</span>
          </button>
          
          <button
            onClick={() => handleSwipe("right")}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center shadow-lg shadow-[#ff4d6d]/30 transition-all hover:scale-110 active:scale-95"
          >
            <span className="text-4xl">❤️</span>
          </button>
        </div>
      </div>
    );
  }

  // MATCHED STATE
  if (sessionState === "matched" && matchedRestaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">It&apos;s a Match!</h1>
          <p className="text-[#666] mb-8">Everyone agreed on this restaurant!</p>

          <div className="bg-[#1a1a1a] border border-[#252525] rounded-2xl overflow-hidden mb-8 max-w-sm mx-auto">
            <img
              src={matchedRestaurant.image}
              alt={matchedRestaurant.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-bold text-white mb-1">{matchedRestaurant.name}</h2>
              <p className="text-[#666]">
                {matchedRestaurant.cuisine} • {matchedRestaurant.price} • {matchedRestaurant.distance}
              </p>
            </div>
          </div>

          <div className="space-y-3 w-full max-w-xs">
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(matchedRestaurant.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold rounded-xl text-center"
            >
              📍 Get Directions
            </a>
            <button
              onClick={leaveSession}
              className="w-full py-3 bg-[#1a1a1a] border border-[#252525] text-[#888] font-medium rounded-xl"
            >
              Start New Session
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
