"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightLeft,
  Database,
  FileText,
  Mail,
  ShieldAlert,
  User,
  X,
  Info,
  Clock,
  User as UserIcon,
  Activity,
  Maximize2,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";

const entityIcons: Record<string, LucideIcon> = {
  employee: User,
  asset: Database,
  accessory: Database,
  email_account: Mail,
  assignment_history: ArrowRightLeft,
  provisioning_request: FileText,
  employee_asset_requirement: FileText,
  system_user: ShieldAlert,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

interface AuditLogEntry {
  id: string | number | bigint;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string | null;
  oldValue: JsonValue;
  newValue: JsonValue;
  changedAt: string | Date;
  ipAddress?: string | null;
  user?: {
    fullName: string;
    username?: string;
  } | null;
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  currentPage: number;
  totalPages: number;
}

export function AuditLogTable({
  logs,
  currentPage,
  totalPages,
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Set mounted state on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const actionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "updated":
        return "bg-primary/10 text-primary border-primary/20";
      case "deleted":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "status_changed":
        return "bg-accent/10 text-accent border-accent/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground/60">
                Event
              </th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground/60">
                Action
              </th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground/60">
                User
              </th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground/60">
                Summary
              </th>
              <th className="px-4 py-3 font-bold uppercase tracking-widest text-muted-foreground/60 text-right">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-24 text-center text-muted-foreground font-medium italic"
                >
                  No activity records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const Icon = entityIcons[log.entityType] ?? FileText;
                const payload = log.newValue || log.oldValue;

                return (
                  <tr
                    key={log.id.toString()}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-muted/30 transition-all duration-150 group cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary group-hover:scale-110 transition-transform">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-tight text-[11px]">
                            {log.entityType.replaceAll("_", " ")}
                          </p>
                          <p className="text-[9px] font-medium text-muted-foreground font-mono opacity-60">
                            #{log.entityId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm",
                          actionColor(log.action),
                        )}
                      >
                        {log.action.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                          {log.user?.fullName?.[0] || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-[11px] leading-tight text-foreground/90">
                            {log.user?.fullName || "System"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center justify-between gap-2 bg-muted/30 px-2 py-1 rounded border border-border/50 group-hover:bg-muted/60 transition-colors">
                        <p className="text-[10px] text-muted-foreground line-clamp-1 font-mono">
                          {payload ? JSON.stringify(payload) : "No payload"}
                        </p>
                        <Maximize2 className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <p className="font-bold text-[11px] text-foreground/80">
                        {formatDistanceToNow(new Date(log.changedAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="text-[9px] font-medium text-muted-foreground/60 uppercase">
                        {new Date(log.changedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/10">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-1.5 rounded-lg border border-border bg-card text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-muted transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-1.5 rounded-lg border border-border bg-card text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-muted transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Modal - Using Portal for Viewport Centering */}
      {selectedLog &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setSelectedLog(null)}
            />
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    {(() => {
                      const Icon =
                        entityIcons[selectedLog.entityType] ?? FileText;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">
                      {selectedLog.entityType.replaceAll("_", " ")}
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground/60 font-mono">
                      LOG_ID: {selectedLog.id.toString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-border bg-muted/10">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Operation Type
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                        actionColor(selectedLog.action),
                      )}
                    >
                      {selectedLog.action.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-muted/10">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Authenticated User
                      </span>
                    </div>
                    <p className="text-sm font-black">
                      {selectedLog.user?.fullName || "System"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase opacity-60">
                      @{selectedLog.user?.username || "automation"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-muted/10">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Occurred At
                      </span>
                    </div>
                    <p className="text-sm font-black">
                      {new Date(selectedLog.changedAt).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic font-medium">
                      {formatDistanceToNow(new Date(selectedLog.changedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-muted/10">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Internal ID
                      </span>
                    </div>
                    <p className="text-[10px] font-black font-mono break-all">
                      {selectedLog.entityId}
                    </p>
                  </div>
                </div>

                {/* Payloads */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">
                      Detailed Change Data
                    </h3>
                    <div className="rounded-[24px] border border-white/5 bg-zinc-950 p-6 overflow-x-auto shadow-2xl relative group/code">
                      <div className="absolute top-4 right-4 text-[9px] font-black text-white/20 uppercase tracking-widest group-hover/code:text-primary transition-colors">
                        JSON SNAPSHOT
                      </div>
                      <pre className="text-[11px] font-mono leading-relaxed text-zinc-300">
                        {JSON.stringify(
                          selectedLog.newValue || selectedLog.oldValue,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-muted/30 border-t border-border flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-2.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 border border-primary/20"
                >
                  Close Trace
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
