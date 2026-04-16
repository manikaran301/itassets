'use client';

import { 
  ArrowLeft,
  UserPlus, 
  Shield, 
  MapPin, 
  Save, 
  Mail, 
  User, 
  Clock, 
  Laptop,
  Smartphone,
  PhoneCall as SimIcon,
  Monitor,
  CheckCircle2,
  Loader2,
  Lock,
  Zap,
  LayoutGrid,
  Hash,
  X,
  Scan,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchableSelect } from '@/components/SearchableSelect';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const { data: session } = useSession();
  
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: '',
    personalEmail: '',
    personalPhone: '',
    department: '',
    designation: '',
    companyName: '',
    reportingManagerId: '',
    locationJoining: '',
    deskNumber: '',
    startDate: '',
    status: 'active',
  });

  const [provisions, setProvisions] = useState({
    laptop: true,
    desktop: false,
    phone: false,
    sim: false,
    email: true,
  });

  // Fetch all managers for dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch('/api/employees');
        const data = await response.json();
        
        const reportCounts: Record<string, number> = {};
        data.forEach((emp: any) => {
          if (emp.reportingManagerId) {
            reportCounts[emp.reportingManagerId] = (reportCounts[emp.reportingManagerId] || 0) + 1;
          }
        });

        const formatted = data
          .filter((emp: any) => emp.id !== employeeId) // Prevent setting self as manager
          .map((emp: any) => ({
            value: emp.id,
            label: `${emp.fullName} (${emp.employeeCode})`,
            reportCount: reportCounts[emp.id] || 0
          }))
          .sort((a: any, b: any) => b.reportCount - a.reportCount);
        
        setManagers(formatted);
      } catch (err) {
        console.error('Error fetching managers:', err);
      } finally {
        setLoadingManagers(false);
      }
    };
    fetchManagers();
  }, [employeeId]);

  // Fetch specific employee details
  useEffect(() => {
    if (!employeeId) return;
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch employee details');
        const data = await response.json();
        
        setFormData({
          fullName: data.fullName || '',
          employeeCode: data.employeeCode || '',
          personalEmail: data.personalEmail || '',
          personalPhone: data.personalPhone || '',
          department: data.department || '',
          designation: data.designation || '',
          companyName: data.companyName || '',
          reportingManagerId: data.reportingManagerId || '',
          locationJoining: data.locationJoining || '',
          deskNumber: data.deskNumber || '',
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          status: data.status || 'active',
        });
      } catch (err) {
        setError('Error loading employee record.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDetails();
  }, [employeeId]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const toggleProvision = (key: keyof typeof provisions) => {
    setProvisions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.employeeCode || !formData.startDate) {
      setError('Required: Name, Employee Code, and Start Date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        updatedBy: (session?.user as any)?.id || null
      };

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update employee.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/hr/employees');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
         <Loader2 className="w-12 h-12 text-primary animate-spin opacity-50" />
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
          <h3 className="text-2xl font-black uppercase tracking-tight">Identity Updated</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.fullName}'s records have been modified in the central registry.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black animate-pulse">Syncing Global Directory</p>
      </div>
    );
  }

  const COMPANIES = [
    { value: 'Manikaran Power Limited (MPL)', label: 'Manikaran Power Limited (MPL)' },
    { value: 'Manikaran Renewables Limited (MRL)', label: 'Manikaran Renewables Limited (MRL)' },
    { value: 'Manikaran Analytics Limited (MAL)', label: 'Manikaran Analytics Limited (MAL)' },
    { value: 'Manikaran Hydro Private Limited (MHPL)', label: 'Manikaran Hydro Private Limited (MHPL)' },
    { value: '50Hertz Limted', label: '50Hertz Limted' },
    { value: 'Manikaran Utility Services Company Limited', label: 'Manikaran Utility Services Company Limited' },
  ];

  const DEPARTMENTS = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Operations', label: 'Operations' },
    { value: 'HR', label: 'HR' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Logistics', label: 'Logistics' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'IT Support', label: 'IT Support' },
  ];

  const DESIGNATIONS = [
    { value: 'Associate', label: 'Associate' },
    { value: 'Senior Associate', label: 'Senior Associate' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'Executive', label: 'Executive' },
    { value: 'Intern', label: 'Intern' },
    { value: 'Technician', label: 'Technician' },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      
      {/* Dynamic Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href="/hr/employees" className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">Modify Associate</h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">Human Resource & Infrastructure Metadata</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/hr/employees" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all">Cancel</Link>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {submitting ? 'Updating...' : 'Save Updates'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Update Error: {error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Form Column */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Identity & Discovery - HIGHEST Z-INDEX */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group z-40">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <User className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              Corporate Identity
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">Full Legal Name</label>
                <div className="relative group/field">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Johnathon Doe" 
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-bold placeholder:font-semibold placeholder:text-muted-foreground/70" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">Employee ID Card</label>
                <div className="relative group/field">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="EMP-XXX" 
                    value={formData.employeeCode}
                    onChange={(e) => updateField('employeeCode', e.target.value)}
                    className="w-full bg-muted/25 border border-border/70 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-foreground outline-none transition-all font-black tracking-widest font-mono" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative z-20">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Company / Subsidiary</label>
                 <SearchableSelect 
                   options={COMPANIES}
                   value={formData.companyName}
                   onChange={(val) => updateField('companyName', val)}
                   placeholder="Select Company..."
                   allowCustom
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Department</label>
                 <SearchableSelect 
                   options={DEPARTMENTS}
                   value={formData.department}
                   onChange={(val) => updateField('department', val)}
                   placeholder="Select Dept..."
                   allowCustom
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Designation</label>
                 <SearchableSelect 
                   options={DESIGNATIONS}
                   value={formData.designation}
                   onChange={(val) => updateField('designation', val)}
                   placeholder="Select Title..."
                   allowCustom
                 />
               </div>
               <div className="space-y-2 relative">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Reporting Manager</label>
                 <SearchableSelect 
                   options={managers}
                   value={formData.reportingManagerId}
                   onChange={(val) => updateField('reportingManagerId', val)}
                   placeholder="Type to search..."
                   icon={<Shield className="w-4 h-4" />}
                   limit={5}
                 />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact & Location - NEXT HIGHEST */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative z-30">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Contact & Logistics
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Location</label>
                      <input 
                        type="text" 
                        placeholder="Campus / Remote" 
                        value={formData.locationJoining}
                        onChange={(e) => updateField('locationJoining', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Join Date</label>
                      <input 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold text-foreground" 
                      />
                    </div>
                 </div>
                 
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Personal Contact Info</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="email" 
                        placeholder="personal@email.com" 
                        value={formData.personalEmail}
                        onChange={(e) => updateField('personalEmail', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold " 
                      />
                      <input 
                        type="tel" 
                        placeholder="+91-XXXX-XXXXX" 
                        value={formData.personalPhone}
                        onChange={(e) => updateField('personalPhone', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl px-6 py-3.5 text-xs outline-none transition-all font-bold" 
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* Station & Digital Identity - LOWEST */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative z-20">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Station & Digital Identity
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 hidden md:grid">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Assigned Seat / Desk</label>
                    <div className="relative group/field">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="e.g. F1-WS-024" 
                        value={formData.deskNumber}
                        onChange={(e) => updateField('deskNumber', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-mono font-black tracking-widest" 
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Account Status</label>
                    <SearchableSelect 
                      options={[{value: 'active', label: 'Active'}, {value: 'inactive', label: 'Inactive'}]}
                      value={formData.status}
                      onChange={(val) => updateField('status', val)}
                      placeholder="Status"
                    />
                 </div>
              </div>
              <div className="flex flex-col gap-4 relative z-10 md:hidden">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Assigned Seat / Desk</label>
                    <div className="relative group/field">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input 
                        type="text" 
                        placeholder="e.g. F1-WS-024" 
                        value={formData.deskNumber}
                        onChange={(e) => updateField('deskNumber', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3.5 text-xs outline-none transition-all font-mono font-black tracking-widest" 
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Account Status</label>
                    <SearchableSelect 
                      options={[{value: 'active', label: 'Active'}, {value: 'inactive', label: 'Inactive'}]}
                      value={formData.status}
                      onChange={(val) => updateField('status', val)}
                      placeholder="Status"
                    />
                 </div>
              </div>
            </div>

            {/* Asset Provisioning Placeholder */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative col-span-1 md:col-span-2 z-10 hidden">
            </div>
          </div>
        </div>

        {/* Preview Card Column */}
        <div className="xl:col-span-4 sticky top-10 flex flex-col items-center gap-8">
            
            {/* THE CORPORATE ID CARD */}
            <div className="w-full max-w-[340px] bg-card/60 dark:bg-[#0A0A0A] backdrop-blur-3xl rounded-[48px] border border-black/5 dark:border-white/10 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col group/id transition-all duration-500">
               
               {/* Badge Background Visuals */}
               <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 dark:from-primary/20 to-transparent pointer-events-none" />
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
 
               <div className="px-10 pt-10 text-center relative z-10">
                  <p className="text-[9px] font-black tracking-[0.4em] uppercase text-primary mb-1 opacity-60">M_AMS IDENTITY</p>
                  <div className="w-2 h-0.5 bg-primary/40 mx-auto rounded-full" />
               </div>
 
               <div className="p-10 pb-6 relative z-10 text-center space-y-6">
                  <div className="relative inline-block group/photo">
                     <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-6xl font-black text-primary border border-primary/20 shadow-2xl relative z-10 group-hover/photo:scale-105 transition-transform duration-500 overflow-hidden">
                        <span className="relative z-10 transition-transform duration-700">{formData.fullName ? formData.fullName[0] : '?'}</span>
                        <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                           <Scan className="w-full h-full scale-[1.5] rotate-45" />
                        </div>
                     </div>
                     <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-12 h-4 bg-muted/20 rounded-full border border-black/5 dark:border-white/5" />
                  </div>
                  
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active Member</p>
                     <h4 className="text-2xl font-black tracking-tight text-foreground dark:text-white leading-none truncate px-4">{formData.fullName || ' Liam Draft...'}</h4>
                  </div>
               </div>
 
               <div className="px-10 pb-8 space-y-4 relative z-10">
                  <div className="p-4 bg-muted/30 dark:bg-white/5 rounded-[24px] border border-black/5 dark:border-white/5 space-y-4">
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/40">
                        <span className="flex items-center gap-2">
                           <Shield className="w-3.5 h-3.5 text-primary" />
                           Compliance
                        </span>
                        <span className={cn(
                          "font-black",
                          formData.status === 'active' ? "text-green-500" : "text-amber-500"
                        )}>{formData.status}</span>
                     </div>
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/40">
                        <span className="flex items-center gap-2">
                           <Hash className="w-3.5 h-3.5 text-secondary" />
                           Employee ID
                        </span>
                        <span className="text-foreground dark:text-white font-black">{formData.employeeCode || 'TBD'}</span>
                     </div>
                  </div>
               </div>
 
               <div className="mt-auto bg-primary/5 p-8 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                     <QrCode className="w-8 h-8 text-primary shadow-primary" />
                     <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Transit Status</p>
                        <p className="text-[10px] font-black text-primary/60 italic uppercase tracking-tighter">System Entry Verified</p>
                     </div>
                  </div>
                  <div className="w-full h-8 flex items-end justify-between px-2 gap-1 overflow-hidden opacity-20 dark:opacity-40">
                     {Array.from({length: 40}).map((_, i) => (
                       <div key={i} className="bg-primary" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: `${Math.random() * 100}%` }} />
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
