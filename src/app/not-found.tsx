"use client";

import Link from "next/link";
import { ArrowLeft, Home, Compass, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-2xl w-full text-center space-y-12 relative">
        {/* Abstract Background Elements */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-[160px] pointer-events-none" />

        {/* 404 Visual */}
        <div className="relative inline-block">
          <h1 className="text-[180px] font-black leading-none tracking-tighter opacity-10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center translate-y-4">
             <div className="w-24 h-24 rounded-[40px] bg-background border-2 border-white/5 flex items-center justify-center shadow-2xl rotate-12 group transition-transform hover:rotate-0 duration-500">
                <Compass className="w-12 h-12 text-primary animate-pulse" />
             </div>
          </div>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-primary">
            <ShieldAlert className="w-4 h-4" />
            <span>Navigation Boundary</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase leading-tight">
            Lost in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Registry</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-medium">
            The resource you are looking for has been moved, archived, or never existed in our infrastructure.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 relative z-10">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-primary/20"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-white/5 border border-white/10 text-foreground rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-12 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-border" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em]">
            ERR_RESOURCE_NOT_FOUND_0x0404
          </p>
        </div>
      </div>
    </div>
  );
}
