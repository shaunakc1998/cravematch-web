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
    setRoomCode(joinCode.toUpperCase());
    setParticipants([
      { id: "host", name: "Host", isReady: true },
      { id: user?.id || "2", name: userName, isReady: true },
    ]);
    setSessionState("waiting");
    setError("");
  };

  // Start swiping
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
      const restaurant = restaurants[currentIndex];
      if (Math.random() > 0.7) {
        setMatchedRestaurant(restaurant);
        setSessionState("matched");
        return;
      }
    }

    if (currentIndex < restaurants.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
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

  // Simulate someone joining
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
            className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl mb-4 overflow-hidden group"
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
              <span>Host a Session</span>
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
              disabled={joinCode.length !== 4}
              className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.06)] text-white font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all"
            >
              Join Session
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

  // WAITING STATE
  if (sessionState === "waiting") {
    return (
      <div className="flex-1 flex flex-col p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Room Code Card */}
          <div className="text-center mb-8">
            <motion.p 
              className="text-[#a1a1aa] text-sm mb-3 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Share this code with friends
            </motion.p>
            <motion.div
              className="relative inline-block"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#f43f5e]/20 to-transparent blur-xl" />
              <div className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl px-10 py-6">
                <p className="text-5xl font-bold text-white tracking-[0.3em] font-mono">{roomCode}</p>
              </div>
            </motion.div>
            <motion.button
              className="mt-4 text-[#f43f5e] text-sm font-medium flex items-center gap-2 mx-auto hover:text-[#fb7185] transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy code
            </motion.button>
          </div>

          {/* Participants */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">
                Participants
              </h3>
              <span className="px-3 py-1 bg-[#f43f5e]/10 text-[#fb7185] text-sm font-semibold rounded-full border border-[#f43f5e]/20">
                {participants.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-lg shadow-[#f43f5e]/20">
                      <span className="text-white font-bold text-lg">{p.name[0]}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#111]" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium block">{p.name}</span>
                    <span className="text-[#52525b] text-sm">{p.id === user?.id ? "You" : "Ready to swipe"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Ready</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Waiting indicator */}
            {participants.length < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-5 bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[#f43f5e]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[#f43f5e]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[#f43f5e]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <p className="text-[#52525b] text-sm">Waiting for friends to join...</p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 mt-6">
            <AnimatePresence>
              {participants.length >= 2 && (
                <motion.button
                  onClick={startSwiping}
                  className="relative w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="text-xl">🚀</span>
                    <span>Start Swiping</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={leaveSession}
              className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.06)] text-[#a1a1aa] font-medium rounded-2xl hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-all"
            >
              Leave Session
            </button>
          </div>

          {error && (
            <p className="text-[#fb7185] text-sm text-center mt-4">{error}</p>
          )}
        </motion.div>
      </div>
    );
  }

  // SWIPING STATE
  if (sessionState === "swiping") {
    const restaurant = restaurants[currentIndex];
    
    return (
      <div className="flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#52525b] text-sm font-medium">
              {currentIndex + 1} / {restaurants.length}
            </span>
            <div className="w-24 h-1.5 bg-[#111] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#f43f5e] to-[#fb7185] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / restaurants.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="flex -space-x-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] border-2 border-[#050505] flex items-center justify-center shadow-md"
              >
                <span className="text-white text-xs font-bold">{p.name[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 px-4 pb-2">
          <motion.div 
            className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={currentIndex}
            transition={{ duration: 0.3 }}
          >
            {/* Image */}
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Tags */}
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
              
              {/* Name */}
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">{restaurant.name}</h2>
              
              {/* Details */}
              <div className="flex items-center gap-4 text-white/80 text-sm">
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
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 py-6 px-4 safe-area-bottom">
          <motion.button
            onClick={() => handleSwipe("left")}
            className="relative w-16 h-16 rounded-full bg-[#111] border-2 border-[rgba(255,255,255,0.08)] flex items-center justify-center group"
            whileHover={{ scale: 1.1, borderColor: "rgba(244, 63, 94, 0.5)" }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">✕</span>
          </motion.button>
          
          <motion.button
            onClick={() => handleSwipe("right")}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-xl shadow-[#f43f5e]/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-4xl">❤️</span>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-30 blur-lg -z-10" />
          </motion.button>
        </div>
      </div>
    );
  }

  // MATCHED STATE
  if (sessionState === "matched" && matchedRestaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Confetti particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              background: i % 3 === 0 ? "#f43f5e" : i % 3 === 1 ? "#10b981" : "#fbbf24",
              left: `${Math.random() * 100}%`,
              top: "-5%",
            }}
            animate={{
              y: ["0vh", "110vh"],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, Math.random() * 720],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 0.5,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="text-center relative z-10"
        >
          {/* Celebration Icon */}
          <motion.div
            className="text-7xl mb-6"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            🎉
          </motion.div>
          
          <motion.h1
            className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            It&apos;s a Match!
          </motion.h1>
          <motion.p
            className="text-[#a1a1aa] mb-8 text-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Everyone agreed on this restaurant!
          </motion.p>

          {/* Restaurant Card */}
          <motion.div
            className="relative bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden mb-8 max-w-sm mx-auto shadow-2xl"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent pointer-events-none" />
            <img
              src={matchedRestaurant.image}
              alt={matchedRestaurant.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h2 className="text-2xl font-bold text-white mb-2">{matchedRestaurant.name}</h2>
              <div className="flex items-center gap-2 text-[#a1a1aa]">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {matchedRestaurant.rating}
                </span>
                <span>•</span>
                <span>{matchedRestaurant.cuisine}</span>
                <span>•</span>
                <span>{matchedRestaurant.price}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-3 w-full max-w-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(matchedRestaurant.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold rounded-2xl text-center overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                <span>📍</span>
                <span>Get Directions</span>
              </span>
            </a>
            <button
              onClick={leaveSession}
              className="w-full py-4 bg-[#111] border border-[rgba(255,255,255,0.06)] text-[#a1a1aa] font-medium rounded-2xl hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-all"
            >
              Start New Session
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}
