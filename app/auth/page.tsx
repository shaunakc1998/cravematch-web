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
    <div className="min-h-screen w-full bg-[#0a0a0a] overflow-auto">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ff4d6d]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#ff6b8a]/5 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Branding (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 xl:p-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center text-xl shadow-lg shadow-[#ff4d6d]/20">
                🍽️
              </div>
              <span className="text-2xl font-bold">
                <span className="text-white">Crave</span>
                <span className="text-[#ff4d6d]">Match</span>
              </span>
            </div>

            {/* Hero */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Decide where to eat,{" "}
              <span className="text-[#ff4d6d]">together.</span>
            </h1>
            <p className="text-[#888] text-lg leading-relaxed mb-10">
              Swipe through restaurants with friends. When everyone matches, you&apos;ve found your spot.
            </p>

            {/* Steps */}
            <div className="flex gap-6">
              {[
                { emoji: "👆", text: "Swipe" },
                { emoji: "👥", text: "Match" },
                { emoji: "🍕", text: "Eat" },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center text-2xl mb-2">
                    {step.emoji}
                  </div>
                  <span className="text-[#666] text-sm">{step.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff4d6d] to-[#ff6b8a] flex items-center justify-center text-2xl shadow-lg shadow-[#ff4d6d]/20 mb-4">
                🍽️
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-white">Crave</span>
                <span className="text-[#ff4d6d]">Match</span>
              </h1>
              <p className="text-[#666] text-sm mt-1">Find your next meal together</p>
            </div>

            {/* Card */}
            <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-[#666] text-sm mt-1">
                  {isLogin ? "Sign in to continue" : "Join CraveMatch today"}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#0a0a0a] rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-[#ff4d6d] text-white"
                      : "text-[#666] hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-[#ff4d6d] text-white"
                      : "text-[#666] hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-[#888] text-sm mb-1.5">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white placeholder:text-[#444] focus:outline-none focus:border-[#ff4d6d] transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[#888] text-sm mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-white placeholder:text-[#444] focus:outline-none focus:border-[#ff4d6d] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[#888] text-sm mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 pr-16 text-white placeholder:text-[#444] focus:outline-none focus:border-[#ff4d6d] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white text-sm"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm text-center">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff6b8a] text-white font-semibold py-3.5 rounded-lg disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isLogin ? "Signing in..." : "Creating..."}
                    </span>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-[#666] text-sm mt-6">
                {isLogin ? "New here? " : "Have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-[#ff4d6d] font-medium hover:underline"
                >
                  {isLogin ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
