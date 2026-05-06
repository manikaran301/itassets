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
  UserPlus,
  UserCheck,
  Mail,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

// ── Workflow Animation Component ─────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    title: "Talent Acquisition",
    desc: "Candidate added to joining pipeline",
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    title: "Digital Onboarding",
    desc: "System account & profile creation",
    icon: UserCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    title: "Asset Provisioning",
    desc: "Workstation & hardware allocation",
    icon: Monitor,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    title: "Access Management",
    desc: "Corporate email & app credentials",
    icon: Mail,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    title: "Lifecycle Audit",
    desc: "Full history & compliance tracking",
    icon: ShieldCheck,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

function WorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg">
      {/* Background Track (The 'Rail') */}
      <div className="absolute left-8 top-10 bottom-10 w-1 bg-border/10 rounded-full hidden md:block z-0" />
      
      {/* Active Glowing Progress Line */}
      <div 
        className="absolute left-8 top-10 w-1 bg-gradient-to-b from-primary via-secondary to-primary rounded-full transition-all duration-[1500ms] ease-in-out hidden md:block z-0"
        style={{ 
          height: `${(activeStep / (WORKFLOW_STEPS.length - 1)) * 100}%`,
          maxHeight: 'calc(100% - 80px)',
          boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.5), 0 0 40px rgba(var(--primary-rgb), 0.2)'
        }}
      />
      
      <div className="space-y-12 relative z-10">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          const isCompleted = activeStep > idx;
          
          return (
            <div
              key={step.title}
              className={cn(
                "relative flex items-center gap-10 transition-all duration-1000 ease-in-out",
                isActive ? "translate-x-8 opacity-100" : "opacity-25"
              )}
            >
              {/* Icon Container (The 'Node') */}
              <div className={cn(
                "relative z-20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border-2 transition-all duration-700",
                isActive 
                  ? "bg-card border-primary ring-8 ring-primary/5 shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)]" 
                  : isCompleted
                  ? "bg-card border-emerald-500/30 scale-95"
                  : "bg-card border-transparent scale-90 shadow-none"
              )}>
                <step.icon className={cn(
                  "w-7 h-7 transition-all duration-700", 
                  isActive ? step.color : isCompleted ? "text-emerald-500/50" : "text-muted-foreground"
                )} />
                
                {/* Status Indicator */}
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background shadow-lg animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-4 border-background shadow-lg animate-pulse">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Step Info */}
              <div className={cn(
                "transition-all duration-700",
                isActive ? "scale-110 origin-left" : "scale-100"
              )}>
                <h3 className={cn(
                  "text-xl font-black tracking-tight leading-none mb-2 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </h3>
                <p className={cn(
                  "text-sm font-medium opacity-60 leading-tight",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                )}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { theme } = useTheme();

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
        setError("Invalid credentials. Please verify and try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("System currently unavailable. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 lg:grid-cols-2 bg-background overflow-hidden">
      {/* ── Left Section: Visual Lifecycle ── */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-muted/20 border-r border-border/50">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(var(--primary-rgb),0.05),transparent)] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        
        <div className="z-10 w-full max-w-md mb-20">
          <h1 className="text-4xl font-black tracking-tighter mb-4 leading-none uppercase">
            Manikaran Assets <br /> <span className="text-primary italic">Monitoring System</span>
          </h1>
        </div>

        <WorkflowAnimation />
      </div>

      {/* ── Right Section: Login Form ── */}
      <div className="flex items-center justify-center relative bg-background/50 p-6 lg:p-12">
        {/* The Floating Curved Card */}
        <div className="relative w-full max-w-xl h-fit max-h-[90vh] bg-card border border-border/50 rounded-[60px] lg:rounded-[100px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center p-8 lg:p-16 animate-in zoom-in-95 duration-700">
          
          <div className="w-full max-w-md relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="w-32 h-16 mb-6 transition-transform duration-500 hover:scale-110 flex items-center justify-center">
                <img
                  src={theme === "dark" ? "/MPLWhite.png" : "/mrllogo.png"}
                  alt="MRL Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight uppercase text-foreground">Sign In</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                  Portal Authentication
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">
                  System Identity
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Username or Email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 hover:border-primary/50 focus:border-primary focus:bg-background rounded-2xl py-4 pl-14 pr-4 outline-none transition-all text-sm font-bold shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">
                  Authorization Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 hover:border-primary/50 focus:border-primary focus:bg-background rounded-2xl py-4 pl-14 pr-14 outline-none transition-all text-sm font-bold shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-border rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all duration-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                    </div>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    Remember Me
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 mt-4",
                  isLoading && "opacity-80 cursor-not-allowed animate-pulse",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to MAMS</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-border/40 text-center">
              <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">
                Secure Enterprise Gate • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
