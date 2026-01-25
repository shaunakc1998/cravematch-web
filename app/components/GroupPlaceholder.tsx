"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, Share2 } from "lucide-react";

export default function GroupPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6"
      >
        <Users className="w-12 h-12 text-[#ff4d6d]" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-white mb-2"
      >
        Swipe Together
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[#6b7280] mb-8 max-w-xs"
      >
        Invite friends to swipe with you. When everyone matches on a restaurant,
        it&apos;s time to eat!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-bold rounded-full active:scale-95 transition-transform flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" />
          Create a Group
        </button>

        <button className="w-full py-4 bg-[#1a1a1a] text-white font-semibold rounded-full active:scale-95 transition-transform border border-[#2a2a2a] flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5" />
          Join with Code
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-[#6b7280] text-sm"
      >
        Coming soon in Phase 3! 🚀
      </motion.div>
    </div>
  );
}
