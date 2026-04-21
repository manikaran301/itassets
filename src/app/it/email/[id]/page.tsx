"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Save, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface EmailDetail {
  id: string;
  emailAddress: string;
  displayName: string;
  password: string | null;
  status: string;
  accountType: string;
  forwardingEnabled: boolean;
  employee?: { id: string; fullName: string; employeeCode: string } | null;
  forwarding?: Array<{
    id: string;
    forwardToAddress: string;
    forwardType: string;
    isActive: boolean;
  }>;
}

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const emailId = params.id as string;

  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    password: "",
    status: "active",
  });

  useEffect(() => {
    fetchEmail();
  }, [emailId]);

  const fetchEmail = async () => {
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmail(data);
      setFormData({
        displayName: data.displayName,
        password: data.password || "",
        status: data.status,
      });
    } catch (error) {
      console.error("Failed to fetch email:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Email details updated successfully!");
      router.push("/it/email");
    } catch (error) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Email not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/it/email"
            className="p-2 hover:bg-muted rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              {email.emailAddress}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {email.accountType} account
              {email.employee && ` • ${email.employee.fullName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-card/40 border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Display Name */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full mt-2 px-4 py-3 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 pr-12 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-foreground"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Leave blank to keep current password
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full mt-2 px-4 py-3 bg-muted/40 border border-white/10 rounded-xl outline-none focus:border-primary/30 transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Sidebar - Info */}
        <div className="space-y-4">
          {/* Email Info */}
          <div className="bg-card/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                Email Address
              </p>
              <p className="text-sm font-bold mt-1">{email.emailAddress}</p>
            </div>

            {email.employee && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  Employee
                </p>
                <p className="text-sm font-bold mt-1">
                  {email.employee.fullName}
                </p>
                <p className="text-[10px] text-muted-foreground/50">
                  {email.employee.employeeCode}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                Account Type
              </p>
              <p className="text-sm font-bold mt-1 capitalize">
                {email.accountType}
              </p>
            </div>
          </div>

          {/* Forwarding */}
          {email.forwarding && email.forwarding.length > 0 && (
            <div className="bg-card/40 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3">
                Forwards To ({email.forwarding.length})
              </p>
              <div className="space-y-2">
                {email.forwarding.map((fwd) => (
                  <div
                    key={fwd.id}
                    className="text-xs font-bold bg-muted/20 rounded-lg p-2"
                  >
                    {fwd.forwardToAddress}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
