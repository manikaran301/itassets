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
  X,
  Trash2,
  ArrowRight,
  Upload,
  AlertCircle,
  CheckCircle,
  Download,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/SearchableSelect";

import type { EmailAccountListItem } from "@/lib/types";

// ── Forwarding Modal ──────────────────────────────────────────────────────────
interface ForwardingRule {
  id: string;
  forwardToAddress: string;
  forwardType: string;
  isActive: boolean;
}

function ForwardingModal({
  emailId,
  emailAddress,
  onClose,
}: {
  emailId: string;
  emailAddress: string;
  onClose: () => void;
}) {
  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState("");
  const [forwardType, setForwardType] = useState<"copy" | "redirect">("copy");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRules();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [emailId]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/forwarding`);
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load forwarding rules");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/emails/${emailId}/forwarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forwardToAddress: newAddress.trim(), forwardType }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add");
        return;
      }
      setNewAddress("");
      await fetchRules();
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (forwardingId: string) => {
    setDeletingId(forwardingId);
    try {
      await fetch(`/api/emails/${emailId}/forwarding`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forwardingId }),
      });
      await fetchRules();
    } catch {
      setError("Failed to remove");
    } finally {
      setDeletingId(null);
    }
  };

  const modalContent = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center p-4"
    >
      <div
        style={{ position: "fixed", inset: 0 }}
        className="bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-card border border-white/10 rounded-3xl shadow-2xl shadow-black/40 animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              Forwarding Rules
            </h2>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold truncate">
              {emailAddress}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Add Forwarding Address
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="forward@example.com"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 bg-muted/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary/30 transition-all font-bold placeholder:font-normal"
              />
              <select
                value={forwardType}
                onChange={(e) =>
                  setForwardType(e.target.value as "copy" | "redirect")
                }
                className="bg-muted/30 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none"
              >
                <option value="copy">Copy</option>
                <option value="redirect">Redirect</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={adding || !newAddress.trim()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {adding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                Add
              </button>
            </div>
            {error && (
              <p className="text-[10px] text-red-500 font-bold">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Active Rules ({rules.length})
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/40">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold">No forwarding rules set</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between gap-3 bg-muted/20 border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0",
                          rule.forwardType === "redirect"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}
                      >
                        {rule.forwardType}
                      </span>
                      <p className="text-xs font-bold truncate">
                        {rule.forwardToAddress}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="shrink-0 p-1.5 hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-500 rounded-lg transition-all disabled:opacity-50"
                    >
                      {deletingId === rule.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ── Import Preview Modal ──────────────────────────────────────────────────────
interface ImportRecord {
  id: string; // Internal temp ID for React
  emailAddress: string;
  displayName: string;
  employeeCode: string;
  accountType: string;
  platform: string;
  status: string;
  passwordHash: string;
  forwardingAddresses: string;
  isValid: boolean;
  error?: string;
}

function ImportPreviewModal({
  data,
  onClose,
  onImport,
}: {
  data: ImportRecord[];
  onClose: () => void;
  onImport: (finalData: any[]) => Promise<void>;
}) {
  const [records, setRecords] = useState<ImportRecord[]>(data);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateRecords = async (recordsToValidate: ImportRecord[]) => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/emails/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: recordsToValidate }),
      });
      const data = await res.json();
      if (data.results) {
        setRecords((prev) =>
          prev.map((r) => {
            const validation = data.results.find((v: any) => v.id === r.id);
            if (validation) {
              return { ...r, isValid: validation.isValid, error: validation.error };
            }
            return r;
          })
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const updateRecord = (id: string, field: keyof ImportRecord, value: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  const handleFinalImport = async () => {
    const validRecords = records.filter((r) => r.isValid);
    if (validRecords.length === 0) {
      alert("No valid records to import");
      return;
    }
    setIsSubmitting(true);
    await onImport(validRecords);
    setIsSubmitting(false);
  };

  const modalContent = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} className="flex items-center justify-center p-4">
      <div style={{ position: "fixed", inset: 0 }} className="bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl h-[85vh] bg-card border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Import Preview & Validation
            </h2>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold">
              Review and correct data before finalizing the bulk creation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase bg-muted px-3 py-1 rounded-full">
              {records.filter(r => r.isValid).length} / {records.length} Valid
            </span>
            <button
              onClick={() => validateRecords(records)}
              disabled={isValidating}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-blue-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Re-Validate
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead className="sticky top-0 bg-card z-20">
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Status</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Email Address</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Display Name</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Emp Code</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Type</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-muted-foreground/50">Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {records.map((record) => (
                <tr key={record.id} className={cn("hover:bg-white/5 transition-all", !record.isValid && "bg-red-500/5")}>
                  <td className="px-4 py-2">
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin opacity-20" />
                    ) : record.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-black uppercase text-[8px] whitespace-nowrap">{record.error || "Error"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={record.emailAddress}
                      onChange={(e) => updateRecord(record.id, "emailAddress", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={record.displayName}
                      onChange={(e) => updateRecord(record.id, "displayName", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold uppercase"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={record.employeeCode}
                      onChange={(e) => updateRecord(record.id, "employeeCode", e.target.value)}
                      className="w-full bg-transparent border-b border-transparent focus:border-primary/30 outline-none p-1 font-bold"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={record.accountType}
                      onChange={(e) => updateRecord(record.id, "accountType", e.target.value)}
                      className="bg-transparent border-none outline-none font-black uppercase"
                    >
                      <option value="personal">PERSONAL</option>
                      <option value="shared">SHARED</option>
                      <option value="distribution">DISTRIBUTION</option>
                      <option value="service">SERVICE</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={record.platform}
                      onChange={(e) => updateRecord(record.id, "platform", e.target.value)}
                      className="bg-transparent border-none outline-none font-black uppercase"
                    >
                      <option value="google_workspace">GOOGLE</option>
                      <option value="microsoft_365">M365</option>
                      <option value="zoho">ZOHO</option>
                      <option value="other">OTHER</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground">
            Only valid records (green) will be processed. Total {records.filter(r => r.isValid).length} ready.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalImport}
              disabled={isSubmitting || records.filter(r => r.isValid).length === 0}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Finalize Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailAccountsPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [suspending, setSuspending] = useState<string | null>(null);
  const [forwardingModal, setForwardingModal] = useState<{
    id: string;
    emailAddress: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRecord[] | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchEmails();
  }, []);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, domainFilter]);

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

    const matchesCategory =
      categoryFilter === "all" || email.accountType === categoryFilter;

    const matchesDomain =
      domainFilter === "all" || email.emailAddress.split("@")[1] === domainFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesDomain;
  });

  const domains = Array.from(new Set(emails.map(e => e.emailAddress.split("@")[1]).filter(Boolean))).sort();

  const totalPages = Math.max(1, Math.ceil(filteredEmails.length / PAGE_SIZE));
  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const startEntry = filteredEmails.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE, filteredEmails.length);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        alert("Empty or invalid CSV");
        setImporting(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const parsedRecords: ImportRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let currentValue = "";
        let insideQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') insideQuotes = !insideQuotes;
          else if (char === "," && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
          } else currentValue += char;
        }
        values.push(currentValue.trim());

        const record: any = { id: Math.random().toString(36).substr(2, 9) };
        headers.forEach((header, index) => {
          record[header] = values[index] || "";
        });

        // Basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        record.isValid = emailRegex.test(record.emailAddress);
        if (!record.isValid) record.error = "Invalid format";

        parsedRecords.push(record);
      }

      // Initial validation
      setPreviewData(parsedRecords);
      setImporting(false);
      e.target.value = ""; // Reset

      // Trigger server-side validation immediately
      fetch("/api/emails/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: parsedRecords }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            setPreviewData((prev) =>
              prev?.map((r) => {
                const v = data.results.find((res: any) => res.id === r.id);
                return v ? { ...r, isValid: v.isValid, error: v.error } : r;
              }) || null
            );
          }
        });
    };
    reader.readAsText(file);
  };

  const finalizeImport = async (finalRecords: any[]) => {
    try {
      const response = await fetch("/api/emails/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: finalRecords }),
      });
      const data = await response.json();

      if (data.success) {
        alert(
          `Import Complete!\nImported: ${data.summary.imported}\nSkipped: ${data.summary.skipped}\nErrors: ${data.summary.errors}`
        );
        setPreviewData(null);
        fetchEmails();
      } else {
        alert(`Import Failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import emails.");
    }
  };

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

  const stats = [
    { label: "Total Accounts", value: emails.length, icon: Database, color: "text-foreground bg-muted/50 border-border" },
    { label: "Active", value: emails.filter(e => e.status === "active").length, icon: ShieldAlert, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Forwarding", value: emails.filter(e => e.forwardingEnabled).length, icon: Globe, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { label: "Sync Status", value: "99.9%", icon: RefreshCw, color: "text-accent bg-accent/10 border-accent/20" },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-20 pt-4">
      {forwardingModal && (
        <ForwardingModal
          emailId={forwardingModal.id}
          emailAddress={forwardingModal.emailAddress}
          onClose={() => {
            setForwardingModal(null);
            fetchEmails();
          }}
        />
      )}

      {previewData && (
        <ImportPreviewModal
          data={previewData}
          onClose={() => setPreviewData(null)}
          onImport={finalizeImport}
        />
      )}

      {/* Action Row */}
      <div className="flex justify-end items-center gap-2 px-1">
        <button onClick={fetchEmails} className="p-2.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-muted-foreground transition-all">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
        <input
          type="file"
          id="csv-import"
          accept=".csv"
          className="hidden"
          onChange={handleImport}
          disabled={importing}
        />
        <label
          htmlFor="csv-import"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all cursor-pointer",
            importing && "opacity-50 cursor-not-allowed"
          )}
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Import CSV
        </label>
        <a
          href="/templates/email_import_template.csv"
          download
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Template
        </a>
        <button
          onClick={() => (window.location.href = "/api/emails/export")}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
        <Link href="/it/email/new" className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Create Account
        </Link>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/60 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
              <h4 className="text-xl font-black">{loading ? "..." : stat.value}</h4>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-all", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Unified Filter Strip */}
      <div className="bg-card/50 border border-border p-1.5 rounded-2xl flex flex-col lg:flex-row gap-2 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BY ADDRESS, DISPLAY NAME OR ASSOCIATE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:bg-background outline-none transition-all placeholder:text-[8px] placeholder:font-black placeholder:tracking-widest opacity-80"
          />
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="w-full lg:w-40">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL STATUS" },
                { value: "active", label: "ACTIVE" },
                { value: "inactive", label: "INACTIVE" },
                { value: "suspended", label: "SUSPENDED" }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "all")}
              placeholder="ALL STATUS"
              compact
            />
          </div>
          <div className="w-full lg:w-40">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL CATEGORY" },
                { value: "personal", label: "PERSONAL" },
                { value: "shared", label: "SHARED" },
                { value: "distribution", label: "DISTRIBUTION" }
              ]}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val || "all")}
              placeholder="ALL CATEGORY"
              compact
            />
          </div>
          <div className="w-full lg:w-48">
            <SearchableSelect
              options={[
                { value: "all", label: "ALL DOMAINS" },
                ...domains.map((d) => ({ value: d, label: `@${d.toUpperCase()}` }))
              ]}
              value={domainFilter}
              onChange={(val) => setDomainFilter(val || "all")}
              placeholder="ALL DOMAINS"
              compact
            />
          </div>
        </div>
      </div>

      {/* High-Density Registry Container */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="pl-6 pr-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Identifier & Address</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Platform</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Associate</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Forwarding</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Identities...</p>
                  </td>
                </tr>
              ) : paginatedEmails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-muted-foreground opacity-30">
                    <Mail className="w-8 h-8 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching accounts localized</p>
                  </td>
                </tr>
              ) : (
                paginatedEmails.map((email, idx) => (
                  <tr 
                    key={`${email.id}-${idx}`} 
                    onClick={() => router.push(`/it/email/${email.id}`)}
                    className="group hover:bg-muted/20 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-primary"
                  >
                    <td className="pl-6 pr-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          {getPlatformIcon(email.platform)}
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight uppercase">{email.displayName}</p>
                          <p className="text-[8px] font-black text-muted-foreground/50 lowercase tracking-wide">{email.emailAddress}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest", getStatusStyle(email.status))}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", email.status === "active" ? "bg-green-500" : "bg-red-500 animate-pulse")} />
                        {email.status}
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">{email.platform.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      {email.employee ? (
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {email.employee.photoPath ? (
                              <img 
                                src={email.employee.photoPath} 
                                alt={email.employee.fullName}
                                className="w-8 h-8 rounded-xl object-cover border border-white/10 group-hover/avatar:scale-110 transition-transform shadow-lg"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary uppercase group-hover/avatar:scale-110 transition-transform">
                                {email.employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black truncate max-w-[120px] uppercase leading-none mb-1">{email.employee.fullName}</p>
                            <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">{email.employee.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 opacity-20">
                          <div className="w-8 h-8 rounded-xl bg-muted border border-border/50 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[8px] font-black opacity-25 uppercase tracking-widest italic">Shared Identity</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setForwardingModal({ id: email.id, emailAddress: email.emailAddress });
                        }}
                        className={cn("px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                        email.forwardingEnabled ? "bg-secondary/10 text-secondary border-secondary/20 shadow-sm" : "bg-muted/40 text-muted-foreground border-border")}
                      >
                        {email.forwardingEnabled ? "Enabled" : "Configure"}
                      </button>
                    </td>

                    <td className="px-6 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/it/email/${email.id}`);
                          }} 
                          className="p-1.5 text-muted-foreground hover:text-primary transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(`Update status for ${email.emailAddress}?`)) return;
                            setSuspending(email.id);
                            const newStatus = email.status === "active" ? "suspended" : "active";
                            await fetch(`/api/emails/${email.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
                            fetchEmails();
                            setSuspending(null);
                          }}
                          disabled={suspending === email.id}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
                        >
                          {suspending === email.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/5">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
            Showing {startEntry}–{endEntry} of {filteredEmails.length} Identities
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border rounded-lg disabled:opacity-20 hover:bg-muted transition-all"
            >
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
            <div className="px-3 text-[10px] font-black">{currentPage} <span className="opacity-30">/</span> {totalPages}</div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border rounded-lg disabled:opacity-20 hover:bg-muted transition-all"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
