"use client";

import { useState } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Briefcase,
  Key,
  Activity,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface SystemUserData {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  companyName?: string | null;
  isActive?: boolean;
}

interface UserFormProps {
  initialData?: SystemUserData;
  action: (formData: FormData) => Promise<void>;
}

export function UserForm({ initialData, action }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/50 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              User Management
            </p>
            <h1 className="text-2xl font-black tracking-tighter">
              {initialData ? "Edit Member Account" : "Provision New Account"}
            </h1>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="premium-card rounded-[32px] border border-border bg-card overflow-hidden shadow-xl shadow-black/5"
      >
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={initialData?.fullName}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Username{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  defaultValue={initialData?.username}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  placeholder="e.g. jdoe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={initialData?.email}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. john@company.com"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> System Role{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="role"
                    required
                    defaultValue={initialData?.role || "readonly"}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="hr">HR Manager</option>
                    <option value="it">IT Manager</option>
                    <option value="readonly">Read Only Access</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Company / Division
                </label>
                <input
                  type="text"
                  name="companyName"
                  defaultValue={initialData?.companyName || ""}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g. HQ"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" />{" "}
                  {initialData ? "Reset Password" : "Password"}{" "}
                  {initialData ? "" : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!initialData}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  placeholder={
                    initialData
                      ? "Leave blank to keep current password"
                      : "Enter secure password"
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm border border-border">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">Account Status</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-blackmt-0.5">
                  Allow user to authenticate
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  className="sr-only peer"
                  defaultChecked={initialData ? initialData.isActive : true}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
