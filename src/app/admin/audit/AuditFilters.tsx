"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, User, Shield, Activity, X } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";

export function AuditFilters({ users }: { users: { id: string; fullName: string; role: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentAction = searchParams.get("action") || "";
  const currentUser = searchParams.get("user") || "";
  const currentRole = searchParams.get("role") || "";

  const userOptions = [
    { value: "", label: "All Users" },
    ...users.map(u => ({ value: u.id, label: `${u.fullName} (${u.role.toUpperCase()})` }))
  ];

  const actionOptions = [
    { value: "", label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "updated", label: "Updated" },
    { value: "deleted", label: "Deleted" },
    { value: "status_changed", label: "Status Changed" }
  ];

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR" },
    { value: "it", label: "IT" },
    { value: "readonly", label: "Read Only" }
  ];

  return (
    <div className="relative z-50 flex flex-wrap items-center gap-4 mb-6 p-4 rounded-3xl border border-white/5 bg-card/40 backdrop-blur-xl shadow-lg">
      <div className="flex items-center gap-2 mr-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
      </div>

      <div className="w-[240px]">
        <SearchableSelect
          options={userOptions}
          value={currentUser}
          onChange={val => handleFilter("user", val)}
          placeholder="All Users"
          icon={<User className="w-4 h-4" />}
        />
      </div>

      <div className="w-[200px]">
        <SearchableSelect
          options={actionOptions}
          value={currentAction}
          onChange={val => handleFilter("action", val)}
          placeholder="All Actions"
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      <div className="w-[200px]">
        <SearchableSelect
          options={roleOptions}
          value={currentRole}
          onChange={val => handleFilter("role", val)}
          placeholder="All Roles"
          icon={<Shield className="w-4 h-4" />}
        />
      </div>

      {(currentUser || currentAction || currentRole) && (
        <button 
          onClick={() => router.push(pathname)}
          className="ml-auto flex items-center gap-1.5 px-4 py-3 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
