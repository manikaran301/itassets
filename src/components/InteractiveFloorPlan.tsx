"use client";

import React, { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";
import { Building2, User, Mail, Shield, Briefcase, Hash } from "lucide-react";

interface Workspace {
  id: string;
  code: string;
  company: string;
  type: string;
  floor: string;
  capacity: number;
  employeeId: string | null;
  employee: {
    fullName: string;
    employeeCode: string;
    photoPath: string | null;
    email: string | null;
    department?: string;
  } | null;
  assets: {
    id: string;
    assetTag: string;
  }[];
  accessories: {
    id: string;
    assetTag: string;
  }[];
}

interface InteractiveFloorPlanProps {
  workspaces: Workspace[];
  onSeatClick?: (workspace: Workspace) => void;
}

export function InteractiveFloorPlan({ workspaces, onSeatClick }: InteractiveFloorPlanProps) {
  const [hoveredSeat, setHoveredSeat] = useState<Workspace | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * delta, 0.5), 5)
      }));
    }
  };

  const getSeatData = (svgCode: string) => {
    // Map SVG IDs to actual database codes
    const mapping: Record<string, string> = {
      "MGR-01": "MPL-WS009",
      "A-101": "MPL-WS001",
      "A-102": "MPL-WS002",
      "A-103": "MPL-WS003",
      "A-104": "MPL-WS004",
      "A-105": "MPL-WS005",
      "A-106": "MPL-WS006",
      "A-107": "MPL-WS007",
      "A-108": "MPL-WS008",
    };
    
    const actualCode = mapping[svgCode] || svgCode;
    return workspaces.find(ws => ws.code === actualCode);
  };

  const Seat = ({ code, transform: seatTransform, children }: { code: string; transform: string; children: React.ReactNode }) => {
    const data = getSeatData(code);
    const isOccupied = !!data?.employee;
    const isHovered = hoveredSeat?.id === data?.id && !!data;
    
    const displayCode = data?.code || code;
    
    return (
      <g 
        className="cursor-pointer transition-all duration-500 group"
        transform={seatTransform}
        onMouseEnter={() => data && setHoveredSeat(data)}
        onMouseLeave={() => setHoveredSeat(null)}
        onClick={(e) => {
          e.stopPropagation();
          data && onSeatClick?.(data);
        }}
      >
        {/* Hover Glow Effect */}
        {isHovered && (
          <rect 
            x={code === "MGR-01" ? "0" : "-70"} 
            y={code === "MGR-01" ? "-20" : "-10"} 
            width={code === "MGR-01" ? "180" : "160"} 
            height={code === "MGR-01" ? "160" : "180"} 
            rx="20" 
            className="fill-primary/5 animate-pulse"
          />
        )}

        {children}

        {/* Dynamic Status Pip */}
        <circle 
          cx={code === "MGR-01" ? "82" : "52"} 
          cy={code.startsWith("A-101") || code.startsWith("A-102") || code.startsWith("A-103") || code.startsWith("A-104") ? "10" : (code === "MGR-01" ? "4" : "80")} 
          r={isHovered ? "8" : "6"} 
          className={cn(
            "transition-all duration-500 stroke-white stroke-2 shadow-sm",
            isOccupied ? "fill-slate-600" : "fill-emerald-500",
            isHovered && "stroke-primary stroke-[3px]"
          )}
        />

        {/* Dynamic Name Label */}
        {isOccupied && data?.employee && (
          <text 
            x="0" 
            y={code.startsWith("A-1") && parseInt(code.split("-")[1]) <= 104 ? "165" : "170"} 
            textAnchor="middle" 
            className={cn(
              "text-[9px] font-black uppercase tracking-wider transition-all duration-500 pointer-events-none",
              isHovered ? "fill-primary scale-110" : "fill-slate-500/60"
            )}
          >
            {data.employee.fullName.split(' ')[0]}
          </text>
        )}

        {/* Display Actual Code in Badge */}
        <g transform={code === "MGR-01" ? "translate(40, -10)" : "translate(0, -10)"}>
           <rect 
            x="-30" y="-8" width="60" height="16" rx="8" 
            className={cn(
              "transition-all duration-500",
              isHovered ? "fill-primary stroke-primary/20" : "fill-white stroke-slate-200"
            )} 
            strokeWidth="1"
           />
           <text 
            textAnchor="middle" 
            y="3"
            className={cn(
              "text-[8px] font-black uppercase transition-all duration-500",
              isHovered ? "fill-white" : "fill-slate-600"
            )}
           >
            {displayCode}
           </text>
        </g>
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-[#f1f5f9] rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )} 
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => { setIsDragging(false); setHoveredSeat(null); }}
      onWheel={handleWheel}
    >
      <div 
        className="w-full h-full p-10 transition-transform duration-150 ease-out origin-center"
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` 
        }}
      >
        <svg
          viewBox="0 0 1440 560"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <style>{`
            .desk { fill: #FFFFFF; stroke: #e2e8f0; stroke-width: 2; filter: url(#softShadow); }
            .badge-text { font-family: 'Inter', sans-serif; }
          `}</style>
          
          <symbol id="chair-down-custom" viewBox="0 0 80 90">
            <rect x="8" y="0" width="64" height="34" rx="10" fill="currentColor" opacity="0.8" />
            <rect x="4" y="28" width="72" height="50" rx="18" fill="currentColor" />
            <rect x="0" y="32" width="10" height="36" rx="5" fill="#334155" />
            <rect x="70" y="32" width="10" height="36" rx="5" fill="#334155" />
          </symbol>

          <symbol id="chair-up-custom" viewBox="0 0 80 90">
            <rect x="4" y="12" width="72" height="50" rx="18" fill="currentColor" />
            <rect x="0" y="22" width="10" height="36" rx="5" fill="#334155" />
            <rect x="70" y="22" width="10" height="36" rx="5" fill="#334155" />
            <rect x="8" y="56" width="64" height="34" rx="10" fill="currentColor" opacity="0.8" />
          </symbol>

          <symbol id="chair-right-custom" viewBox="0 0 90 80">
            <rect x="12" y="4" width="50" height="72" rx="18" fill="currentColor" />
            <rect x="22" y="0" width="36" height="10" rx="5" fill="#334155" />
            <rect x="22" y="70" width="36" height="10" rx="5" fill="#334155" />
            <rect x="56" y="8" width="34" height="64" rx="10" fill="currentColor" opacity="0.8" />
          </symbol>
        </defs>

        {/* Floor Background with subtle pattern */}
        <rect width="1440" height="560" fill="transparent" />

        {/* Manager Cabin */}
        <g id="zone-cabin">
          <rect x="60" y="110" width="280" height="320" rx="40" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="url(#softShadow)" />
          <rect x="100" y="200" width="180" height="100" rx="8" className="desk" />
          <rect x="100" y="200" width="70" height="160" rx="8" className="desk" />
          
          <Seat code="MGR-01" transform="translate(110, 210)">
            <use 
              href="#chair-right-custom" 
              width="90" height="80" 
              className={cn(
                "transition-colors duration-500",
                !!getSeatData("MGR-01")?.employee ? "text-slate-400" : "text-emerald-500/80",
                hoveredSeat?.code === (getSeatData("MGR-01")?.code) && "text-primary"
              )} 
            />
          </Seat>
        </g>

        {/* Open Floor */}
        <g id="zone-open-floor">
          <rect x="360" y="80" width="1040" height="440" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" rx="40" filter="url(#softShadow)" />
          <line x1="360" y1="300" x2="1400" y2="300" stroke="#f1f5f9" strokeWidth="4" />
          <line x1="620" y1="80" x2="620" y2="520" stroke="#f1f5f9" strokeWidth="4" />
          <line x1="880" y1="80" x2="880" y2="520" stroke="#f1f5f9" strokeWidth="4" />
          <line x1="1140" y1="80" x2="1140" y2="520" stroke="#f1f5f9" strokeWidth="4" />

          {/* Row 1 Seats */}
          {[
            { code: "A-101", x: 490 },
            { code: "A-102", x: 750 },
            { code: "A-103", x: 1010 },
            { code: "A-104", x: 1270 },
          ].map((s) => (
            <Seat key={s.code} code={s.code} transform={`translate(${s.x}, 120)`}>
              <rect x="-60" y="90" width="140" height="60" rx="4" className="desk" />
              <use 
                href="#chair-down-custom" 
                x="-40" y="0" width="80" height="90" 
                className={cn(
                  "transition-all duration-500",
                  !!getSeatData(s.code)?.employee ? "text-slate-400" : "text-emerald-500/80",
                  hoveredSeat?.code === (getSeatData(s.code)?.code) && "text-primary"
                )} 
              />
            </Seat>
          ))}

          {/* Row 2 Seats */}
          {[
            { code: "A-105", x: 490 },
            { code: "A-106", x: 750 },
            { code: "A-107", x: 1010 },
            { code: "A-108", x: 1270 },
          ].map((s) => (
            <Seat key={s.code} code={s.code} transform={`translate(${s.x}, 330)`}>
              <rect x="-60" y="0" width="140" height="60" rx="4" className="desk" />
              <use 
                href="#chair-up-custom" 
                x="-40" y="70" width="80" height="90" 
                className={cn(
                  "transition-all duration-500",
                  !!getSeatData(s.code)?.employee ? "text-slate-400" : "text-emerald-500/80",
                  hoveredSeat?.code === (getSeatData(s.code)?.code) && "text-primary"
                )} 
              />
            </Seat>
          ))}
        </g>
      </svg>
      </div>

      {/* Hover Tooltip */}
      {hoveredSeat && (
        <div 
          className="fixed z-[100] pointer-events-none transition-transform duration-75 ease-out"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y,
            transform: `translate(${mousePos.x + 260 > window.innerWidth ? '-110%' : '15px'}, ${mousePos.y + 180 > window.innerHeight ? '-100%' : '15px'})`
          }}
        >
          <div className="bg-card/95 backdrop-blur-xl border border-white/20 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.4)] rounded-[24px] p-4 min-w-[220px] ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-xl blur-sm opacity-40" />
                <UserAvatar 
                  photoPath={hoveredSeat.employee?.photoPath} 
                  fullName={hoveredSeat.employee?.fullName || "Vacant"} 
                  className="w-12 h-12 rounded-xl border-2 border-white/50 relative z-10 shadow-sm object-cover"
                />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-card z-20",
                  hoveredSeat.employee ? "bg-slate-500" : "bg-emerald-500 animate-pulse"
                )} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black uppercase tracking-tight truncate leading-none mb-1 text-foreground">
                  {hoveredSeat.employee?.fullName || "AVAILABLE"}
                </h4>
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest">
                      {hoveredSeat.code}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {hoveredSeat.employee ? (
              <div className="space-y-2 pt-3 border-t border-border/10">
                <div className="flex items-center gap-3 group/item">
                  <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-hover/item:bg-primary/10">
                    <Hash className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-muted-foreground/50 uppercase tracking-[0.1em]">ID</p>
                    <p className="text-[10px] font-bold text-foreground leading-none">{hoveredSeat.employee.employeeCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group/item">
                  <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-hover/item:bg-primary/10">
                    <Briefcase className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-muted-foreground/50 uppercase tracking-[0.1em]">Dept</p>
                    <p className="text-[10px] font-bold text-foreground uppercase truncate">{hoveredSeat.employee.department || "General"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 group/item">
                  <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center transition-colors group-hover/item:bg-primary/10">
                    <Mail className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[7px] font-black text-muted-foreground/50 uppercase tracking-[0.1em]">Email</p>
                    <p className="text-[10px] font-bold text-foreground lowercase truncate max-w-[140px]">{hoveredSeat.employee.email || "N/A"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-border/10 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
