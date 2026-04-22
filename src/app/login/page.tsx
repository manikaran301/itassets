"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Monitor,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { theme } = useTheme();

  // Load remembered identifier on mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem("remembered_mams_user");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Handle "Remember Me"
    if (rememberMe) {
      localStorage.setItem("remembered_mams_user", identifier);
    } else {
      localStorage.removeItem("remembered_mams_user");
    }

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

      <div className="w-full max-w-md px-6 animate-fade-in">
        <div className="relative group">
          {/* Decorative Border Blur */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative bg-card/80 backdrop-blur-2xl border border-border/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-32 h-20 mb-4 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                <img
                  src={theme === "dark" ? "/MPLWhite.png" : "/mrllogo.png"}
                  alt="MRL Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">
                Asset Management System
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wide">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Identity
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Username or Email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 hover:border-primary/30 focus:border-primary/50 focus:bg-muted/50 rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Secret Key
                  </label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 hover:border-primary/30 focus:border-primary/50 focus:bg-muted/50 rounded-2xl py-3.5 pl-12 pr-12 outline-none transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded peer-checked:bg-primary peer-checked:border-primary transition-all duration-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    Remember Identity
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4",
                  isLoading && "opacity-80 cursor-not-allowed animate-pulse",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-border/50 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border/50">
                <ShieldCheck className="w-3 h-3 text-secondary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Secure 256-bit Login
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground/60 text-center leading-relaxed">
                Unauthorized access is strictly prohibited. <br /> All login
                attempts are logged for security auditing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
