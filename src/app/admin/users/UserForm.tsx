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
  Globe,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { PermissionMatrixModal } from "./PermissionMatrixModal";
import { SearchableSelect } from "@/components/SearchableSelect";

interface SystemUserData {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  companyId?: string | null;
  companyName?: string | null;
  isActive?: boolean;
  managedLocations?: { id: string; name: string }[];
}

interface UserFormProps {
  initialData?: SystemUserData;
  action: (formData: FormData) => Promise<void>;
}

export function UserForm({ initialData, action }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [masterCompanies, setMasterCompanies] = useState<any[]>([]);
  const [masterLocations, setMasterLocations] = useState<any[]>([]);
  const [role, setRole] = useState(initialData?.role || "readonly");
  const [companyId, setCompanyId] = useState(initialData?.companyId || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialData?.managedLocations?.map((l) => l.id) || []
  );

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [companiesRes, locationsRes] = await Promise.all([
          fetch("/api/admin/master-data/companies"),
          fetch("/api/admin/master-data/locations"),
        ]);
        if (companiesRes.ok) setMasterCompanies(await companiesRes.json());
        if (locationsRes.ok) setMasterLocations(await locationsRes.json());
      } catch (error) {
        console.error("Failed to fetch master data:", error);
      }
    };
    fetchMasterData();
  }, []);

  const toggleLocation = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      // Ensure permissions are included as JSON string
      formData.set("permissions", JSON.stringify(permissions));
      
      // Clear previous locationIds and set new ones
      formData.delete("locationIds");
      selectedLocations.forEach(id => formData.append("locationIds", id));

      // Get selected company name for convenience
      const companyId = formData.get("companyId");
      const company = masterCompanies.find(c => c.id === companyId);
      if (company) formData.set("companyName", company.name);

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
                <SearchableSelect
                  options={[
                    { value: "admin", label: "ADMINISTRATOR (FULL ACCESS)" },
                    { value: "hr", label: "HR MANAGER" },
                    { value: "it", label: "IT MANAGER" },
                    { value: "readonly", label: "READ ONLY ACCESS" },
                  ]}
                  value={role}
                  onChange={setRole}
                  placeholder="SELECT SYSTEM ROLE"
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  compact
                />
                <input type="hidden" name="role" value={role} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Company / Division
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "UNASSIGNED" },
                    ...masterCompanies.map(c => ({ value: c.id, label: c.name.toUpperCase() }))
                  ]}
                  value={companyId}
                  onChange={setCompanyId}
                  placeholder="SELECT COMPANY"
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  compact
                />
                <input type="hidden" name="companyId" value={companyId} />
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

          {/* New Managed Locations Section */}
          <div className="pt-8 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Site Authorization Scope
                </label>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                  Select physical locations this user is authorized to manage
                </p>
              </div>
              <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                {selectedLocations.length} SITES SELECTED
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {masterLocations.map((loc) => {
                const isSelected = selectedLocations.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left group",
                      isSelected
                        ? "bg-primary/5 border-primary/40 shadow-sm"
                        : "bg-muted/10 border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tight",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}>
                        {loc.name}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">
                        Physical Site
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary animate-in zoom-in duration-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-4">
            {!initialData && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Security Matrix</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {permissions.length === 0 ? "Default permissions will be applied" : `${permissions.length} granular rules configured`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermsModal(true)}
                  className="px-4 py-2 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Configure Permissions
                </button>
              </div>
            )}

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

      {showPermsModal && (
        <PermissionMatrixModal
          initialPermissions={permissions}
          onSave={(newPerms) => {
            setPermissions(newPerms);
            setShowPermsModal(false);
          }}
          onClose={() => setShowPermsModal(false)}
        />
      )}
    </div>
  );
}
