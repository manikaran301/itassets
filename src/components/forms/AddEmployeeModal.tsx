"use client";

import {
  X,
  UserPlus,
  MapPin,
  Monitor,
  Smartphone,
  Save,
  Mail,
  PhoneCall as SimIcon,
  User,
  LayoutGrid,
  Clock,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AssetKey = "reqLaptop" | "reqDesktop" | "reqPhone" | "reqSim" | "reqEmail";

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    employee_code: "",
    personal_email: "",
    personal_phone: "",
    department: "",
    designation: "",
    reporting_manager_id: "",
    location_joining: "",
    joining_date: "",
    seat_allocation: "",
    reqLaptop: true,
    reqDesktop: false,
    reqPhone: false,
    reqSim: false,
    reqEmail: true,
  });

  const toggleAsset = (key: AssetKey) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const activeAssets = [
    {
      id: "reqLaptop" as AssetKey,
      label: "Laptop",
      active: formData.reqLaptop,
      icon: Laptop,
    },
    {
      id: "reqDesktop" as AssetKey,
      label: "Desktop",
      active: formData.reqDesktop,
      icon: Monitor,
    },
    {
      id: "reqPhone" as AssetKey,
      label: "Phone",
      active: formData.reqPhone,
      icon: Smartphone,
    },
    {
      id: "reqSim" as AssetKey,
      label: "SIM",
      active: formData.reqSim,
      icon: SimIcon,
    },
    {
      id: "reqEmail" as AssetKey,
      label: "Email ID",
      active: formData.reqEmail,
      icon: Mail,
    },
  ];

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-card w-full max-w-5xl rounded-[32px] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden premium-card flex flex-col h-fit max-h-[96vh] relative animate-scale-in">
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-[96px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary/5 rounded-full blur-[96px] pointer-events-none" />

        {/* Header */}
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-primary to-primary/40 text-primary-foreground flex items-center justify-center shadow-lg ring-2 ring-primary/10">
              <UserPlus className="w-6 min-w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black tracking-tight text-foreground uppercase leading-none">
                Add Employee
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 italic">
                Multi-Role Onboarding Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-all group ring-1 ring-white/5"
          >
            <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Main Form Area */}
          <div className="flex-1 p-8 overflow-y-auto space-y-10 scrollbar-hide">
            {/* 1. EMPLOYEE INFORMATION (HR DATA) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                <div className="w-1 h-1 bg-primary rounded-full" />
                <span>Employee Information (Initiated by HR)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Liam Draft..."
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] pl-11 pr-4 py-3 text-xs outline-none transition-all shadow-inner font-bold"
                    />
                  </div>
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-001"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all font-mono tracking-widest font-black"
                  />
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    placeholder="onboarding@identity.com"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all"
                  />
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Personal Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 XXXX XXXX"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Engineering"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all"
                  />
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Systems Engineer"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all"
                  />
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Reporting To
                  </label>
                  <input
                    type="text"
                    placeholder="Manager ID"
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[18px] px-4 py-3 text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary font-black ml-1">
                    Joining Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 transition-colors group-focus-within:text-white" />
                    <input
                      type="text"
                      placeholder="Bangalore Office"
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[18px] pl-11 pr-4 py-3 text-xs outline-none transition-all font-black group-focus-within:text-white"
                    />
                  </div>
                </div>
                <div className="group space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary font-black ml-1">
                    Expected Join Date
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 transition-colors group-focus-within:text-white" />
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          joining_date: e.target.value,
                        })
                      }
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[18px] pl-11 pr-4 py-3 text-xs outline-none transition-all font-black group-focus-within:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PROVISIONING REQUESTS (FULFILLMENT SUITE) */}
            <div className="space-y-6 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent/80">
                  <div className="w-1 h-1 bg-accent rounded-full shadow-[0_0_4px_rgba(var(--accent-rgb),0.5)]" />
                  <span>Provisioning Requests (Fulfillment Suite)</span>
                </div>
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                  Seat & Assets Bundle
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="group space-y-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Seat Allocation
                  </label>
                  <div className="relative">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40 group-focus-within:text-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="Assign Seat ID"
                      value={formData.seat_allocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seat_allocation: e.target.value,
                        })
                      }
                      className="w-full bg-accent/5 border border-accent/20 focus:border-accent/40 rounded-[18px] pl-11 pr-4 py-3.5 text-xs outline-none transition-all font-mono font-black"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3 md:col-span-3">
                  {activeAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-[20px] border transition-all relative overflow-hidden",
                        asset.active
                          ? "bg-primary/20 border-primary/40 shadow-lg"
                          : "bg-muted/10 border-white/5 opacity-40 grayscale",
                      )}
                    >
                      <asset.icon
                        className={cn(
                          "w-4 h-4 transition-transform",
                          asset.active ? "scale-110 text-primary" : "",
                        )}
                      />
                      <div className="text-center">
                        <p className="text-[7px] font-black uppercase tracking-tighter opacity-50">
                          {asset.active ? "Required" : "Skip"}
                        </p>
                        <p className="text-[9px] font-black tracking-tight leading-none truncate w-full">
                          {asset.label}
                        </p>
                      </div>
                      {asset.active && (
                        <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-primary rounded-full animate-pulse shadow-[0_0_4px_rgba(var(--primary-rgb),0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (SUMMARY) */}
          <div className="w-72 border-l border-white/5 bg-white/[0.005] p-8 hidden xl:flex flex-col space-y-10 shrink-0">
            <div className="space-y-1.5">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                HR/Admin Handover Protocol
              </h4>
              <p className="text-xl font-bold tracking-tight">
                Onboarding Prep
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-muted/20 border border-white/5 rounded-[32px] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl border border-primary/10">
                    ?
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                      Joining Identity
                    </p>
                    <p className="text-xs font-black truncate text-foreground/90">
                      {formData.full_name || "Liam Draft..."}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-bold">
                    <span>Compliance</span>
                    <span className="text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/10 font-black">
                      Ready
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-bold">
                    <span>Seating</span>
                    <span
                      className={cn(
                        "transition-colors font-black",
                        formData.seat_allocation
                          ? "text-secondary"
                          : "italic opacity-40",
                      )}
                    >
                      {formData.seat_allocation ? "Allocated" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-bold">
                    <span>IT Load</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {activeAssets
                          .filter((a) => a.active)
                          .map((a) => (
                            <div
                              key={a.id}
                              className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform"
                            >
                              <a.icon className="w-3 h-3" />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest italic text-primary">
                  Awaiting HR Dispatch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01] relative z-10 shrink-0">
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20 leading-none italic">
              Protocol Sync v5.3
            </p>
            <p className="text-xs font-bold text-muted-foreground/40 italic">
              Syncing Fulfillment Suite v2
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-all"
            >
              Discard
            </button>
            <button className="px-14 py-4 bg-primary text-primary-foreground rounded-[24px] shadow-2xl shadow-primary/40 text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-3">
              <Save className="w-5 h-5 shadow-inner" />
              Enroll Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
