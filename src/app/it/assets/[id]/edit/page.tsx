'use client';

import { 
  ArrowLeft,
  Monitor,
  Server,
  HardDrive,
  Save,
  Cpu,
  MemoryStick,
  Hash,
  Tag,
  Calendar,
  DollarSign,
  StickyNote,
  Shield,
  Wifi,
  Globe,
  CheckCircle2,
  Loader2,
  Package,
  Barcode,
  Layers,
  ScreenShare,
  Boxes,
  IndianRupee,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchableSelect } from '@/components/SearchableSelect';

const DEVICE_TYPES = [
  { value: 'laptop', label: 'Laptop', icon: Monitor },
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'zero_client', label: 'Zero Client', icon: ScreenShare },
  { value: 'nuc', label: 'NUC', icon: Boxes },
  { value: 'server', label: 'Server', icon: Server },
  { value: 'other', label: 'Other', icon: HardDrive },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
  { value: 'assigned', label: 'Assigned', color: 'text-primary bg-primary/10 border-primary/30' },
  { value: 'in_repair', label: 'In Repair', color: 'text-accent bg-accent/10 border-accent/30' },
  { value: 'retired', label: 'Retired', color: 'text-muted-foreground bg-muted border-border' },
];

const ANTIVIRUS_OPTIONS = [
  { value: 'yes', label: 'Active' },
  { value: 'no', label: 'None' },
  { value: 'expired', label: 'Expired' },
];

const BRAND_OPTIONS = [
  { value: 'Apple', label: 'Apple' },
  { value: 'HP', label: 'HP' },
  { value: 'Dell', label: 'Dell' },
  { value: 'Lenovo', label: 'Lenovo' },
  { value: 'ASUS', label: 'ASUS' },
  { value: 'Acer', label: 'Acer' },
  { value: 'N-Computing', label: 'N-Computing' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Samsung', label: 'Samsung' },
  { value: 'MSI', label: 'MSI' },
  { value: 'Razer', label: 'Razer' },
  { value: 'Alienware', label: 'Alienware' },
  { value: 'Gigabyte', label: 'Gigabyte' },
  { value: 'Fujitsu', label: 'Fujitsu' },
  { value: 'Panasonic', label: 'Panasonic' },
  { value: 'Toshiba', label: 'Toshiba' },
  { value: 'LG', label: 'LG' },
  { value: 'HCL', label: 'HCL' },
  { value: 'Wipro', label: 'Wipro' },
  { value: 'Zebronics', label: 'Zebronics' },
  { value: 'Intex', label: 'Intex' },
  { value: 'Lava', label: 'Lava' },
  { value: 'Assembled', label: 'Assembled' },
  { value: 'OEM / White Box', label: 'OEM / White Box' },
  { value: 'Other', label: 'Other' },
];

interface EditAssetProps {
  params: Promise<{ id: string }>;
}

export default function EditAssetPage({ params }: EditAssetProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    assetTag: '',
    type: 'laptop',
    make: '',
    model: '',
    cpu: '',
    ramGb: '',
    ssdGb: '',
    hddGb: '',
    serialNumber: '',
    macAddress: '',
    ipAddress: '',
    os: '',
    osVersion: '',
    antivirusStatus: 'no',
    warrantyExpiry: '',
    purchaseDate: '',
    cost: '',
    status: 'available',
    notes: '',
  });

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const response = await fetch(`/api/assets/${id}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setFormData({
          assetTag: data.assetTag || '',
          type: data.type || 'laptop',
          make: data.make || '',
          model: data.model || '',
          cpu: data.cpu || '',
          ramGb: data.ramGb || '',
          ssdGb: data.ssdGb?.toString() || '',
          hddGb: data.hddGb?.toString() || '',
          serialNumber: data.serialNumber || '',
          macAddress: data.macAddress || '',
          ipAddress: data.ipAddress || '',
          os: data.os || '',
          osVersion: data.osVersion || '',
          antivirusStatus: data.antivirusStatus || 'no',
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry).toISOString().split('T')[0] : '',
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '',
          cost: data.cost?.toString() || '',
          status: data.status || 'available',
          notes: data.notes || '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.assetTag.trim()) {
      setError('Asset Tag is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        assetTag: formData.assetTag.trim(),
        type: formData.type,
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        cpu: formData.cpu.trim() || null,
        ramGb: formData.ramGb.trim() || null,
        ssdGb: formData.ssdGb ? parseInt(formData.ssdGb) : null,
        hddGb: formData.hddGb ? parseInt(formData.hddGb) : null,
        serialNumber: formData.serialNumber.trim() || null,
        macAddress: formData.macAddress.trim() || null,
        ipAddress: formData.ipAddress.trim() || null,
        os: formData.os.trim() || null,
        osVersion: formData.osVersion.trim() || null,
        antivirusStatus: formData.antivirusStatus,
        warrantyExpiry: formData.warrantyExpiry || null,
        purchaseDate: formData.purchaseDate || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        changedBy: (session?.user as any)?.id || null
      };

      const response = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update asset');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/it/assets/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Specifications...</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in text-sm relative pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-14 z-[100] bg-background/80 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href={`/it/assets/${id}`} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground/60 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black tracking-tight text-foreground uppercase leading-none">Edit Asset <span className="text-primary/60">#{formData.assetTag}</span></h2>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest italic pl-14">Infrastructure Specification Update</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href={`/it/assets/${id}`} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all">Discard</Link>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-red-500 text-xs font-bold animate-shake uppercase tracking-tight">
          ⚠️ {error}
        </div>
      )}

      {submitSuccess && (
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-[32px] text-green-500 flex flex-col items-center gap-3 animate-bounce shadow-2xl shadow-green-500/10">
          <CheckCircle2 className="w-12 h-12" />
          <p className="text-sm font-black uppercase tracking-widest">Asset Updated Successfully!</p>
          <p className="text-[10px] opacity-60">Synchronizing with registry...</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Form Area */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Section 1: Identity */}
          <div className="premium-card rounded-[32px] p-6 space-y-6 bg-card/40 border border-white/5 relative group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Tag className="w-32 h-32" />
             </div>
             
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
               <Layers className="w-4 h-4" />
               Entity Identity
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Asset Tag</label>
                 <div className="relative group/field">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                   <input 
                     value={formData.assetTag}
                     onChange={(e) => updateField('assetTag', e.target.value)}
                     className="w-full bg-muted/20 pl-12 pr-4 py-3 rounded-2xl text-xs font-bold border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:opacity-20 shadow-sm" 
                     placeholder="e.g. 50HERT-LP001"
                   />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Device Type</label>
                 <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                   {DEVICE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField('type', type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all relative group/type",
                        formData.type === type.value
                          ? "bg-primary/20 border-primary/40 shadow-sm scale-105"
                          : "bg-muted/10 border-white/5 opacity-40 hover:opacity-70"
                      )}
                    >
                      <type.icon className={cn("w-4 h-4", formData.type === type.value ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">{type.label}</span>
                    </button>
                   ))}
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Manufacturer (Make)</label>
                  <SearchableSelect 
                    options={BRAND_OPTIONS}
                    value={formData.make}
                    onChange={(val) => updateField('make', val)}
                    placeholder="Select or type brand..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Model Name / Number</label>
                  <div className="relative group/field">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/field:text-primary transition-colors" />
                    <input 
                      value={formData.model}
                      onChange={(e) => updateField('model', e.target.value)}
                      className="w-full bg-muted/20 pl-12 pr-4 py-3 rounded-2xl text-xs font-bold border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" 
                      placeholder="e.g. Latitude 3440"
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Section 2: Technical Specifications */}
          <div className="premium-card rounded-[32px] p-6 space-y-6 bg-card/40 border border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
               <Cpu className="w-4 h-4" />
               Hardware Specification
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Processor (CPU)</label>
                 <input 
                   value={formData.cpu}
                   onChange={(e) => updateField('cpu', e.target.value)}
                   className="w-full bg-muted/10 px-4 py-3 rounded-2xl text-xs font-bold border border-border/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" 
                   placeholder="i5 12th Gen"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">RAM (GB)</label>
                 <div className="relative">
                   <input 
                     value={formData.ramGb}
                     onChange={(e) => updateField('ramGb', e.target.value)}
                     className="w-full bg-muted/10 px-4 py-3 rounded-2xl text-xs font-bold border border-border/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" 
                     placeholder="8"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30">GB</span>
                 </div>
               </div>
               <div className="space-y-2 flex-1">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">SSD (GB)</label>
                 <div className="relative">
                   <input 
                     type="number"
                     value={formData.ssdGb}
                     onChange={(e) => updateField('ssdGb', e.target.value)}
                     className="w-full bg-muted/10 px-4 py-3 rounded-2xl text-xs font-bold border border-border/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" 
                     placeholder="512"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30">SSD</span>
                 </div>
               </div>
               <div className="space-y-2 flex-1">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">HDD (GB)</label>
                 <div className="relative">
                   <input 
                     type="number"
                     value={formData.hddGb}
                     onChange={(e) => updateField('hddGb', e.target.value)}
                     className="w-full bg-muted/10 px-4 py-3 rounded-2xl text-xs font-bold border border-border/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" 
                     placeholder="0"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30">HDD</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Antivirus & Software Column */}
             <div className="premium-card rounded-[32px] p-6 space-y-6 bg-card/40 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Software & Security
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Antivirus</label>
                      <div className="flex gap-2">
                        {ANTIVIRUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('antivirusStatus', opt.value)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                              formData.antivirusStatus === opt.value
                                ? "bg-primary/20 border-primary/40 text-primary"
                                : "bg-muted/10 border-white/5 opacity-50"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">OS Name</label>
                      <input 
                        value={formData.os}
                        onChange={(e) => updateField('os', e.target.value)}
                        className="w-full bg-muted/10 px-4 py-2.5 rounded-xl text-xs font-bold border border-transparent focus:border-primary/20 outline-none transition-all" 
                        placeholder="Windows 11"
                      />
                    </div>
                  </div>
                </div>
             </div>

             {/* Network Column */}
             <div className="premium-card rounded-[32px] p-6 space-y-6 bg-card/40 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Connectivity Meta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">IP Address</label>
                    <input 
                      value={formData.ipAddress}
                      onChange={(e) => updateField('ipAddress', e.target.value)}
                      className="w-full bg-muted/10 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-transparent focus:border-primary/20 outline-none transition-all" 
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">MAC Address</label>
                    <input 
                      value={formData.macAddress}
                      onChange={(e) => updateField('macAddress', e.target.value)}
                      className="w-full bg-muted/10 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-transparent focus:border-primary/20 outline-none transition-all" 
                      placeholder="00:00:00:00:00"
                    />
                  </div>
                </div>
             </div>
          </div>

          {/* Section: Operational Info (Status & Notes) */}
          <div className="premium-card rounded-[32px] p-6 bg-card/40 border border-white/5 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
               <StickyNote className="w-4 h-4" />
               Operational Context
             </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Current Lifecycle Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => updateField('status', status.value)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest",
                          formData.status === status.value
                            ? cn(status.color, "shadow-sm scale-105")
                            : "bg-muted/10 border-white/5 opacity-40 hover:opacity-70"
                        )}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Admin Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={4}
                    className="w-full bg-muted/10 px-4 py-3 rounded-2xl text-xs font-bold border border-border/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-sm" 
                    placeholder="Physical condition, battery health, specific issues..."
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Financial & Assets Meta */}
        <div className="xl:col-span-4 space-y-6">
          <div className="premium-card rounded-[32px] p-6 space-y-6 bg-card/60 border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <IndianRupee className="w-24 h-24 text-green-500" />
             </div>
             
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
               <DollarSign className="w-4 h-4" />
               Procurement Detail
             </h3>

             <div className="space-y-5 relative z-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Serial Number</label>
                 <input 
                   value={formData.serialNumber}
                   onChange={(e) => updateField('serialNumber', e.target.value)}
                   className="w-full bg-muted/20 px-4 py-3 rounded-2xl text-xs font-mono font-bold border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner" 
                   placeholder="Enter unique serial..."
                 />
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Total Unit Cost (₹)</label>
                 <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-[10px]">₹</div>
                   <input 
                     type="number"
                     value={formData.cost}
                     onChange={(e) => updateField('cost', e.target.value)}
                     className="w-full bg-muted/20 pl-10 pr-4 py-3 rounded-2xl text-xs font-bold border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner" 
                     placeholder="0.00"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Purchase Date</label>
                   <input 
                     type="date"
                     value={formData.purchaseDate}
                     onChange={(e) => updateField('purchaseDate', e.target.value)}
                     className="w-full bg-muted/20 px-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:border-primary/20 outline-none transition-all" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Warranty Expiry</label>
                   <input 
                     type="date"
                     value={formData.warrantyExpiry}
                     onChange={(e) => updateField('warrantyExpiry', e.target.value)}
                     className="w-full bg-muted/20 px-4 py-2.5 rounded-xl text-[10px] font-bold border border-transparent focus:border-primary/20 outline-none transition-all" 
                   />
                 </div>
               </div>
             </div>
          </div>

          {/* Quick Info Tip */}
          <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 space-y-3">
             <div className="flex items-center gap-2 text-primary">
               <Zap className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Asset Management Tip</span>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed italic">
               Updating asset specifications will automatically create a timestamped audit trail. This history is visible in the Asset Control Center.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
