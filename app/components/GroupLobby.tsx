"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Hash,
  Share2,
  Crown,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext";

type LobbyState = "entry" | "hosting" | "joining" | "waiting";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export default function GroupLobby() {
  const { startGroupSession } = useApp();
  const [lobbyState, setLobbyState] = useState<LobbyState>("entry");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Generate a random 4-character room code
  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Handle hosting a session
  const handleHost = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setParticipants([
      {
        id: "1",
        name: "You",
        avatar: "🍕",
        isHost: true,
      },
    ]);
    setLobbyState("hosting");
  };

  // Handle joining a session
  const handleJoin = () => {
    if (joinCode.length === 4) {
      setRoomCode(joinCode.toUpperCase());
      setParticipants([
        {
          id: "1",
          name: "Host",
          avatar: "🍔",
          isHost: true,
        },
        {
          id: "2",
          name: "You",
          avatar: "🍕",
          isHost: false,
        },
      ]);
      setLobbyState("waiting");
    }
  };

  // Simulate friend joining after 3 seconds when hosting
  useEffect(() => {
    if (lobbyState === "hosting") {
      const timer = setTimeout(() => {
        setParticipants((prev) => [
          ...prev,
          {
            id: "2",
            name: "Manasi",
            avatar: "🍣",
            isHost: false,
          },
        ]);
        setIsReady(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lobbyState]);

  // Handle share
  const handleShare = async () => {
    const shareText = `Join my CraveMatch session! 🍽️\n\nRoom Code: ${roomCode}\n\nLet's find something to eat together!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CraveMatch Session",
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
    }
  };

  // Handle back
  const handleBack = () => {
    setLobbyState("entry");
    setRoomCode("");
    setJoinCode("");
    setParticipants([]);
    setIsReady(false);
  };

  // Handle start swiping
  const handleStartSwiping = () => {
    startGroupSession({
      isActive: true,
      roomCode,
      participants,
    });
  };

  // Entry Screen
  if (lobbyState === "entry") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center mb-6 shadow-lg shadow-[#ff4d6d]/30"
        >
          <Users className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Swipe Together
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#6b7280] mb-10 max-w-xs"
        >
          Create a room and invite friends. When everyone matches, it&apos;s
          time to eat!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          {/* Host Button */}
          <button
            onClick={handleHost}
            className="w-full py-5 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-lg shadow-[#ff4d6d]/30"
          >
            <Crown className="w-6 h-6" />
            Host a Session
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#6b7280] text-sm">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Join Section */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-5 h-5 text-[#6b7280]" />
              <span className="text-[#6b7280] text-sm font-medium">
                Enter Room Code
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().slice(0, 4))
                }
                placeholder="X J 9 2"
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-center text-xl font-bold tracking-[0.3em] placeholder:text-[#3a3a3a] placeholder:tracking-[0.3em] focus:outline-none focus:border-[#ff4d6d] transition-colors"
              />
              <button
                onClick={handleJoin}
                disabled={joinCode.length !== 4}
                className="px-5 py-3 bg-[#10b981] text-white font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Hosting / Waiting Screen
  return (
    <div className="flex-1 flex flex-col px-6 py-4">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-[#6b7280] mb-6 active:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Leave Room</span>
      </button>

      {/* Room Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-3xl p-6 border border-[#2a2a2a] mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#6b7280] text-sm font-medium">Room Code</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#ff4d6d]/20 text-[#ff4d6d] rounded-full text-sm font-medium active:scale-95 transition-transform"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Big Room Code Display */}
        <div className="flex justify-center gap-3 mb-4">
          {roomCode.split("").map((char, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="w-16 h-20 bg-[#0a0a0a] rounded-xl flex items-center justify-center border-2 border-[#2a2a2a]"
            >
              <span className="text-4xl font-black text-white">{char}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[#6b7280] text-sm">
          Share this code with your friends
        </p>
      </motion.div>

      {/* Participants List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#ff4d6d]" />
          Who&apos;s Here ({participants.length})
        </h3>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center text-2xl">
                  {participant.avatar}
                </div>

                {/* Name */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {participant.name}
                    </span>
                    {participant.isHost && (
                      <span className="px-2 py-0.5 bg-[#ff4d6d]/20 text-[#ff4d6d] text-xs font-medium rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[#6b7280] text-sm">
                    {participant.name === "You" ? "Ready to swipe!" : "Joined"}
                  </span>
                </div>

                {/* Status */}
                <div className="w-8 h-8 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#10b981]" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Waiting indicator */}
          {lobbyState === "hosting" && !isReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 py-6 text-[#6b7280]"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Waiting for friends to join...</span>
            </motion.div>
          )}

          {lobbyState === "waiting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 py-6 text-[#6b7280]"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Waiting for host to start...</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Start Button (only for host when ready) */}
      {lobbyState === "hosting" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isReady ? 1 : 0.3, y: 0 }}
          className="mt-4"
        >
          <button
            onClick={handleStartSwiping}
            disabled={!isReady}
            className="w-full py-5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-lg rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg shadow-[#10b981]/30 flex items-center justify-center gap-3"
          >
            {isReady ? (
              <>
                🚀 START SWIPING
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting for friends...
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
