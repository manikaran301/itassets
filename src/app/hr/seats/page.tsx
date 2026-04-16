import { User, Monitor, Plus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = "force-dynamic";

export default async function SeatsPage() {
  const floors = ["Floor 1", "Floor 2", "Floor 3", "Terrace"];
  const employees = await prisma.employee.findMany({
    where: { status: "active" },
    select: {
      id: true,
      fullName: true,
      deskNumber: true,
    },
    orderBy: { fullName: "asc" },
  });

  const seats = employees.slice(0, 24).map((employee) => ({
    id: employee.deskNumber || `UNASSIGNED-${employee.id.slice(0, 4)}`,
    user: employee.deskNumber ? employee.fullName : null,
    status: employee.deskNumber ? "Occupied" : "Available",
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Desk Allocation
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time floor plan and seating chart management.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>Map New Zone</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-4">
          <div className="p-4 bg-card border border-border rounded-2xl premium-card group">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Select Level
            </h4>
            <div className="space-y-2">
              {floors.map((floor, i) => (
                <button
                  key={floor}
                  className={cn(
                    "w-full px-4 py-2 rounded-xl text-xs font-bold text-left transition-all border border-transparent hover:border-primary/20",
                    i === 1
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-border",
                  )}
                >
                  {floor}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Legend
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-primary" /> Occupied
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Available
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-accent" /> In Transition
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in delay-100">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className="p-4 bg-card border border-border rounded-2xl premium-card group flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:rotate-6",
                    seat.status === "Occupied"
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : seat.status === "Available"
                        ? "bg-green-500/5 border-green-500/20 text-green-500 font-bold"
                        : "bg-accent/5 border-accent/20 text-accent",
                  )}
                >
                  {seat.status === "Occupied" ? (
                    <User className="w-6 h-6" />
                  ) : (
                    <Monitor className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {seat.id}
                  </p>
                  <p className="text-sm font-bold tracking-tight h-5 truncate max-w-[120px]">
                    {seat.user || "No assignee"}
                  </p>
                </div>

                <div className="absolute top-2 right-2 flex gap-1">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      seat.status === "Occupied"
                        ? "bg-primary animate-pulse"
                        : seat.status === "Available"
                          ? "bg-green-500"
                          : "bg-accent",
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-muted/20 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border text-muted-foreground animate-bounce">
              <Globe className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold">Interactive Floor Map</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Our real-time seating visualization service is loading the
                Vector floor plan. (2026 Enterprise Feature)
              </p>
            </div>
            <button className="px-6 py-2 bg-muted border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border/50 transition-all">
              Configure Desk Sensors
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
