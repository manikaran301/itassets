'use client';

import { 
  ArrowLeft, 
  Mail, 
  Save, 
  UserPlus, 
  Globe, 
  CheckCircle2, 
  Loader2, 
  Shield, 
  Layout, 
  Tag, 
  Lock,
  Zap,
  LayoutGrid,
  Hash,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchableSelect } from '@/components/SearchableSelect';

const PLATFORM_OPTIONS = [
  { value: 'google_workspace', label: 'Google Workspace' },
  { value: 'microsoft_365', label: 'Microsoft 365' },
  { value: 'zoho', label: 'Zoho' },
  { value: 'other', label: 'Other/Custom' },
];

const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personal Account' },
  { value: 'shared', label: 'Shared Mailbox' },
  { value: 'alias', label: 'Email Alias' },
  { value: 'distribution', label: 'Distribution List' },
  { value: 'service', label: 'Service Account' },
];

export default function NewEmailAccountPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    emailAddress: '',
    displayName: '',
    employeeId: '',
    accountType: 'personal',
    platform: 'google_workspace',
    status: 'active',
    passwordHash: '',
  });

  const [forwardingAddresses, setForwardingAddresses] = useState<string[]>([]);
  const [newForwarding, setNewForwarding] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        const data = await response.json();
        const formatted = data.map((emp: any) => ({
          value: emp.id,
          label: `${emp.fullName} (${emp.employeeCode})`
        }));
        setEmployees(formatted);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const addForwarding = () => {
    if (newForwarding && !forwardingAddresses.includes(newForwarding)) {
      setForwardingAddresses([...forwardingAddresses, newForwarding]);
      setNewForwarding('');
    }
  };

  const removeForwarding = (email: string) => {
    setForwardingAddresses(forwardingAddresses.filter(a => a !== email));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.emailAddress || !formData.displayName || !formData.employeeId) {
      setError('Please fill in all required identity fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        forwardingAddresses,
        createdBy: (session?.user as any)?.id || null
      };

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register email account.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/it/email');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
        <div className="w-24 h-24 rounded-[40px] bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">Identity Created</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
            {formData.emailAddress} is now active.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black animate-pulse">Provisioning Complete</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      
      {/* Dynamic Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href="/it/email" className="p-2.5 hover:bg-white/5 rounded-2xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent leading-none">Enroll Email Identity</h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest italic pl-16">Digital Workflow & Communication Provisioning</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/it/email" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all">Cancel</Link>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-3.5 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {submitting ? 'Provisioning...' : 'Activate Account'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black flex items-center gap-4 animate-shake uppercase tracking-tight shadow-lg shadow-red-500/5">
          <Shield className="w-5 h-5 shrink-0" />
          <span>Error Detected: {error}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Main Content Area */}
        <div className="space-y-4">
          
          {/* Identity & Discovery */}
          <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Mail className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              Identity & Route
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Email Address</label>
                <div className="relative group/field">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={formData.emailAddress}
                    onChange={(e) => updateField('emailAddress', e.target.value)}
                    className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-3 text-xs outline-none transition-all font-bold placeholder:font-normal placeholder:opacity-20 shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Display Name</label>
                <div className="relative group/field">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Full Name / Display Title" 
                    value={formData.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-3 text-xs outline-none transition-all font-bold placeholder:font-normal placeholder:opacity-20 shadow-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative z-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Account Holder</label>
                 <SearchableSelect 
                   options={employees}
                   value={formData.employeeId}
                   onChange={(val) => updateField('employeeId', val)}
                   placeholder="Select employee..."
                   icon={<UserPlus className="w-4 h-4" />}
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Category</label>
                 <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                   {ACCOUNT_TYPES.map(type => (
                     <button
                       key={type.value}
                       type="button"
                       onClick={() => updateField('accountType', type.value)}
                       className={cn(
                        "flex items-center justify-center px-2 py-2.5 rounded-xl border text-[8px] font-black uppercase tracking-tight transition-all",
                        formData.accountType === type.value 
                          ? "bg-primary/20 border-primary/40 text-primary scale-105" 
                          : "bg-muted/5 border-white/5 opacity-40 hover:opacity-100"
                       )}
                     >
                       {type.label.split(' ')[0]}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Details */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Technical Specs
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Platform</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORM_OPTIONS.map(plt => (
                        <button
                          key={plt.value}
                          type="button"
                          onClick={() => updateField('platform', plt.value)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                            formData.platform === plt.value 
                              ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                              : "bg-muted/5 border-white/5 opacity-40 hover:opacity-100"
                          )}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {plt.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Password Hash</label>
                    <div className="relative group/field">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input 
                        type="password" 
                        placeholder="Security token..." 
                        value={formData.passwordHash}
                        onChange={(e) => updateField('passwordHash', e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-12 pr-6 py-3 text-xs outline-none transition-all font-mono shadow-sm" 
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* Forwarding Configuration */}
            <div className="premium-card p-6 rounded-[32px] border border-white/5 bg-card/40 relative">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                Intelligence Routing
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="flex gap-2">
                    <div className="flex-1 relative group/field">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                      <input 
                        type="email" 
                        placeholder="target@company.com" 
                        value={newForwarding}
                        onChange={(e) => setNewForwarding(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForwarding())}
                        className="w-full bg-muted/10 border border-border/40 focus:border-primary/40 rounded-2xl pl-11 pr-4 py-3 text-[11px] outline-none transition-all font-bold shadow-sm" 
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={addForwarding}
                      className="p-3 bg-muted/20 hover:bg-primary text-muted-foreground hover:text-primary-foreground rounded-2xl border border-white/5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                 </div>

                 <div className="max-h-[80px] overflow-y-auto pr-1 space-y-1.5 scrollbar-hide">
                   {forwardingAddresses.length > 0 ? (
                     forwardingAddresses.map(addr => (
                       <div key={addr} className="flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl animate-fade-in group/item">
                         <span className="text-[10px] font-bold text-primary/80 truncate">{addr}</span>
                         <button 
                           onClick={() => removeForwarding(addr)}
                           className="p-1 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                         >
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                     ))
                   ) : (
                     <p className="text-[9px] text-muted-foreground/20 font-black uppercase tracking-widest text-center py-4 border border-dashed border-white/5 rounded-2xl">
                       Static Origin
                     </p>
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
