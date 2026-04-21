"use client";

import {
  UserX,
  Briefcase,
  Calendar,
  Trash2,
  Mail,
  Truck,
  AlertTriangle,
  ShieldAlert,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Employee } from "@/lib/types";

export default function ExitsPage() {
  const [exits, setExits] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExits();
  }, []);

  const fetchExits = async () => {
    try {
      const response = await fetch(
        "/api/employees?status=exit_pending,inactive",
      );
      const data = await response.json();

      // Filter for exit_pending and inactive employees
      const filtered = data.filter(
        (emp: Employee) =>
          emp.status === "exit_pending" || emp.status === "inactive",
      );

      setExits(
        filtered.sort((a: Employee, b: Employee) => {
          const dateA = a.exitDate ? new Date(a.exitDate).getTime() : Infinity;
          const dateB = b.exitDate ? new Date(b.exitDate).getTime() : Infinity;
          return dateA - dateB;
        }),
      );
    } catch (error) {
      console.error("Failed to fetch exits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setExits((prev) => prev.filter((e) => e.id !== id));
      } else if (response.status === 409) {
        // Conflict - cannot delete due to dependencies
        const message = data.details
          ? `Cannot delete employee:\n\n${data.details.join("\n")}`
          : data.error || "Cannot delete this employee.";
        alert(message);
      } else {
        const message = data.details
          ? `${data.error}\n\n${data.details}`
          : data.error || "Failed to delete employee.";
        alert(message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Employee Exits
          </h2>
          <p className="text-muted-foreground mt-1">
            Offboarding tracking for hardware recovery and identity
            deactivation.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <UserX className="w-5 h-5" />
            <span>Register Exit</span>
          </button>
        </div>
      </div>

      {exits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No employees with pending exits.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
          {exits.map((exit) => {
            // Note: Assets/Accessories not included in API response
            // These would need to be fetched separately if needed
            const priority = exit.status === "exit_pending" ? "High" : "Normal";

            return (
              <div
                key={exit.id}
                className="premium-card rounded-2xl overflow-hidden glass border-border/50 group flex flex-col h-full bg-card/60 relative overflow-hidden"
              >
                {priority === "High" && (
                  <div className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-bl-xl text-[8px] font-black uppercase tracking-tighter shadow-lg transform translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                    High Risk Exit
                  </div>
                )}

                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-xl font-black text-muted-foreground group-hover:text-red-500 transition-colors">
                        {exit.fullName[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold tracking-tight group-hover:text-red-500 transition-colors">
                          {exit.fullName}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3" />
                          {exit.department || "Unassigned"} ·{" "}
                          {exit.employeeCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Last Working Day
                      </span>
                      <span className="text-xs font-semibold flex items-center gap-1.5 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-xl border border-red-500/20 w-fit">
                        <Calendar className="w-4 h-4" />
                        {exit.exitDate
                          ? new Date(exit.exitDate).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 p-3 bg-muted rounded-2xl border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Truck className="w-3 h-3" />
                          Hardware
                        </span>
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <>
                            <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />{" "}
                            <span className="text-xs text-accent font-bold uppercase">
                              To Recover
                            </span>
                          </>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-muted rounded-2xl border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          Identity
                        </span>
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-accent animate-pulse" />{" "}
                          <span className="text-xs text-accent font-bold uppercase">
                            Deactivate
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button className="flex-1 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      Full Record
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exit.id, exit.fullName)}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
