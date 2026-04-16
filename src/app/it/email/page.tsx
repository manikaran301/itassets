"use client";

import {
  Mail,
  Plus,
  Search,
  Filter,
  Globe,
  Loader2,
  ShieldAlert,
  Edit2,
  RefreshCw,
  Server,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";

import type { EmailAccountListItem } from "@/lib/types";

export default function EmailAccountsPage() {
  const [emails, setEmails] = useState<EmailAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails");
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || email.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "suspended":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "deactivated":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google_workspace":
        return <Globe className="w-3.5 h-3.5 text-blue-500" />;
      case "microsoft_365":
        return <Server className="w-3.5 h-3.5 text-blue-600" />;
      case "zoho":
        return <Mail className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <Link
            href="/it/email/new"
            className="group flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground rounded-[22px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Create Account</span>
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by address, name or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card/40 border border-white/5 focus:border-primary/20 rounded-2xl pl-12 pr-4 py-3 text-xs outline-none transition-all font-bold placeholder:font-normal placeholder:opacity-30"
          />
        </div>
        <div className="lg:col-span-4 flex gap-2">
          <div className="flex-1 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-card/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all hover:bg-card/60"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <button
            onClick={fetchEmails}
            className="p-3 bg-card/40 border border-white/5 rounded-2xl hover:bg-card/60 transition-all text-muted-foreground"
            title="Refresh Registry"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-card/40 border border-white/5 rounded-[32px] overflow-hidden premium-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-muted/20">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Identity & Address
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Platform
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Linked Associate
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                      Synchronizing Identities...
                    </p>
                  </td>
                </tr>
              ) : filteredEmails.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-muted-foreground"
                  >
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-30">
                      No matching email accounts found.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr
                    key={email.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black tracking-tight group-hover:text-primary transition-colors">
                            {email.emailAddress}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                              {email.displayName}
                            </p>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                              {email.accountType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          getStatusStyle(email.status),
                        )}
                      >
                        <div
                          className={cn(
                            "w-1 h-1 rounded-full",
                            email.status === "active"
                              ? "bg-green-500 animate-pulse"
                              : "bg-current",
                          )}
                        />
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(email.platform)}
                        <span className="text-[10px] font-bold text-foreground/80 lowercase italic capitalize">
                          {email.platform.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-muted text-[10px] font-black flex items-center justify-center text-muted-foreground border border-white/5 uppercase">
                          {email.employee?.fullName[0]}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black uppercase tracking-tight">
                            {email.employee?.fullName}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                            {email.employee?.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                          title="Manage Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                          title="Forwarding Rules"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all"
                          title="Suspend Access"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 py-4 bg-primary/5 rounded-[24px] border border-primary/10">
        <div className="flex items-center gap-4">
          <Database className="w-4 h-4 text-primary opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Registry synchronized with{" "}
            <span className="text-primary">Corporate Directory</span>
          </p>
        </div>
        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
          {filteredEmails.length} Identities Listed
        </p>
      </div>
    </div>
  );
}
