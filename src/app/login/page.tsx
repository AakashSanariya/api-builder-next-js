"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Zap, Loader2, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Account created successfully! Sign in to continue.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/forms");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card rounded-[2rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-border overflow-hidden">
          <div className="px-8 md:px-12 pt-12 md:pt-16 pb-8 md:pb-10 text-center border-b border-border bg-muted/20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-[1.25rem] shadow-xl shadow-primary/20 mb-6">
              <Zap size={32} fill="white" className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground font-display tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em]">
              Sign in to your API Builder account
            </p>
          </div>

          <div className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 rounded-2xl border border-red-100"
                >
                  <p className="text-[10px] md:text-xs font-bold text-red-700 uppercase tracking-tight">
                    {error}
                  </p>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3"
                >
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-[10px] md:text-xs font-bold text-emerald-700 uppercase tracking-tight">
                    {successMsg}
                  </p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-muted border border-border rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-muted border border-border rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pr-12 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20 focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 md:py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 md:mt-10 text-center">
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => router.push("/signup")}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 font-black transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>

          <footer className="px-8 md:px-12 py-4 md:py-6 bg-muted/50 border-t border-border text-center">
            <p className="text-[8px] md:text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">
              API Builder Engine
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
