"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          router.push("/");
        }
      } else {
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(error.message);
        } else {
          setSuccess("Account created! You can now sign in.");
          setIsLogin(true);
          setPassword("");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#050505] overflow-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)",
            top: "-20%",
            left: "-10%",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(251, 113, 133, 0.08) 0%, transparent 70%)",
            bottom: "-10%",
            right: "-10%",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Accent gradient */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Branding (Desktop) */}
        <motion.div
          className="hidden lg:flex lg:w-1/2 xl:w-[55%] items-center justify-center p-12 xl:p-20"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="max-w-lg">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center shadow-lg shadow-[#f43f5e]/25">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-20 blur-lg" />
              </div>
              <span className="text-3xl font-bold tracking-tight">
                <span className="text-white">Crave</span>
                <span className="text-[#f43f5e]">Match</span>
              </span>
            </motion.div>

            {/* Hero Text */}
            <motion.h1
              className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Decide where to eat,{" "}
              <span className="text-gradient">together.</span>
            </motion.h1>
            
            <motion.p
              className="text-[#a1a1aa] text-xl leading-relaxed mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Swipe through restaurants with friends. When everyone matches on a place, you&apos;ve found your spot. No more endless debates.
            </motion.p>

            {/* Feature Steps */}
            <motion.div
              className="flex gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { emoji: "👆", label: "Swipe", desc: "Browse options" },
                { emoji: "👥", label: "Match", desc: "Find consensus" },
                { emoji: "🍕", label: "Eat", desc: "Enjoy together" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-3xl mb-3 shadow-lg">
                    {step.emoji}
                  </div>
                  <p className="text-white font-semibold text-sm">{step.label}</p>
                  <p className="text-[#52525b] text-xs mt-0.5">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.06)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {["🧑‍🦱", "👩‍🦰", "🧑‍🦳", "👨‍🦲"].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-2 border-[#050505] flex items-center justify-center text-lg"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Join 10,000+ food lovers</p>
                  <p className="text-[#52525b] text-xs">Making decisions easier, one swipe at a time</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <motion.div
            className="w-full max-w-[420px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Logo */}
            <motion.div className="lg:hidden text-center mb-10" variants={itemVariants}>
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] flex items-center justify-center text-3xl shadow-xl shadow-[#f43f5e]/20">
                  🍽️
                </div>
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48] opacity-20 blur-xl" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-white">Crave</span>
                <span className="text-[#f43f5e]">Match</span>
              </h1>
              <p className="text-[#52525b] text-sm mt-2">Find your next meal together</p>
            </motion.div>

            {/* Auth Card */}
            <motion.div
              className="relative"
              variants={itemVariants}
            >
              {/* Card glow effect */}
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl rounded-3xl border border-[rgba(255,255,255,0.06)] p-8 sm:p-10 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.h2
                    className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                    key={isLogin ? "login" : "signup"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isLogin ? "Welcome back" : "Create account"}
                  </motion.h2>
                  <p className="text-[#52525b] text-sm mt-2">
                    {isLogin ? "Sign in to continue your journey" : "Start finding restaurants together"}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="relative flex bg-[#111] rounded-2xl p-1.5 mb-8">
                  <motion.div
                    className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-[#f43f5e] to-[#e11d48] shadow-lg shadow-[#f43f5e]/20"
                    initial={false}
                    animate={{
                      left: isLogin ? "6px" : "50%",
                      right: isLogin ? "50%" : "6px",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  <button
                    onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
                    className={`relative flex-1 py-3 rounded-xl text-sm font-semibold transition-colors z-10 ${
                      isLogin ? "text-white" : "text-[#52525b] hover:text-[#a1a1aa]"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
                    className={`relative flex-1 py-3 rounded-xl text-sm font-semibold transition-colors z-10 ${
                      !isLogin ? "text-white" : "text-[#52525b] hover:text-[#a1a1aa]"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        key="name-field"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-[#a1a1aa] text-sm font-medium mb-2">
                          Name
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="What should we call you?"
                            className="w-full bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#f43f5e] focus:ring-2 focus:ring-[#f43f5e]/10 transition-all"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#f43f5e]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[#a1a1aa] text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#f43f5e] focus:ring-2 focus:ring-[#f43f5e]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#a1a1aa] text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#111] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-4 pr-20 text-white placeholder:text-[#3f3f46] focus:outline-none focus:border-[#f43f5e] focus:ring-2 focus:ring-[#f43f5e]/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] text-sm font-medium transition-colors"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-xl p-4"
                      >
                        <p className="text-[#fb7185] text-sm text-center font-medium">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success Message */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4"
                      >
                        <p className="text-[#34d399] text-sm text-center font-medium">{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white font-semibold py-4 rounded-xl disabled:opacity-50 transition-all overflow-hidden group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Button content */}
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                        </>
                      ) : (
                        <>
                          <span>{isLogin ? "Sign In" : "Create Account"}</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Footer */}
                <p className="text-center text-[#52525b] text-sm mt-8">
                  {isLogin ? "New to CraveMatch? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-[#f43f5e] font-semibold hover:text-[#fb7185] transition-colors"
                  >
                    {isLogin ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </div>
            </motion.div>

            {/* Terms */}
            <motion.p
              className="text-center text-[#3f3f46] text-xs mt-6 px-4"
              variants={itemVariants}
            >
              By continuing, you agree to our{" "}
              <a href="#" className="text-[#52525b] hover:text-[#a1a1aa] underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#52525b] hover:text-[#a1a1aa] underline underline-offset-2">
                Privacy Policy
              </a>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
