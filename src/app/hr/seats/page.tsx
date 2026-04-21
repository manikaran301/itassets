"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { X, Loader2, User, Monitor, Wifi, ZoomIn, ZoomOut, RotateCcw, Search, Map as MapIcon, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeatEmployee {
  id: string;
  fullName: string;
  employeeCode: string;
  deskNumber: string | null;
  department: string | null;
  designation: string | null;
}

interface Seat {
  seatId: string;
  deskNumber: string;
  employee: SeatEmployee | null;
}

// ── Premium SVG chair symbol ──────────────────────────────────────────────────
function ChairSymbol() {
  return (
    <defs>
      <symbol id="chair-icon" viewBox="0 0 100 100">
        {/* Chair Base */}
        <path d="M 30 85 L 70 85 M 50 85 L 50 78" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path d="M 25 92 L 35 92 M 65 92 L 75 92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        {/* Support */}
        <rect x="46" y="65" width="8" height="15" fill="currentColor" opacity="0.3" />
        {/* Seat */}
        <rect x="20" y="45" width="60" height="22" rx="12" fill="none" stroke="currentColor" strokeWidth="5" />
        {/* Backrest */}
        <rect x="25" y="10" width="50" height="35" rx="10" fill="none" stroke="currentColor" strokeWidth="5" />
        <path d="M 35 20 L 65 20 M 35 28 L 65 28" stroke="currentColor" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        {/* Armrests */}
        <path d="M 15 48 C 15 40 22 40 22 48 L 22 58" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M 85 48 C 85 40 78 40 78 48 L 78 58" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.001)" />
      </symbol>
      
      {/* Background Dot pattern */}
      <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.1" />
      </pattern>
    </defs>
  );
}

// ── Seat node ────────────────────────────────────────────────────────────────
function SeatNode({
  cx, cy, rotate = 0, label,
  occupied, active, highlighted,
  onHover, onLeave, onClick,
}: {
  cx: number; cy: number; rotate?: number; label: string;
  occupied: boolean; active: boolean; highlighted?: boolean;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const color = active || highlighted
    ? "var(--primary)"
    : occupied
      ? "var(--secondary)"
      : "var(--border)";

  const opacity = active || highlighted ? 1 : occupied ? 0.8 : 0.5;
  const labelY = rotate === 180 ? 55 : -45;

  return (
    <g
      transform={`translate(${cx}, ${cy}) ${rotate ? `rotate(${rotate})` : ""}`}
      style={{ cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={cn("seat-node-group", highlighted && "animate-pulse")}
    >
      {/* Hover effect circle */}
      <circle r="45" fill={color} opacity="0" className="hover:opacity-5 transition-opacity" />
      
      <use
        href="#chair-icon"
        x="-32" y="-32" width="64" height="64"
        style={{
          color,
          opacity,
          filter: (active || highlighted) ? "drop-shadow(0 0 12px var(--primary))" : undefined,
          transition: "color 0.3s, filter 0.3s, opacity 0.3s",
        }}
      />
      
      {/* Label */}
      <text
        x="0" y={labelY}
        textAnchor="middle"
        transform={rotate === 180 ? "rotate(180)" : undefined}
        style={{
          fill: (active || highlighted) ? "var(--primary)" : "var(--muted-foreground)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 800,
          pointerEvents: "none",
          transition: "all 0.3s",
        }}
      >
        {label}
      </text>
    </g>
  );
}

// ── Table constants ──────────────────────────────────────────────────────────
const SEATS_PER_TABLE = 9;
const GRID_COLS = 2;
const TABLE_W = 440;
const TABLE_H = 120;
const GAP_X = 80;
const MARGIN_X = 40;
const TABLE_BLOCK_H = 320;

const COL_X = [MARGIN_X, MARGIN_X + TABLE_W + GAP_X];
const SVG_W = MARGIN_X * 2 + TABLE_W * 2 + GAP_X;

function generateTableGeometry(row: number, col: number) {
  const ox = COL_X[col];
  const offsetY = row * TABLE_BLOCK_H;
  const ty = offsetY + 100;

  const tablePath = `
    M ${ox} ${ty}
    L ${ox + 30} ${ty}
    A 40 40 0 0 0 ${ox + 110} ${ty}
    L ${ox + TABLE_W} ${ty}
    L ${ox + TABLE_W} ${ty + TABLE_H}
    L ${ox} ${ty + TABLE_H}
    Z
  `;

  const shinePath = `
    M ${ox} ${ty}
    L ${ox + 30} ${ty}
    A 40 40 0 0 0 ${ox + 110} ${ty}
    L ${ox + TABLE_W} ${ty}
    L ${ox + TABLE_W} ${ty + 20}
    C ${ox + 300} ${ty + 30} ${ox + 100} ${ty + 25} ${ox} ${ty + 25}
    Z
  `;

  const seatSpacing = 85;
  const firstSeatX = ox + 155;

  const positions = [
    { cx: ox + 70, cy: ty + (TABLE_H/2) - 50, rotate: 0 }, // At the curve
    { cx: firstSeatX, cy: ty - 40, rotate: 0 },
    { cx: firstSeatX + seatSpacing, cy: ty - 40, rotate: 0 },
    { cx: firstSeatX + seatSpacing * 2, cy: ty - 40, rotate: 0 },
    { cx: firstSeatX + seatSpacing * 3, cy: ty - 40, rotate: 0 },
    { cx: firstSeatX, cy: ty + TABLE_H + 40, rotate: 180 },
    { cx: firstSeatX + seatSpacing, cy: ty + TABLE_H + 40, rotate: 180 },
    { cx: firstSeatX + seatSpacing * 2, cy: ty + TABLE_H + 40, rotate: 180 },
    { cx: firstSeatX + seatSpacing * 3, cy: ty + TABLE_H + 40, rotate: 180 },
  ];

  return { tablePath, shinePath, positions, labelX: ox, labelY: offsetY + 60 };
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSeat, setActiveSeat] = useState<Seat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; seat: Seat } | null>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => { fetchSeats(); }, []);

  const fetchSeats = async () => {
    try {
      const res = await fetch("/api/employees");
      const allEmployees: SeatEmployee[] = await res.json();
      const employees = allEmployees.filter((e: any) => e.status === "active");

      const MIN_TABLES = 10;
      const minSeats = SEATS_PER_TABLE * MIN_TABLES;
      const neededSeats = Math.max(minSeats, Math.ceil(employees.length / SEATS_PER_TABLE) * SEATS_PER_TABLE);

      const mapped: Seat[] = [];
      const withDesk = employees.filter((e) => e.deskNumber);
      const withoutDesk = employees.filter((e) => !e.deskNumber);

      withDesk.forEach((e, i) => {
        mapped.push({ seatId: `S${i + 1}`, deskNumber: e.deskNumber!, employee: e });
      });
      withoutDesk.forEach((e) => {
        const idx = mapped.length;
        mapped.push({ seatId: `S${idx + 1}`, deskNumber: "UNASSIGNED", employee: e });
      });

      let openIdx = 0;
      while (mapped.length < neededSeats) {
        mapped.push({ seatId: `S${mapped.length + 1}`, deskNumber: `OPEN-${++openIdx}`, employee: null });
      }

      setSeats(mapped);
    } catch (err) {
      console.error("Failed to load seats:", err);
      setSeats(Array.from({ length: 90 }, (_, i) => ({
        seatId: `S${i + 1}`, deskNumber: `D-${i + 1}`, employee: null,
      })));
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  const highlightedSeatId = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const found = seats.find(s => 
      s.employee?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee?.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.seatId.toLowerCase() === searchQuery.toLowerCase()
    );
    return found?.seatId ?? null;
  }, [searchQuery, seats]);

  // Pan / Zoom
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest(".seat-node-group")) return;
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: panX, y: panY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setPanX(panStart.current.x + (e.clientX - startPos.current.x));
      setPanY(panStart.current.y + (e.clientY - startPos.current.y));
    }
    if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  };
  const onMouseUp = () => { isDragging.current = false; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(2.5, Math.max(0.3, s - e.deltaY * 0.001)));
  };

  const tableCount = Math.ceil(seats.length / SEATS_PER_TABLE);
  const gridRows = Math.ceil(tableCount / GRID_COLS);
  const svgH = gridRows * TABLE_BLOCK_H + 100;
  const occupied = seats.filter((s) => s.employee).length;
  const available = seats.filter((s) => !s.employee).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Floor Plan...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 animate-fade-in relative">
      
      {/* Compact Action Row */}
      <div className="flex justify-end items-center gap-2 px-1">
        <button onClick={fetchSeats} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <RotateCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
        <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-xl">
          <button onClick={() => setScale((s) => Math.min(2.5, s + 0.2))} className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition-all"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setScale(1); setPanX(0); setPanY(0); }} className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition-all"><MapIcon className="w-3.5 h-3.5" /></button>
          <button onClick={() => setScale((s) => Math.max(0.3, s - 0.2))} className="p-1.5 rounded-lg hover:bg-card hover:text-primary transition-all"><ZoomOut className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Occupied Capacity</p>
            <h4 className="text-xl font-black">{occupied}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Available Slots</p>
            <h4 className="text-xl font-black">{available}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <Monitor className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Floor Level</p>
            <h4 className="text-xl font-black">L04</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <MapIcon className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Sync Status</p>
            <h4 className="text-xl font-black">Live</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
            <Wifi className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Unified Search Ribbon */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex items-center shrink-0">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY EMPLOYEE NAME, CODE OR SEAT ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-all">
              <X className="w-3.5 h-3.5 opacity-30" />
            </button>
          )}
        </div>
      </div>

      {/* Full Screen Map Area */}
      <div
        className="flex-1 relative rounded-[40px] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-colors"
        style={{ background: "transparent" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transformOrigin: "center",
            transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
            transition: isDragging.current ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <svg
            viewBox={`0 0 ${SVG_W} ${svgH}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "98%", maxWidth: "1400px", height: "auto" }}
            className="drop-shadow-2xl"
          >
            <ChairSymbol />
            
            {/* SVG Background pattern */}
            <rect width={SVG_W} height={svgH} fill="url(#dotGrid)" />

            {Array.from({ length: tableCount }).map((_, tIdx) => {
              const gridRow = Math.floor(tIdx / GRID_COLS);
              const gridCol = tIdx % GRID_COLS;
              const { tablePath, shinePath, positions, labelX, labelY } = generateTableGeometry(gridRow, gridCol);
              const tableSeats = seats.slice(tIdx * SEATS_PER_TABLE, (tIdx + 1) * SEATS_PER_TABLE);

              return (
                <g key={`table-${tIdx}`}>
                  {/* Table identifier label */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect x="-8" y="-18" width="80" height="24" rx="12" fill="var(--primary)" opacity="0.05" />
                    <text
                      style={{
                        fill: "var(--primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 900,
                        letterSpacing: "2px",
                        opacity: 0.6,
                      }}
                    >
                      B-{tIdx + 1}
                    </text>
                  </g>

                  {/* Table surface */}
                  <path 
                    d={tablePath} 
                    fill="var(--card)" 
                    stroke="var(--border)" 
                    strokeWidth="2" 
                    style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.03))" }}
                  />
                  <path d={shinePath} fill="var(--muted)" opacity="0.4" />

                  {/* Dynamic Seats */}
                  {tableSeats.map((seat, sIdx) => {
                    const pos = positions[sIdx];
                    if (!pos) return null;
                    return (
                      <SeatNode
                        key={seat.seatId}
                        cx={pos.cx} cy={pos.cy} rotate={pos.rotate}
                        label={seat.seatId}
                        occupied={!!seat.employee}
                        highlighted={highlightedSeatId === seat.seatId}
                        active={activeSeat?.seatId === seat.seatId}
                        onHover={(e) => setTooltip({ x: e.clientX, y: e.clientY, seat })}
                        onLeave={() => setTooltip(null)}
                        onClick={() => setActiveSeat(activeSeat?.seatId === seat.seatId ? null : seat)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend Overlay - Minimal */}
        <div className="absolute bottom-10 left-10 flex flex-col gap-3 p-6 glass rounded-[32px] shadow-2xl border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-secondary shadow-lg shadow-secondary/30" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Active Occupant</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-border" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Available Station</span>
          </div>
        </div>
      </div>

      {/* Tooltip & Panel (Portals or Global Fixed) */}
      {tooltip && (
        <div
          style={{ position: "fixed", left: tooltip.x + 20, top: tooltip.y + 20, zIndex: 9999, pointerEvents: "none" }}
          className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-5 py-4 shadow-2xl min-w-[180px] animate-in fade-in zoom-in duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{tooltip.seat.seatId}</span>
            {tooltip.seat.employee && <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
          </div>
          <p className="text-sm font-bold text-foreground truncate">{tooltip.seat.employee?.fullName ?? "Open Station"}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-70">
            {tooltip.seat.employee?.designation ?? "Available for check-in"}
          </p>
        </div>
      )}

      {/* Slide-out Overlay */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-[400px] z-[500] bg-card/80 backdrop-blur-3xl border-l border-border shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]",
          activeSeat ? "translate-x-0" : "translate-x-full"
        )}
      >
        {activeSeat && (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{activeSeat.seatId}</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Allocation Details</span>
                </div>
              </div>
              <button onClick={() => setActiveSeat(null)} className="p-3 rounded-2xl hover:bg-muted transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {activeSeat.employee ? (
                <>
                  {[
                    { label: "Designation", value: activeSeat.employee.designation, icon: <MapIcon /> },
                    { label: "Department", value: activeSeat.employee.department, icon: <MapIcon /> },
                    { label: "Employee Code", value: activeSeat.employee.employeeCode, icon: <Monitor /> },
                    { label: "System ID", value: activeSeat.deskNumber, icon: <Monitor /> },
                  ].map((field, i) => (
                    <div key={i} className="group p-6 rounded-[32px] bg-muted/20 border border-transparent hover:border-primary/10 hover:bg-muted/40 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        {/* {field.icon} */}
                        <span className="text-[10px] font-black uppercase tracking-widest">{field.label}</span>
                      </div>
                      <p className="text-lg font-black">{field.value || "Not Assigned"}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-muted-foreground flex items-center justify-center">
                    <Info className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xl font-black uppercase">Vacant Station</p>
                    <p className="text-sm font-bold">This desk is currently available for allocation.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-8 border-t border-border">
              <button className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                Assign Asset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div 
        className={cn("fixed inset-0 z-[490] bg-background/20 backdrop-blur-sm transition-opacity duration-500", activeSeat ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={() => setActiveSeat(null)}
      />

    </div>
  );
}
