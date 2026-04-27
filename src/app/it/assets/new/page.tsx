"use client";

import {
  ArrowLeft,
  Monitor,
  Server,
  HardDrive,
  Save,
  Cpu,
  Tag,
  DollarSign,
  StickyNote,
  Shield,
  Wifi,
  Globe,
  CheckCircle2,
  Loader2,
  Barcode,
  Layers,
  ScreenShare,
  Boxes,
  ShieldCheck,
  Calendar,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SeatSelectorModal } from "@/components/SeatSelectorModal";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableSelect } from "@/components/SearchableSelect";

// Format MAC address to use colons (D0:46:0C:8B:9B:C0)
const formatMacAddress = (mac: string): string => {
  // Remove all non-hex characters
  const cleaned = mac.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  // Insert colons every 2 characters
  const formatted = cleaned.match(/.{1,2}/g)?.join(":") || cleaned;
  // Limit to 17 characters (XX:XX:XX:XX:XX:XX)
  return formatted.slice(0, 17);
};

const DEVICE_TYPES = [
  { value: "laptop", label: "Laptop", icon: Monitor },
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "n_computing", label: "Zero Client", icon: ScreenShare },
  { value: "nuc", label: "NUC", icon: Boxes },
  { value: "server", label: "Server", icon: Server },
  { value: "printer", label: "Printer", icon: Package },
  { value: "switch", label: "Switch", icon: Globe },
  { value: "access_point", label: "Access Point", icon: Wifi },
  { value: "tv", label: "TV", icon: ScreenShare },
  { value: "nvr", label: "NVR", icon: Shield },
  { value: "dvr", label: "DVR", icon: Shield },
  { value: "other", label: "Other", icon: HardDrive },
];

const STATUS_OPTIONS = [
  {
    value: "available",
    label: "Available",
    color: "text-green-500 bg-green-500/10 border-green-500/30",
  },
  {
    value: "assigned",
    label: "Assigned",
    color: "text-primary bg-primary/10 border-primary/30",
  },
  {
    value: "in_repair",
    label: "In Repair",
    color: "text-accent bg-accent/10 border-accent/30",
  },
  {
    value: "retired",
    label: "Retired",
    color: "text-muted-foreground bg-muted border-border",
  },
];

const ANTIVIRUS_OPTIONS = [
  { value: "yes", label: "Active" },
  { value: "no", label: "None" },
  { value: "expired", label: "Expired" },
];

const ANTIVIRUS_NAMES = [
  { value: "McAfee", label: "McAfee Endpoint Security" },
  { value: "Norton", label: "Norton 360" },
  { value: "Windows Defender", label: "Windows Defender" },
  { value: "SentinelOne", label: "SentinelOne" },
  { value: "CrowdStrike", label: "CrowdStrike Falcon" },
  { value: "Bitdefender", label: "Bitdefender GravityZone" },
  { value: "Kaspersky", label: "Kaspersky Endpoint" },
  { value: "Sophos", label: "Sophos Intercept X" },
  { value: "ESET", label: "ESET Endpoint Security" },
  { value: "Trend Micro", label: "Trend Micro Apex One" },
  { value: "Other", label: "Other/Custom" },
];

const BRAND_OPTIONS = [
  { value: "Apple", label: "Apple" },
  { value: "HP", label: "HP" },
  { value: "Dell", label: "Dell" },
  { value: "Lenovo", label: "Lenovo" },
  { value: "ASUS", label: "ASUS" },
  { value: "Acer", label: "Acer" },
  { value: "N-Computing", label: "N-Computing" },
  { value: "Microsoft", label: "Microsoft" },
  { value: "Samsung", label: "Samsung" },
  { value: "MSI", label: "MSI" },
  { value: "Razer", label: "Razer" },
  { value: "Alienware", label: "Alienware" },
  { value: "Gigabyte", label: "Gigabyte" },
  { value: "Fujitsu", label: "Fujitsu" },
  { value: "Panasonic", label: "Panasonic" },
  { value: "Toshiba", label: "Toshiba" },
  { value: "LG", label: "LG" },
  { value: "HCL", label: "HCL" },
  { value: "Wipro", label: "Wipro" },
  { value: "Zebronics", label: "Zebronics" },
  { value: "Intex", label: "Intex" },
  { value: "Lava", label: "Lava" },
  { value: "Assembled", label: "Assembled" },
  { value: "OEM / White Box", label: "OEM / White Box" },
  { value: "Other", label: "Other" },
];

const SSD_TYPES = [
  { value: "NVMe", label: "NVMe / PCIe" },
  { value: "M.2", label: "M.2 SATA" },
  { value: "SATA", label: 'SATA 2.5"' },
];

const HDD_TYPES = [
  { value: "SATA", label: 'SATA 3.5" / 2.5"' },
  { value: "SAS", label: "SAS (Server)" },
  { value: "SCSI", label: "SCSI" },
];

const RAM_TYPES = [
  { value: "DDR3", label: "DDR3" },
  { value: "DDR4", label: "DDR4" },
  { value: "DDR5", label: "DDR5" },
  { value: "LPDDR4", label: "LPDDR4 (Mobile/Thin)" },
  { value: "LPDDR5", label: "LPDDR5" },
];

const PRINTER_CONNECTION_TYPES = [
  { value: "Network (LAN)", label: "Network (LAN)" },
  { value: "USB", label: "USB" },
  { value: "Wireless (Wi-Fi)", label: "Wireless (Wi-Fi)" },
  { value: "USB + LAN", label: "USB + LAN" },
  { value: "Bluetooth", label: "Bluetooth" },
  { value: "Other", label: "Other" },
];

export default function NewAssetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    assetTag: "",
    type: "laptop",
    make: "",
    model: "",
    cpu: "",
    ramGb: "",
    ramType: "",
    ssdGb: "",
    ssdType: "",
    hddGb: "",
    hddType: "",
    serialNumber: "",
    macAddress: "",
    ipAddress: "",
    graphicCard: "",
    monitorSize: "",
    lanPorts: "",
    screenSize: "",
    channel: "",
    rackNumber: "",
    allottedArea: "",
    installedCameras: "",
    connectionType: "",
    os: "",
    osVersion: "",
    antivirusName: "",
    antivirusStatus: "no",
    warrantyExpiry: "",
    purchaseDate: "",
    cost: "",
    status: "available",
    notes: "",
    workspaceId: "",
    workspaceCode: "",
  });

  // Field visibility per device type
  const fieldConfig: Record<string, string[]> = {
    desktop: [
      "cpu",
      "ramGb",
      "ramType",
      "ssdGb",
      "ssdType",
      "hddGb",
      "hddType",
      "graphicCard",
      "monitorSize",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "os",
      "osVersion",
      "antivirusName",
      "antivirusStatus",
    ],
    laptop: [
      "cpu",
      "ramGb",
      "ramType",
      "ssdGb",
      "ssdType",
      "hddGb",
      "hddType",
      "graphicCard",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "os",
      "osVersion",
      "antivirusName",
      "antivirusStatus",
    ],
    nuc: [
      "cpu",
      "ramGb",
      "ramType",
      "ssdGb",
      "ssdType",
      "hddGb",
      "hddType",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "os",
      "osVersion",
      "antivirusName",
      "antivirusStatus",
    ],
    n_computing: [
      "ramGb",
      "hddGb",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "os",
      "osVersion",
      "antivirusName",
      "antivirusStatus",
    ],
    server: [
      "cpu",
      "ramGb",
      "ramType",
      "ssdGb",
      "ssdType",
      "hddGb",
      "hddType",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "os",
      "osVersion",
      "antivirusName",
      "antivirusStatus",
    ],
    printer: ["serialNumber", "macAddress", "ipAddress", "connectionType"],
    switch: [
      "lanPorts",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "rackNumber",
    ],
    access_point: ["serialNumber", "macAddress", "ipAddress", "allottedArea"],
    tv: [
      "screenSize",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "allottedArea",
    ],
    nvr: [
      "channel",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "installedCameras",
    ],
    dvr: [
      "channel",
      "serialNumber",
      "macAddress",
      "ipAddress",
      "installedCameras",
    ],
    other: ["cpu", "ramGb", "serialNumber", "macAddress", "ipAddress"],
  };

  const isFieldVisible = (field: string) => {
    const config = fieldConfig[formData.type] || fieldConfig.other;
    return config.includes(field);
  };

  const showHardwareSpecs = [
    "desktop",
    "laptop",
    "nuc",
    "n_computing",
    "server",
  ].includes(formData.type);
  const showNetworkSoftware = [
    "desktop",
    "laptop",
    "nuc",
    "n_computing",
    "server",
  ].includes(formData.type);
  const showDeviceSpecific = [
    "printer",
    "switch",
    "access_point",
    "tv",
    "nvr",
    "dvr",
  ].includes(formData.type);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.assetTag.trim()) {
      setError("Asset Tag is required.");
      return;
    }
    if (!formData.type) {
      setError("Device Type is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        assetTag: formData.assetTag.trim(),
        type: formData.type,
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        cpu: formData.cpu.trim() || null,
        ramGb: formData.ramGb.trim() || null,
        ramType: formData.ramType || null,
        ssdGb: formData.ssdGb ? parseInt(formData.ssdGb) : null,
        ssdType: formData.ssdType || null,
        hddGb: formData.hddGb ? parseInt(formData.hddGb) : null,
        hddType: formData.hddType || null,
        serialNumber: formData.serialNumber.trim() || null,
        macAddress: formData.macAddress.trim() || null,
        ipAddress: formData.ipAddress.trim() || null,
        os: formData.os.trim() || null,
        osVersion: formData.osVersion.trim() || null,
        antivirusName: formData.antivirusName || null,
        antivirusStatus: formData.antivirusStatus,
        warrantyExpiry: formData.warrantyExpiry || null,
        purchaseDate: formData.purchaseDate || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        workspaceId: formData.workspaceId || null,
        changedBy: (session?.user as any)?.id || null,
      };

      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to register asset.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/it/assets");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = DEVICE_TYPES.find((t) => t.value === formData.type);

  // Summary counts for the sidebar
  const filledFields = [
    formData.assetTag,
    formData.make,
    formData.model,
    formData.cpu,
    formData.ramGb,
    formData.ssdGb,
    formData.serialNumber,
    formData.macAddress,
    formData.os,
    formData.purchaseDate,
    formData.cost,
  ].filter(Boolean).length;

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Asset Registered
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {formData.assetTag} has been added to the inventory.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold animate-pulse">
          Redirecting to inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-sm relative pb-20">
      {/* Page Header (Sticky) */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link
              href="/it/assets"
              className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent uppercase leading-none">
              Register Asset
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest italic pl-14">
            IT Infrastructure Inventory Enrollment
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/it/assets"
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Discard
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-3 bg-primary text-primary-foreground rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {submitting ? "Registering..." : "Register Asset"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-3 animate-fade-in">
          <Shield className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section 1: Device Identity */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              <span>1. Device Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 relative z-[60]">
              {/* Asset Tag */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Asset Tag *
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="LPT-001"
                    value={formData.assetTag}
                    onChange={(e) => updateField("assetTag", e.target.value)}
                    className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs text-foreground outline-none transition-all font-mono tracking-widest font-black uppercase placeholder:font-semibold placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              {/* Make */}
              <SearchableSelect
                label="Make / Brand"
                options={BRAND_OPTIONS}
                value={formData.make}
                onChange={(val) => updateField("make", val)}
                placeholder="Select brand..."
                allowCustom
              />

              {/* Model */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="MacBook Pro M3 Max"
                  value={formData.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs text-foreground outline-none transition-all font-bold placeholder:font-semibold placeholder:text-muted-foreground/70"
                />
              </div>

              {/* Serial Number */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
                  Serial Number
                </label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="SN-XXXX-XXXX"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      updateField("serialNumber", e.target.value)
                    }
                    className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs text-foreground outline-none transition-all font-mono tracking-wider font-bold placeholder:font-semibold placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>
            </div>

            {/* Device Type Selector */}
            <div className="mt-6 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-3 block">
                Device Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {DEVICE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("type", type.value)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-[24px] border transition-all relative group/type",
                      formData.type === type.value
                        ? "bg-primary/20 border-primary/40 shadow-sm scale-105"
                        : "bg-muted/10 border-white/5 opacity-50 hover:opacity-80 hover:border-white/10",
                    )}
                  >
                    <type.icon
                      className={cn(
                        "w-6 h-6 transition-transform group-hover/type:rotate-6",
                        formData.type === type.value
                          ? "text-primary scale-110"
                          : "text-muted-foreground/50",
                      )}
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {type.label}
                    </p>
                    {formData.type === type.value && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Hardware Specifications (Only for compute devices) */}
          {showHardwareSpecs && (
            <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_var(--secondary)]" />
                <span>2. Hardware Specifications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 relative z-10">
                {/* CPU */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    CPU / Processor
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30 group-focus-within/field:text-secondary transition-colors" />
                    <input
                      type="text"
                      placeholder="M3 Max 14-core"
                      value={formData.cpu}
                      onChange={(e) => updateField("cpu", e.target.value)}
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* RAM (GB) */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    RAM (GB)
                  </label>
                  <input
                    type="text"
                    placeholder="16"
                    value={formData.ramGb}
                    onChange={(e) => updateField("ramGb", e.target.value)}
                    className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono font-black"
                  />
                </div>

                {/* RAM Type */}
                <SearchableSelect
                  label="RAM Type"
                  options={RAM_TYPES}
                  value={formData.ramType}
                  onChange={(val) => updateField("ramType", val)}
                  placeholder="Select RAM Type..."
                  allowCustom
                />

                {/* Storage Devices (All on 1 Line) */}
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                  {/* SSD Storage */}
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      SSD (GB)
                    </label>
                    <input
                      type="number"
                      placeholder="512"
                      value={formData.ssdGb}
                      onChange={(e) => updateField("ssdGb", e.target.value)}
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono font-black"
                    />
                  </div>

                  {/* SSD Type */}
                  <SearchableSelect
                    label="SSD Type"
                    options={SSD_TYPES}
                    value={formData.ssdType}
                    onChange={(val) => updateField("ssdType", val)}
                    placeholder="Select SSD Type..."
                    allowCustom
                  />

                  {/* HDD Storage */}
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      HDD (GB)
                    </label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={formData.hddGb}
                      onChange={(e) => updateField("hddGb", e.target.value)}
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono font-black"
                    />
                  </div>

                  {/* HDD Type */}
                  <SearchableSelect
                    label="HDD Type"
                    options={HDD_TYPES}
                    value={formData.hddType}
                    onChange={(val) => updateField("hddType", val)}
                    placeholder="Select HDD Type..."
                    allowCustom
                  />
                </div>
              </div>

              {/* Graphic Card - Desktop & Laptop */}
              {isFieldVisible("graphicCard") && (
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Graphic Card
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., NVIDIA GeForce RTX 3060"
                    value={formData.graphicCard}
                    onChange={(e) => updateField("graphicCard", e.target.value)}
                    className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                  />
                </div>
              )}

              {/* Monitor Size - Desktop only */}
              {isFieldVisible("monitorSize") && (
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    Monitor Size
                  </label>
                  <input
                    type="text"
                    placeholder='e.g., 24"'
                    value={formData.monitorSize}
                    onChange={(e) => updateField("monitorSize", e.target.value)}
                    className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                  />
                </div>
              )}
            </div>
          )}

          {/* Section 2b: Device-Specific Specifications (for non-compute devices) */}
          {showDeviceSpecific && (
            <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_var(--secondary)]" />
                <span>2. Device Specifications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 relative z-10">
                {/* MAC Address */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    placeholder="D0:46:0C:8B:9B:C0"
                    value={formData.macAddress}
                    onChange={(e) =>
                      updateField(
                        "macAddress",
                        formatMacAddress(e.target.value),
                      )
                    }
                    className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono font-bold tracking-wider uppercase"
                  />
                </div>

                {isFieldVisible("connectionType") && (
                  <SearchableSelect
                    label="Connection Type"
                    options={PRINTER_CONNECTION_TYPES}
                    value={formData.connectionType}
                    onChange={(val) => updateField("connectionType", val)}
                    placeholder="Select connection..."
                    allowCustom
                  />
                )}

                {/* IP Address */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) => updateField("ipAddress", e.target.value)}
                    className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono font-bold tracking-wider"
                  />
                </div>

                {/* LAN Ports - Switch only */}
                {isFieldVisible("lanPorts") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      LAN Ports
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 24"
                      value={formData.lanPorts}
                      onChange={(e) => updateField("lanPorts", e.target.value)}
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}

                {/* Screen Size - TV only */}
                {isFieldVisible("screenSize") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Screen Size
                    </label>
                    <input
                      type="text"
                      placeholder='e.g., 55"'
                      value={formData.screenSize}
                      onChange={(e) =>
                        updateField("screenSize", e.target.value)
                      }
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}

                {/* Channel - NVR/DVR only */}
                {isFieldVisible("channel") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Channel
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 16CH"
                      value={formData.channel}
                      onChange={(e) => updateField("channel", e.target.value)}
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}

                {/* Rack Number - Switch only */}
                {isFieldVisible("rackNumber") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Rack Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., RACK-01"
                      value={formData.rackNumber}
                      onChange={(e) =>
                        updateField("rackNumber", e.target.value)
                      }
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}

                {/* Allotted Area - Access Point/TV only */}
                {isFieldVisible("allottedArea") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Allotted Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Floor 2 - Conference Room"
                      value={formData.allottedArea}
                      onChange={(e) =>
                        updateField("allottedArea", e.target.value)
                      }
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}

                {/* Installed Cameras - NVR/DVR only */}
                {isFieldVisible("installedCameras") && (
                  <div className="group/field space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      No. of Installed Cameras
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 8"
                      value={formData.installedCameras}
                      onChange={(e) =>
                        updateField("installedCameras", e.target.value)
                      }
                      className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Network & Software (Only for compute devices) */}
          {showNetworkSoftware && (
            <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 relative z-10">
                <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]" />
                <span>3. Network & Software</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 relative z-10">
                {/* MAC Address */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    MAC Address
                  </label>
                  <div className="relative">
                    <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30 group-focus-within/field:text-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="D0:46:0C:8B:9B:C0"
                      value={formData.macAddress}
                      onChange={(e) =>
                        updateField(
                          "macAddress",
                          formatMacAddress(e.target.value),
                        )
                      }
                      className="w-full bg-accent/5 border border-accent/20 focus:border-accent/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-mono font-bold tracking-wider uppercase"
                    />
                  </div>
                </div>

                {/* IP Address */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    IP Address
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30 group-focus-within/field:text-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={formData.ipAddress}
                      onChange={(e) => updateField("ipAddress", e.target.value)}
                      className="w-full bg-accent/5 border border-accent/20 focus:border-accent/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-mono font-bold tracking-wider"
                    />
                  </div>
                </div>

                {/* Antivirus Name */}
                <SearchableSelect
                  label="Antivirus Software"
                  options={ANTIVIRUS_NAMES}
                  value={formData.antivirusName}
                  onChange={(val) => updateField("antivirusName", val)}
                  placeholder="Software Name..."
                  icon={<ShieldCheck className="w-4 h-4" />}
                  allowCustom
                />

                {/* Antivirus Status */}
                <SearchableSelect
                  label="Shield Status"
                  options={ANTIVIRUS_OPTIONS}
                  value={formData.antivirusStatus}
                  onChange={(val) => updateField("antivirusStatus", val)}
                  placeholder="Status..."
                />

                {/* OS */}
                <SearchableSelect
                  label="Operating System"
                  options={[
                    { value: "Windows", label: "Windows (Desktop/Server)" },
                    { value: "macOS", label: "macOS (Apple)" },
                    { value: "Linux", label: "Linux (Ubuntu/CentOS/RedHat)" },
                    { value: "ChromeOS", label: "ChromeOS (Google)" },
                    { value: "Android", label: "Android (Mobile/Tab)" },
                    { value: "iOS", label: "iOS (iPhone/iPad)" },
                  ]}
                  value={formData.os}
                  onChange={(val) => updateField("os", val)}
                  placeholder="Select OS..."
                  allowCustom
                />

                {/* OS Version */}
                <div className="group/field space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    OS Version
                  </label>
                  <input
                    type="text"
                    placeholder="Sonoma 14.5"
                    value={formData.osVersion}
                    onChange={(e) => updateField("osVersion", e.target.value)}
                    className="w-full bg-accent/5 border border-accent/20 focus:border-accent/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Assignment & Location */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative group z-25">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              <span>4. Assignment & Location</span>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Assigned Workspace / Seat
                </label>
                <div className="flex gap-2">
                  <div className="relative group/field flex-1">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Not Assigned..."
                      value={formData.workspaceCode}
                      readOnly
                      className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-[20px] pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-mono font-black tracking-widest cursor-default"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSeatModalOpen(true)}
                    className="px-6 py-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Browse
                  </button>
                </div>
                <SeatSelectorModal
                  isOpen={isSeatModalOpen}
                  onClose={() => setIsSeatModalOpen(false)}
                  selectedId={formData.workspaceId}
                  onSelect={(ws) => {
                    updateField("workspaceId", ws.id);
                    updateField("workspaceCode", ws.code);
                    setIsSeatModalOpen(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Purchase & Status */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden group z-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              <span>5. Purchase & Status</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 relative z-10">
              {/* Purchase Date */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Purchase Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      updateField("purchaseDate", e.target.value)
                    }
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-black"
                  />
                </div>
              </div>

              {/* Warranty Expiry */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Warranty Expiry
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) =>
                      updateField("warrantyExpiry", e.target.value)
                    }
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-black"
                  />
                </div>
              </div>

              {/* Cost */}
              <div className="group/field space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Cost (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input
                    type="number"
                    placeholder="85000"
                    value={formData.cost}
                    onChange={(e) => updateField("cost", e.target.value)}
                    className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-mono font-black"
                  />
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="mt-6 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-3 block">
                Initial Status
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => updateField("status", status.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-4 rounded-[20px] border transition-all text-[10px] font-black uppercase tracking-widest",
                      formData.status === status.value
                        ? cn(status.color, "shadow-md scale-105")
                        : "bg-muted/10 border-white/5 opacity-40 hover:opacity-70",
                    )}
                  >
                    {status.label}
                    {formData.status === status.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6 relative z-10 group/field space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Notes / Remarks
              </label>
              <div className="relative">
                <StickyNote className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                <textarea
                  placeholder="Additional information about the asset..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-bold resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview Sidebar (4 Cols) */}
        <div className="xl:col-span-4 sticky top-10 flex flex-col items-center gap-8">
          {/* Asset Preview Card */}
          <div className="w-full max-w-[340px] bg-white dark:bg-[#0A0A0A] rounded-[48px] border border-black/5 dark:border-white/10 relative overflow-hidden flex flex-col group/card">
            {/* Background Visuals */}
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            {/* Header */}
            <div className="px-10 pt-10 text-center relative z-10">
              <p className="text-[9px] font-black tracking-[0.4em] uppercase text-primary/40 mb-1">
                M_AMS ASSET
              </p>
              <div className="w-2 h-0.5 bg-primary/40 mx-auto rounded-full" />
            </div>

            {/* Icon Section */}
            <div className="p-10 pb-6 relative z-10 text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg relative z-10 group-hover/card:scale-105 transition-transform duration-500 overflow-hidden">
                  {formData.make &&
                  !["Other", "Assembled", "OEM / White Box"].includes(
                    formData.make,
                  ) ? (
                    <Image
                      src={`https://cdn.simpleicons.org/${formData.make.toLowerCase().replace(/[^a-z0-9]/g, "")}/0ea5e9`}
                      alt={formData.make}
                      width={64}
                      height={64}
                      className="object-contain drop-shadow-md transition-all duration-300"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        if (target.nextElementSibling) {
                          (
                            target.nextElementSibling as HTMLElement
                          ).style.display = "block";
                        }
                      }}
                    />
                  ) : null}

                  <div
                    style={{
                      display:
                        formData.make &&
                        !["Other", "Assembled", "OEM / White Box"].includes(
                          formData.make,
                        )
                          ? "none"
                          : "block",
                    }}
                  >
                    {selectedType && (
                      <selectedType.icon className="w-16 h-16 text-primary/60" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                  Asset Identity
                </p>
                <h4 className="text-2xl font-black tracking-tight text-foreground leading-none truncate px-4">
                  {formData.assetTag || "LPT-XXX"}
                </h4>
                <p className="text-[10px] text-muted-foreground/50 font-bold italic uppercase">
                  {formData.make} {formData.model}
                </p>
              </div>
            </div>

            {/* Data Rows */}
            <div className="px-10 pb-8 space-y-4 relative z-10">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-[24px] border border-black/5 dark:border-white/5 space-y-3 relative group/stats">
                {/* Dynamic Cost Overlay if filled */}
                {formData.cost && (
                  <div className="absolute -top-3 -right-2 bg-green-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full shadow-md shadow-green-500/10 transform rotate-12 scale-90 group-hover/stats:rotate-0 group-hover/stats:scale-100 transition-all duration-300">
                    ₹{Number(formData.cost).toLocaleString("en-IN")}
                  </div>
                )}
                {/* Dynamic Warranty Badge */}
                {formData.warrantyExpiry && (
                  <div className="absolute -top-3 -left-2 bg-blue-500 text-white text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full shadow-md shadow-blue-500/10 -rotate-6 scale-90 group-hover/stats:rotate-0 group-hover/stats:scale-100 transition-all duration-300 flex items-center gap-1 uppercase">
                    {new Date(formData.warrantyExpiry) > new Date()
                      ? "🛡️ In Warranty"
                      : "⚠️ Expired"}
                  </div>
                )}

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-secondary/40" />
                    Processor
                  </span>
                  <span
                    className={cn(
                      "font-black",
                      formData.cpu ? "text-secondary" : "opacity-30 italic",
                    )}
                  >
                    {formData.cpu || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-primary/40" />
                    Memory
                  </span>
                  <span
                    className={cn(
                      "font-black",
                      formData.ramGb ? "text-primary" : "opacity-30 italic",
                    )}
                  >
                    {formData.ramGb ? `${formData.ramGb}GB` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-2">
                    <HardDrive className="w-3 h-3 text-accent/40" />
                    Storage
                  </span>
                  <span
                    className={cn(
                      "font-black",
                      formData.ssdGb || formData.hddGb
                        ? "text-accent"
                        : "opacity-30 italic",
                    )}
                  >
                    {formData.ssdGb
                      ? `${formData.ssdGb}GB SSD`
                      : formData.hddGb
                        ? `${formData.hddGb}GB HDD`
                        : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-green-500/40" />
                    Status
                  </span>
                  <span
                    className={cn(
                      "font-black px-2 py-0.5 rounded-full text-[8px] border uppercase",
                      formData.status === "available"
                        ? "bg-green-500/20 text-green-500 border-green-500/20"
                        : formData.status === "assigned"
                          ? "bg-primary/20 text-primary border-primary/20"
                          : formData.status === "in_repair"
                            ? "bg-accent/20 text-accent border-accent/20"
                            : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {formData.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Completion Meter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                  <span>Field Completion</span>
                  <span
                    className={cn(
                      filledFields < 5
                        ? "text-red-500"
                        : filledFields < 9
                          ? "text-orange-500"
                          : "text-green-500",
                    )}
                  >
                    {filledFields}/11
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      filledFields < 5
                        ? "bg-red-500"
                        : filledFields < 9
                          ? "bg-orange-500"
                          : "bg-green-500",
                    )}
                    style={{ width: `${(filledFields / 11) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto bg-primary/5 p-8 border-t border-white/5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary/40" />
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    {formData.type.toUpperCase()}
                  </p>
                  <p className="text-[10px] font-black text-primary/60 italic uppercase tracking-tighter">
                    {formData.serialNumber || "No Serial"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
