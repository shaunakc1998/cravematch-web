"use client";

import { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Redirect already-logged-in users (also handles auto-login after signup with email confirm disabled)
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
        else router.push("/");
      } else {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        const { error, session } = await signUp(email, password, name);
        if (error) setError(error.message);
        else if (session) {
          // Email confirmation disabled — user is auto-logged in, useEffect will redirect
        } else {
          // Email confirmation required
          setSuccess("Check your email to confirm your account, then sign in.");
          setIsLogin(true);
          setPassword("");
          setName("");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError("");
    setSuccess("");
    setName("");
  };

  if (!mounted) return null;

  const inputClass = "w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#555] focus:outline-none focus:border-[#f43f5e]/60 focus:bg-[#1e1e1e] transition-all";

  return (
    <div
      className="min-h-screen w-full bg-[#040404] flex flex-col items-center justify-center p-5"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 65%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-[20px] bg-gradient-to-br from-[#f43f5e] to-[#c0142e] mb-4"
            animate={{ boxShadow: ["0 0 30px rgba(244,63,94,0.3)", "0 0 50px rgba(244,63,94,0.5)", "0 0 30px rgba(244,63,94,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-2xl">🍽️</span>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">Crave</span>
            <span className="text-[#f43f5e]">Match</span>
          </h1>
          <p className="text-[#555] text-sm mt-1">Find where to eat together</p>
        </div>

        {/* Card */}
        <div className="bg-[#1c1c1e] rounded-3xl border border-white/[0.13] p-6" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 25px 60px rgba(0,0,0,0.7)" }}>

          {/* Toggle */}
          <div className="flex bg-[#0a0a0a] rounded-2xl p-1 mb-6 relative border border-white/[0.06]">
            {/* Sliding pill */}
            <motion.div
              className="absolute rounded-xl bg-gradient-to-r from-[#f43f5e] to-[#c0142e]"
              style={{ top: 4, bottom: 4, width: "calc(50% - 4px)", boxShadow: "0 4px 12px rgba(244,63,94,0.3)" }}
              animate={{ left: isLogin ? 4 : "50%" }}
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            {(["Sign In", "Sign Up"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => switchMode(i === 0)}
                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl z-10 transition-colors duration-200 ${(i === 0) === isLogin ? "text-white" : "text-[#555]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name field — only shown for signup */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pb-1">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className={inputClass}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className={inputClass}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={`${inputClass} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] text-xs font-semibold hover:text-[#888] transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Error / success messages */}
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="bg-[#f43f5e]/10 border border-[#f43f5e]/25 rounded-xl px-4 py-3">
                    <p className="text-[#fb7185] text-sm text-center">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="bg-[#10b981]/10 border border-[#10b981]/25 rounded-xl px-4 py-3">
                    <p className="text-[#34d399] text-sm text-center">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#f43f5e] to-[#c0142e] text-white font-semibold rounded-xl disabled:opacity-60 touch-manipulation mt-1"
              style={{ boxShadow: "0 8px 24px rgba(244,63,94,0.3)" }}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-[#555] text-sm mt-5">
          {isLogin ? "New here? " : "Have an account? "}
          <button
            type="button"
            onClick={() => switchMode(!isLogin)}
            className="text-[#f43f5e] font-semibold"
          >
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
