"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin]           = useState(true);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [name, setName]                 = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [mounted, setMounted]           = useState(false);

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (user) router.push("/"); }, [user, router]);

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
          // auto-logged in
        } else {
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

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-5"
      style={{
        background: "linear-gradient(150deg, #ECFDF5 0%, #F7F6F2 40%, #FFF7ED 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #DCFCE7 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #FFEDD5 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
        className="relative w-full max-w-[400px]"
      >
        {/* ── Logo ─────────────────────────────────────── */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
            style={{ background: "#16A34A", boxShadow: "0 8px 24px rgba(22,163,74,0.35)" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🌿
          </motion.div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "#1C1917", letterSpacing: "-0.03em" }}
          >
            Crave<span style={{ color: "#16A34A" }}>Match</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#78716C" }}>
            Find where to eat — together.
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2DFD8",
            boxShadow: "0 20px 48px rgba(28,25,23,0.10), 0 4px 12px rgba(28,25,23,0.06)",
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex border-b"
            style={{ borderColor: "#E2DFD8", background: "#F7F6F2" }}
          >
            {(["Sign In", "Sign Up"] as const).map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => switchMode(i === 0)}
                  className="relative flex-1 py-3.5 text-sm font-semibold transition-colors"
                  style={{ color: active ? "#15803D" : "#A8A29E" }}
                >
                  {label}
                  {active && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ background: "#16A34A" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name (signup only) */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pb-0.5">
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "#78716C" }}
                    >
                      Your name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex"
                      autoComplete="name"
                      className="input"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#78716C" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "#78716C" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Your password" : "Min. 6 characters"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="input pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold transition-colors"
                  style={{ color: "#A8A29E" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Messages */}
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
                  <div
                    className="px-4 py-3 rounded-xl text-sm text-center"
                    style={{
                      background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#DC2626",
                    }}
                  >
                    {error}
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
                  <div
                    className="px-4 py-3 rounded-xl text-sm text-center"
                    style={{
                      background: "#DCFCE7",
                      border: "1px solid #BBF7D0",
                      color: "#15803D",
                    }}
                  >
                    {success}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-full"
              whileTap={{ scale: 0.97 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner spinner-sm" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </motion.button>
          </form>
        </div>

        {/* Switch mode link */}
        <p className="text-center text-sm mt-5" style={{ color: "#78716C" }}>
          {isLogin ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => switchMode(!isLogin)}
            className="font-semibold transition-colors"
            style={{ color: "#16A34A" }}
          >
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
