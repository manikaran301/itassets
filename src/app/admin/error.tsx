"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Critical Admin Failure:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-xl w-full relative group">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-red-500/5 blur-[100px] rounded-full -z-10 animate-pulse" />
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 blur-[80px] rounded-full -z-10" />

        <div className="glass border border-red-500/20 rounded-[40px] p-10 md:p-16 text-center space-y-10 shadow-2xl relative overflow-hidden">
          {/* Header Icon with Radar Effect */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="absolute inset-0 bg-red-500/20 rounded-3xl animate-ping opacity-20" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60">
                System Fault Detected
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent uppercase">
                Admin <span className="italic font-medium opacity-30 text-foreground">Critical</span>
              </h2>
            </div>
            
            <div className="max-w-sm mx-auto space-y-3">
              <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed">
                An exception occurred while synchronizing administrative intelligence. 
                The core analytics engine has been safely suspended.
              </p>
              {error.digest && (
                <code className="block py-2 px-4 bg-black/20 rounded-xl text-[9px] font-mono text-red-400/60 border border-white/5 uppercase tracking-widest">
                  Fault ID: {error.digest}
                </code>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={reset}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-primary/20 group/btn"
            >
              <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
              Re-Sync Module
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-muted/50 text-muted-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-muted border border-white/5 hover:border-white/10 transition-all"
            >
              <Home className="w-4 h-4" />
              Exit to Dashboard
            </Link>
          </div>

          {/* Infrastructure Metadata */}
          <div className="pt-10 flex items-center justify-center gap-6 opacity-20">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Core-v2.4</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Admin-Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
