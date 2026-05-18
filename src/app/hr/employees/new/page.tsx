"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  Save, 
  Shield, 
  Scan, 
  User, 
  Hash, 
  Mail, 
  Smartphone, 
  Globe, 
  MapPin, 
  Calendar, 
  Briefcase, 
  LayoutGrid, 
  Laptop, 
  Monitor, 
  PhoneCall as SimIcon, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { SeatSelectorModal } from "@/components/SeatSelectorModal";

interface ManagerOption {
  value: string;
  label: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { checkPermission, loading: permsLoading } = usePermissions();
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [designations, setDesignations] = useState<{ value: string; label: string }[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    employeeCode: "",
    personalEmail: "",
    personalPhone: "",
    department: "",
    designation: "",
    companyName: "",
    reportingManagerId: "",
    locationJoining: "",
    deskNumber: "",
    startDate: "",
    status: "active",
    workspaceId: "",
    upcomingId: searchParams.get("upcomingId") || "",
    companyId: "",
    locationId: "",
    priorExperienceMonths: 0,
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [provisions, setProvisions] = useState({
    laptop: true,
    desktop: false,
    phone: false,
    sim: false,
    email: true,
  });

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
  const fetchSupportData = async () => {
    try {
      // Fetch Managers
      const empRes = await fetch("/api/employees");
      const empData = await empRes.json();
      const data = empData.data || empData;
      const managerList = data.map((e: any) => ({
        value: e.id,
        label: `${e.fullName} (${e.employeeCode})`,
      }));
      setManagers(managerList);

      // Fetch Master Data
      const [compRes, deptRes, desigRes, locRes] = await Promise.all([
        fetch("/api/admin/master-data/companies"),
        fetch("/api/admin/master-data/departments"),
        fetch("/api/admin/master-data/designations"),
        fetch("/api/admin/master-data/locations"),
      ]);

      const [compData, deptData, desigData, locData] = await Promise.all([
        compRes.json(),
        deptRes.json(),
        desigRes.json(),
        locRes.json(),
      ]);

      if (Array.isArray(compData)) setCompanies(compData.map(c => ({ value: c.id, label: c.name })));
      if (Array.isArray(deptData)) setDepartments(deptData.map(d => ({ value: d.name, label: d.name })));
      if (Array.isArray(desigData)) setDesignations(desigData.map(d => ({ value: d.name, label: d.name })));
      if (Array.isArray(locData)) setLocations(locData.map(l => ({ value: l.id, label: l.state ? `${l.name} (${l.state})` : l.name })));

      setLoadingManagers(false);
    } catch (error) {
      console.error("Failed to fetch support data:", error);
    }
  };
    fetchSupportData();
  }, []);

  useEffect(() => {
    const fetchUpcomingData = async () => {
      const upcomingId = searchParams.get("upcomingId");
      if (!upcomingId) return;

      try {
        const parseExpToMonths = (expStr: string) => {
          if (!expStr || expStr.toLowerCase().includes('fresher')) return 0;
          let totalMonths = 0;
          const yearsMatch = expStr.match(/(\d+)\s*year/i);
          if (yearsMatch) totalMonths += parseInt(yearsMatch[1]) * 12;
          const monthsMatch = expStr.match(/(\d+)\s*month/i);
          if (monthsMatch) totalMonths += parseInt(monthsMatch[1]);
          return totalMonths;
        };

        const res = await fetch(`/api/hr/upcoming?id=${upcomingId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        let matchedManagerId = "";
        if (data.reportingManager && managers.length > 0) {
          const match = managers.find(m => 
            m.label.toLowerCase().trim().includes(data.reportingManager.toLowerCase().trim())
          );
          if (match) matchedManagerId = match.value;
        }

        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || "",
          personalEmail: data.email || "",
          personalPhone: data.phoneNumber || "",
          department: data.department || "",
          designation: data.designation || "",
          companyName: data.companyName || "",
          locationJoining: data.placeOfPosting || "",
          startDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : "",
          reportingManagerId: matchedManagerId,
          upcomingId: upcomingId,
          companyId: data.companyId || "",
          locationId: data.locationId || "",
          priorExperienceMonths: parseExpToMonths(data.experience || ""),
        }));
        
        // Also sync the companyName and locationJoining for display
        if (data.companyName) updateField("companyName", data.companyName);
        if (data.placeOfPosting) updateField("locationJoining", data.placeOfPosting);
      } catch (err) {
        console.error("Failed to fetch upcoming candidate data:", err);
      }
    };

    if (!loadingManagers) {
      fetchUpcomingData();
    }
  }, [searchParams, loadingManagers, managers]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ("files" in e.target && e.target.files) file = e.target.files[0];
    else if ("dataTransfer" in e) { e.preventDefault(); file = e.dataTransfer.files[0]; }
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Photo size must be less than 2MB."); return; }
    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const toggleProvision = (key: keyof typeof provisions) => {
    setProvisions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.employeeCode) {
      setError("Required: Name and Employee Code.");
      return;
    }
    if (provisions.desktop && !formData.workspaceId) {
      setError("Strategic Conflict: Desktop requires an assigned Physical Seat.");
      setIsSeatModalOpen(true);
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let photoPath = "";
      if (photo) {
        const uploadData = new FormData();
        uploadData.append("file", photo);
        uploadData.append("company", formData.companyName || "Unassigned");
        uploadData.append("employeeCode", formData.employeeCode || "");
        uploadData.append("employeeName", formData.fullName || "");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        
        if (!uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          throw new Error(uploadResult.error || "Image upload failed. Please check file size and permissions.");
        }
        
        const uploadResult = await uploadRes.json();
        photoPath = uploadResult.path;
      }

      const payload = { ...formData, photoPath, createdBy: (session?.user as any)?.id || null };
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to enroll employee.");

      const employeeId = result.id;
      const provisionTypes = Object.entries(provisions).filter(([, enabled]) => enabled).map(([key]) => key);

      for (const type of provisionTypes) {
        const provPayload: any = { employeeId, requestedBy: (session?.user as any)?.id || null, priority: "normal" };
        if (type === "email") provPayload.specialRequirements = "Email account provisioning";
        else provPayload.deviceTypeNeeded = type;
        await fetch("/api/provisioning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(provPayload) });
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/hr/employees"), 1500);
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  // Permission Check
  const canCreate = checkPermission("HR", "EMPLOYEES", "canCreate");

  if (permsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verifying security clearances...</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/10 text-red-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Access Restricted</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60 max-w-sm mx-auto leading-relaxed">
            Your current security profile does not have authorization to enroll new associates into the registry.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-card border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce text-green-500">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">Enrollment Success</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.fullName} has been activated in the registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href="/hr/employees" className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Enroll New Employee
            </h2>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={handleSubmit} disabled={submitting} className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all flex items-center gap-3 disabled:opacity-50">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {submitting ? "Processing..." : "Activate Record"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Onboarding Error: {error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Form Area */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section 1: Identity */}
          <div className="premium-card p-8 rounded-[40px] border border-white/5 bg-card/40 relative overflow-visible group z-30">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 relative z-10">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
              Organizational Identity
            </div>

            <div className="flex flex-col lg:flex-row gap-10 relative z-10">
               {/* Photo Zone */}
               <div className="flex flex-col items-center gap-4 shrink-0">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handlePhotoChange}
                  className={cn(
                    "w-48 h-60 rounded-[48px] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-4 relative overflow-hidden group/upload shadow-2xl",
                    isDragging ? "border-primary bg-primary/5 scale-105" : "border-white/10 bg-muted/20 hover:border-primary/30",
                    photoPreview && "border-solid border-primary/20"
                  )}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                         <button onClick={removePhoto} className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/20"><Shield className="w-5 h-5 rotate-45" /></button>
                         <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Replace Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover/upload:rotate-12 transition-transform">
                        <Scan className="w-7 h-7" />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Attach Identity</p>
                      </div>
                      <input type="file" onChange={handlePhotoChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Legal Name</label>
                    <div className="relative group/field">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                      <input type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="w-full bg-muted/20 border border-white/5 focus:border-primary/30 rounded-2xl pl-12 pr-6 py-4 text-xs font-black tracking-tight outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Employee Code</label>
                    <div className="relative group/field">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                      <input type="text" placeholder="EMP-001" value={formData.employeeCode} onChange={(e) => updateField("employeeCode", e.target.value)} className="w-full bg-muted/20 border border-white/5 focus:border-primary/30 rounded-2xl pl-12 pr-6 py-4 text-xs font-mono font-black tracking-widest outline-none transition-all" />
                    </div>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Company/Subsidiary</label>
                      <SearchableSelect 
                        options={companies} 
                        value={formData.companyId} 
                        onChange={(val) => {
                          const label = companies.find(c => c.value === val)?.label || val;
                          setFormData(prev => ({ ...prev, companyId: val, companyName: label }));
                        }} 
                        placeholder="Select..." 
                        allowCustom 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Department</label>
                      <SearchableSelect options={departments} value={formData.department} onChange={(val) => updateField("department", val)} placeholder="Select..." allowCustom />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Designation</label>
                    <SearchableSelect options={designations} value={formData.designation} onChange={(val) => updateField("designation", val)} placeholder="Select Seniority..." allowCustom />
                  </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-20 overflow-visible">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-6">
                  <Mail className="w-3.5 h-3.5" />
                  Connectivity Profile
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Personal Email</label>
                      <input type="email" placeholder="private@mail.com" value={formData.personalEmail} onChange={(e) => updateField("personalEmail", e.target.value)} className="w-full bg-muted/15 border border-white/5 focus:border-secondary/40 rounded-2xl px-6 py-3.5 text-xs font-bold outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Phone Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input type="tel" placeholder="+91 XXXX XXX XXX" value={formData.personalPhone} onChange={(e) => updateField("personalPhone", e.target.value)} className="w-full bg-muted/15 border border-white/5 focus:border-secondary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none transition-all" />
                      </div>
                   </div>
                </div>
            </div>

            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-20 overflow-visible">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">
                  <Globe className="w-3.5 h-3.5" />
                  Deployment Logistics
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Location</label>
                      <SearchableSelect 
                        options={locations} 
                        value={formData.locationId} 
                        onChange={(val) => {
                          const label = locations.find(l => l.value === val)?.label || val;
                          setFormData(prev => ({ ...prev, locationId: val, locationJoining: label }));
                        }} 
                        placeholder="Campus / Site"
                        icon={<MapPin className="w-4 h-4" />}
                        allowCustom
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Join Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input type="date" value={formData.startDate} onChange={(e) => updateField("startDate", e.target.value)} className="w-full bg-muted/15 border border-white/5 focus:border-amber-500/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none transition-all appearance-none" />
                      </div>
                   </div>
                </div>
            </div>
          </div>

          {/* Section 3: Hierarchy & Physical Stationing */}
          <div className="premium-card p-8 rounded-[40px] border border-white/5 bg-card/40 relative overflow-visible group z-10">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 relative z-10">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
              Hierarchy & Physical Stationing
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Reporting Authority</label>
                    <SearchableSelect options={managers} value={formData.reportingManagerId} onChange={(val) => updateField("reportingManagerId", val)} placeholder="Assign Manager..." icon={<Briefcase className="w-4 h-4" />} />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Designated Workspace</label>
                <div className="flex gap-3">
                  <div className="relative group/field flex-1">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors" />
                    <input type="text" placeholder="Select Workspace..." value={formData.deskNumber} readOnly className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[20px] pl-12 pr-6 py-4 text-xs font-mono font-black tracking-[0.2em] outline-none transition-all cursor-default" />
                  </div>
                  <button type="button" onClick={() => setIsSeatModalOpen(true)} className="px-8 py-4 bg-primary/10 text-primary border border-primary/20 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all shadow-xl shadow-primary/5">Select</button>
                </div>
                <SeatSelectorModal isOpen={isSeatModalOpen} onClose={() => setIsSeatModalOpen(false)} selectedId={formData.workspaceId} onSelect={(ws) => { updateField("workspaceId", ws.id); updateField("deskNumber", ws.code); setIsSeatModalOpen(false); }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Infrastructure Trigger */}
        <div className="xl:col-span-4 space-y-6 sticky top-14">
           <div className="premium-card p-8 rounded-[48px] border border-white/5 bg-card/60 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 relative z-10">
                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                Infrastructure Trigger
              </div>
              
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {(Object.keys(provisions) as Array<keyof typeof provisions>).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleProvision(key)}
                    type="button"
                    className={cn(
                      "group/btn relative h-20 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-lg",
                      provisions[key]
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted/10 border-white/5 opacity-40 hover:opacity-100 hover:scale-105 hover:bg-muted/20",
                    )}
                  >
                    {key === "laptop" && <Laptop className="w-5 h-5" />}
                    {key === "desktop" && <Monitor className="w-5 h-5" />}
                    {key === "phone" && <Smartphone className="w-5 h-5" />}
                    {key === "sim" && <SimIcon className="w-5 h-5" />}
                    {key === "email" && <Mail className="w-5 h-5" />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-10 p-6 bg-primary/5 rounded-[32px] border border-primary/10 border-dashed text-center space-y-3">
                 <Activity className="w-8 h-8 text-primary/40 mx-auto animate-pulse" />
                 <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest leading-relaxed">
                   Activating record will trigger automated IT tickets for the selected stack above.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
