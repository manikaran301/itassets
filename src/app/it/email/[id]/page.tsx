"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Tag,
  Lock,
  Globe,
  Plus,
  X,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/SearchableSelect";

const PLATFORM_OPTIONS = [
  { value: "google_workspace", label: "Google Workspace" },
  { value: "microsoft_365", label: "Microsoft 365" },
  { value: "zoho", label: "Zoho" },
  { value: "other", label: "Other/Custom" },
];

const ACCOUNT_TYPES = [
  { value: "personal", label: "Personal Account" },
  { value: "shared", label: "Shared Mailbox" },
  { value: "alias", label: "Email Alias" },
  { value: "distribution", label: "Distribution List" },
  { value: "service", label: "Service Account" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

interface EmailDetail {
  id: string;
  emailAddress: string;
  displayName: string;
  password: string | null;
  status: string;
  accountType: string;
  platform: string;
  employeeId: string | null;
  employee?: { id: string; fullName: string; employeeCode: string } | null;
  forwarding?: Array<{
    id: string;
    forwardToAddress: string;
    isActive: boolean;
  }>;
}

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const emailId = params.id as string;

  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    emailAddress: "",
    displayName: "",
    employeeId: "",
    accountType: "personal",
    platform: "google_workspace",
    status: "active",
    password: "",
  });

  const [forwardingAddresses, setForwardingAddresses] = useState<string[]>([]);
  const [newForwarding, setNewForwarding] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Email and Employees in parallel
        const [emailRes, empRes] = await Promise.all([
          fetch(`/api/emails/${emailId}`),
          fetch("/api/employees"),
        ]);

        if (!emailRes.ok) throw new Error("Failed to fetch account details.");
        
        const emailData = await emailRes.json();
        const empData = await empRes.json();

        const formattedEmps = empData.map((emp: any) => ({
          value: emp.id,
          label: `${emp.fullName} (${emp.employeeCode})`,
        }));
        setEmployees(formattedEmps);

        setEmail(emailData);
        setFormData({
          emailAddress: emailData.emailAddress,
          displayName: emailData.displayName,
          employeeId: emailData.employeeId || "",
          accountType: emailData.accountType,
          platform: emailData.platform || "google_workspace",
          status: emailData.status,
          password: emailData.password || "",
        });
        setForwardingAddresses(emailData.forwarding?.map((f: any) => f.forwardToAddress) || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [emailId]);

  const addForwarding = () => {
    if (newForwarding && !forwardingAddresses.includes(newForwarding)) {
      setForwardingAddresses([...forwardingAddresses, newForwarding]);
      setNewForwarding("");
    }
  };

  const removeForwarding = (addr: string) => {
    setForwardingAddresses(forwardingAddresses.filter((a) => a !== addr));
  };

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          forwardingAddresses
        }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to update email account.");
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/it/email");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">
          Synchronizing Identity...
        </p>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Identity Synchronized
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            All systems have been updated.
          </p>
        </div>
      </div>
    );
  }

  if (!email) return null;

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Sticky Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link
              href="/it/email"
              className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">
                Modify Identity
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest truncate max-w-[200px]">{email.emailAddress}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/it/email"
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Discard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Security Alert: {error}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Card (Identity) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Mail className="w-32 h-32 text-primary" />
              </div>

              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Core Identity
              </div>

              <div className="space-y-4 relative z-[50]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                      Email Address
                    </label>
                    <div className="relative group/field">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => updateField("emailAddress", e.target.value)}
                        className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                      Display Name
                    </label>
                    <div className="relative group/field">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => updateField("displayName", e.target.value)}
                        className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Account Owner
                    </label>
                    <SearchableSelect
                      options={employees}
                      value={formData.employeeId}
                      onChange={(val) => updateField("employeeId", val)}
                      placeholder="Select employee..."
                      icon={<UserPlus className="w-4 h-4" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Account Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCOUNT_TYPES.slice(0, 4).map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("accountType", type.value)}
                          className={cn(
                            "flex items-center justify-center px-2 py-2.5 rounded-xl border text-[8px] font-black uppercase tracking-tight transition-all",
                            formData.accountType === type.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/5 border-white/5 opacity-40"
                          )}
                        >
                          {type.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical & Security */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Technical & Security
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-[50]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    System Platform
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORM_OPTIONS.map((plt) => (
                      <button
                        key={plt.value}
                        type="button"
                        onClick={() => updateField("platform", plt.value)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                          formData.platform === plt.value
                            ? "bg-primary text-primary-foreground border-primary shadow-lg"
                            : "bg-muted/5 border-white/5 opacity-40 hover:opacity-100"
                        )}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {plt.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                    Credentials / Token
                  </label>
                  <div className="relative group/field">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-12 py-3.5 text-xs outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-4">
            {/* Status & Lifecycle */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Operational Status
              </div>
              <div className="space-y-2 relative z-10">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("status", opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.status === opt.value
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted/5 border-white/5 opacity-40 hover:opacity-100"
                    )}
                  >
                    {opt.label}
                    {formData.status === opt.value && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Forwarding */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Traffic Routes
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex gap-2">
                  <div className="flex-1 relative group/field">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <input
                      placeholder="Add route..."
                      value={newForwarding}
                      onChange={(e) => setNewForwarding(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForwarding())}
                      className="w-full bg-muted/10 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-[10px] outline-none font-bold"
                    />
                  </div>
                  <button onClick={addForwarding} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                  {forwardingAddresses.map((addr) => (
                    <div key={addr} className="group/item flex items-center justify-between px-3 py-2 bg-muted/5 border border-white/5 rounded-xl transition-all">
                      <span className="text-[10px] font-bold text-muted-foreground/60 truncate">{addr}</span>
                      <button onClick={() => removeForwarding(addr)} className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-500 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {forwardingAddresses.length === 0 && (
                    <p className="text-[9px] text-muted-foreground/20 font-black uppercase tracking-widest text-center py-4 border border-dashed border-white/5 rounded-2xl">Isolated</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
