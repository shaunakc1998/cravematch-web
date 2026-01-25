"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const { signIn, signUp } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ff4d6d]/8 rounded-full blur-[150px] transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff6b8a]/6 rounded-full blur-[150px] transform translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Main Container - Centered Card on Desktop */}
      <div className="relative w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#111111] rounded-3xl border border-[#1f1f1f] overflow-hidden shadow-2xl shadow-black/50 lg:flex"
        >
          {/* Left Side - Branding (Desktop Only) */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#141414] to-[#0f0f0f] p-12 xl:p-16 flex-col justify-center relative">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff4d6d]/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center shadow-lg shadow-[#ff4d6d]/20">
                  <span className="text-xl">🍽️</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  <span className="text-white">Crave</span>
                  <span className="text-[#ff4d6d]">Match</span>
                </h1>
              </div>

              {/* Hero Text */}
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                Decide where<br />to eat,{" "}
                <span className="text-[#ff4d6d]">together.</span>
              </h2>
              
              <p className="text-[#6b6b6b] text-lg mb-12 leading-relaxed">
                Swipe through restaurants with friends. When everyone matches, you&apos;ve found your spot.
              </p>

              {/* Features */}
              <div className="flex gap-8">
                {[
                  { emoji: "👆", label: "Swipe" },
                  { emoji: "👥", label: "Match" },
                  { emoji: "🍕", label: "Eat" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-[#1a1a1a] border border-[#252525] flex items-center justify-center text-2xl">
                      {item.emoji}
                    </div>
                    <span className="text-[#6b6b6b] text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full lg:w-1/2 p-8 sm:p-10 lg:p-12 xl:p-16">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center shadow-lg shadow-[#ff4d6d]/20">
                <span className="text-2xl">🍽️</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-white">Crave</span>
                <span className="text-[#ff4d6d]">Match</span>
              </h1>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-[#6b6b6b]">
                {isLogin 
                  ? "Enter your credentials to continue" 
                  : "Start matching with friends today"}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#0a0a0a] rounded-xl p-1 mb-8">
              {["Sign In", "Sign Up"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setIsLogin(tab === "Sign In")}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    (tab === "Sign In" && isLogin) || (tab === "Sign Up" && !isLogin)
                      ? "bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white shadow-lg shadow-[#ff4d6d]/20"
                      : "text-[#6b6b6b] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-[#8b8b8b] text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-base placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4d6d] focus:ring-1 focus:ring-[#ff4d6d]/50 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[#8b8b8b] text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0a0a0a] border border-[#252525] rounded-xl px-4 py-3.5 text-white text-base placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4d6d] focus:ring-1 focus:ring-[#ff4d6d]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[#8b8b8b] text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0a] border border-[#252525] rounded-xl px-4 py-3.5 pr-16 text-white text-base placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#ff4d6d] focus:ring-1 focus:ring-[#ff4d6d]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-white transition-colors text-sm font-medium"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-[#4a4a4a] text-xs mt-2">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <p className="text-green-400 text-sm text-center">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-xl shadow-[#ff4d6d]/25 hover:shadow-2xl hover:shadow-[#ff4d6d]/30 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-[#6b6b6b] text-sm mt-8">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-[#ff4d6d] font-semibold hover:text-[#ff6b8a] transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            {!isLogin && (
              <p className="text-center text-[#4a4a4a] text-xs mt-6 leading-relaxed">
                By creating an account, you agree to our{" "}
                <span className="text-[#6b6b6b]">Terms of Service</span> and{" "}
                <span className="text-[#6b6b6b]">Privacy Policy</span>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
