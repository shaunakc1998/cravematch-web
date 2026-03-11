"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

export default function MatchesList() {
  const { matches, setActiveTab } = useApp();

  if (matches.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center px-8 text-center"
        style={{ background: "#F7F6F2" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-xs"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl"
            style={{
              background: "#F3F1EC",
              border: "2px solid #E2DFD8",
            }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🫙
          </motion.div>
          <h2
            className="text-xl font-black mb-2"
            style={{ color: "#1C1917", letterSpacing: "-0.02em" }}
          >
            Nothing saved yet
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#78716C" }}>
            Swipe right on restaurants you like and they&apos;ll appear here.
          </p>
          <motion.button
            onClick={() => setActiveTab("discover")}
            className="btn btn-primary btn-lg"
            whileTap={{ scale: 0.96 }}
          >
            Start Discovering
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#F7F6F2" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 pt-5 pb-4 border-b"
        style={{ borderColor: "#E2DFD8", background: "#FFFFFF" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-black tracking-tight"
              style={{ color: "#1C1917", letterSpacing: "-0.02em" }}
            >
              Saved Places
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#A8A29E" }}>
              Restaurants you loved
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
            style={{
              background: "#DCFCE7",
              color: "#15803D",
              border: "1.5px solid #BBF7D0",
            }}
          >
            {matches.length}
          </div>
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-3 pb-3 hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {matches.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, scale: 0.95 }}
                transition={{ delay: i * 0.035, duration: 0.22 }}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.name)}`,
                    "_blank"
                  )
                }
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl active:scale-[0.98] transition-all text-left touch-manipulation"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2DFD8",
                  boxShadow: "0 2px 8px rgba(28,25,23,0.05)",
                }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                  style={{
                    background: match.isGroupMatch ? "#EA580C" : "#16A34A",
                    marginLeft: "0",
                  }}
                />

                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-[68px] h-[68px] rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${match.image})` }}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #E2DFD8",
                      boxShadow: "0 1px 4px rgba(28,25,23,0.1)",
                    }}
                  >
                    <span style={{ fontSize: "10px" }}>★</span>
                    <span
                      className="text-[10px] font-black"
                      style={{ color: "#1C1917" }}
                    >
                      {match.rating}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-black text-base truncate"
                    style={{ color: "#1C1917", letterSpacing: "-0.01em" }}
                  >
                    {match.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5 font-medium"
                    style={{ color: "#A8A29E" }}
                  >
                    {match.cuisine} · {match.price} · {match.distance}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {match.isGroupMatch && match.matchedWith && (
                      <span
                        className="badge"
                        style={{
                          background: "#FFEDD5",
                          color: "#C2410C",
                          fontSize: "9px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        👥 Group Match
                      </span>
                    )}
                    {!match.isGroupMatch && match.tags?.[0] && (
                      <span
                        className="badge badge-neutral"
                        style={{ fontSize: "9px" }}
                      >
                        {match.tags[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "#F3F1EC" }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{ color: "#A8A29E" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
