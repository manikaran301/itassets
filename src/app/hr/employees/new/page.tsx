'use client';

import { 
  X, 
  UserPlus, 
  Shield, 
  MapPin, 
  Monitor, 
  Smartphone, 
  Cpu, 
  Save, 
  Mail, 
  PhoneCall as SimIcon, 
  User, 
  Phone as PhoneIcon, 
  LayoutGrid, 
  Clock, 
  Laptop,
  ArrowLeft,
  ArrowUpRight,
  Fingerprint,
  QrCode,
  Scan
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

export default function NewEmployeePage() {
  const [formData, setFormData] = useState({
    full_name: '',
    employee_code: '',
    personal_email: '',
    personal_phone: '',
    department: '',
    designation: '',
    reporting_manager_id: '',
    location_joining: '',
    joining_date: '',
    seat_allocation: '',
    reqLaptop: true,
    reqDesktop: false,
    reqPhone: false,
    reqSim: false,
    reqEmail: true,
  });

  const toggleAsset = (key: 'reqLaptop' | 'reqDesktop' | 'reqPhone' | 'reqSim' | 'reqEmail') => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeAssets = [
    { id: 'reqLaptop', label: 'Laptop', active: formData.reqLaptop, icon: Laptop },
    { id: 'reqDesktop', label: 'Desktop', active: formData.reqDesktop, icon: Monitor },
    { id: 'reqPhone', label: 'Phone', active: formData.reqPhone, icon: Smartphone },
    { id: 'reqSim', label: 'SIM', active: formData.reqSim, icon: SimIcon },
    { id: 'reqEmail', label: 'Email ID', active: formData.reqEmail, icon: Mail },
  ];

  const totalTasks = activeAssets.filter(a => a.active).length;

  return (
    <div className="space-y-8 animate-fade-in text-sm relative pb-32">
      
      {/* 🚀 Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
             <Link href="/hr/employees" className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-muted-foreground/40 hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent uppercase leading-none">Enroll Employee</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest italic pl-14">Identity, Hardware, and Seat Provisioning Pipeline.</p>
        </div>
        <div className="flex gap-4 items-center">
           <Link href="/hr/employees" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-all">Discard</Link>
           <button className="px-10 py-3 bg-primary text-primary-foreground rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3">
              <Save className="w-5 h-5" />
              Enroll Employee
           </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Form (8 Cols) */}
        <div className="xl:col-span-8 space-y-10">
           
           {/* Section 1: Identity */}
           <div className="premium-card p-10 rounded-[40px] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 relative z-10">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                 <span>1. Employee Information (HR Initiated)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Full Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/20 group-focus-within:text-primary transition-colors" />
                       <input type="text" placeholder="Liam Draft..." value={formData.full_name} onChange={(e)=>setFormData({...formData, full_name: e.target.value})} className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-bold placeholder:font-normal" />
                    </div>
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Employee Code</label>
                    <input type="text" placeholder="EMP-XXX" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-mono tracking-widest font-black" />
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Personal Email</label>
                    <input type="email" placeholder="onboarding@identity.com" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold" />
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Personal Phone</label>
                    <input type="tel" placeholder="+91 XXXX XXXX" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-bold" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 relative z-10">
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Department</label>
                    <input type="text" placeholder="Engineering" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-black" />
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Designation</label>
                    <input type="text" placeholder="Lead Dev" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-black" />
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Reporting To</label>
                    <input type="text" placeholder="Manager ID" className="w-full bg-muted/20 border border-white/5 focus:border-primary/40 rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-black" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 relative z-10 border-t border-white/5">
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary font-black ml-1">Joining Location</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30" />
                       <input type="text" placeholder="Campus Location" className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-black" />
                    </div>
                 </div>
                 <div className="group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary font-black ml-1">Expected Join Date</label>
                    <div className="relative">
                       <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30" />
                       <input type="date" value={formData.joining_date} onChange={(e)=>setFormData({...formData, joining_date: e.target.value})} className="w-full bg-secondary/5 border border-secondary/20 focus:border-secondary/40 rounded-[22px] pl-12 pr-4 py-4 text-xs outline-none transition-all font-black group-focus-within:text-white" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Fulfillment */}
           <div className="premium-card p-10 rounded-[40px] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
                    <span>2. Provisioning Requests (Fulfillment Suite)</span>
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest italic">Shared Operations Area</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                 <div className="lg:col-span-12 group space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1 italic opacity-40">Seat Allocation</label>
                    <div className="relative">
                       <LayoutGrid className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-accent/20 group-focus-within:text-accent transition-colors" />
                       <input type="text" placeholder="Assign Desk ID (e.g. F1-WS-01)" value={formData.seat_allocation} onChange={(e)=>setFormData({...formData, seat_allocation: e.target.value})} className="w-full bg-accent/5 border border-accent/20 focus:border-accent/40 rounded-[32px] pl-16 pr-8 py-8 text-lg outline-none transition-all font-mono tracking-widest font-black" />
                    </div>
                 </div>
                 <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4">
                    {activeAssets.map((asset) => (
                      <button 
                        key={asset.id}
                        onClick={() => toggleAsset(asset.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-4 p-6 rounded-[32px] border transition-all relative group/asset",
                          asset.active 
                            ? "bg-primary/20 border-primary/40 shadow-xl shadow-primary/5 scale-105" 
                            : "bg-muted/10 border-white/5 opacity-40 grayscale"
                        )}
                      >
                         <asset.icon className={cn("w-6 h-6 transition-transform group-hover/asset:rotate-6", asset.active ? "text-primary scale-110 shadow-primary" : "text-muted-foreground/30")} />
                         <div className="text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-30 leading-none">{asset.active ? 'Req' : 'Skip'}</p>
                            <p className="text-[11px] font-black tracking-tight leading-none truncate w-full mt-2 uppercase">{asset.label}</p>
                         </div>
                         {asset.active && <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

        </div>

        {/* 🧧 Right Column: THE ID CARD SNAPSHOT (4 Cols) */}
        <div className="xl:col-span-4 sticky top-10 flex flex-col items-center gap-8">
           
           {/* THE CORPORATE ID CARD */}
           <div className="w-full max-w-[340px] bg-[#0A0A0A] rounded-[48px] border border-white/10 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col group/id">
              
              {/* Badge Background Visuals */}
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

              {/* ID Header Overlay */}
              <div className="px-10 pt-10 text-center relative z-10">
                 <p className="text-[9px] font-black tracking-[0.4em] uppercase text-primary/40 mb-1">M_AMS IDENTITY</p>
                 <div className="w-2 h-0.5 bg-primary/40 mx-auto rounded-full" />
              </div>

              {/* Avatar Section */}
              <div className="p-10 pb-6 relative z-10 text-center space-y-6">
                 <div className="relative inline-block group/photo">
                    <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-6xl font-black text-primary border border-primary/20 shadow-2xl relative z-10 group-hover/photo:scale-105 transition-transform duration-500 overflow-hidden">
                       <span className="relative z-10 transition-transform duration-700 group-hover/photo:scale-110">?</span>
                       <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <Scan className="w-full h-full scale-[1.5] rotate-45" />
                       </div>
                    </div>
                    {/* ID Card Hole Aesthetic */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-12 h-4 bg-muted/20 rounded-full border border-white/5" />
                 </div>
                 
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Joining Identity</p>
                    <h4 className="text-2xl font-black tracking-tight text-white leading-none truncate px-4">{formData.full_name || 'Liam Draft...'}</h4>
                 </div>
              </div>

              {/* ID Data Rows */}
              <div className="px-10 pb-8 space-y-4 relative z-10">
                 <div className="p-4 bg-white/5 rounded-[24px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                       <span className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-primary/40" />
                          Digital Compliance
                       </span>
                       <span className="text-green-500 font-black">Ready</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                       <span className="flex items-center gap-2">
                          <LayoutGrid className="w-3.5 h-3.5 text-secondary/40" />
                          Seating Allocation
                       </span>
                       <span className={cn("font-black", formData.seat_allocation ? "text-secondary font-black" : "opacity-30 italic font-medium uppercase")}>
                          {formData.seat_allocation || 'Pending'}
                       </span>
                    </div>
                 </div>

                 {/* IT Dispatch Stack */}
                 <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 text-center">IT Dispatch Load</p>
                    <div className="flex justify-center -space-x-2.5">
                       {activeAssets.filter(a => a.active).map(a => (
                         <div key={a.id} className="w-10 h-10 rounded-2xl bg-primary/90 text-white flex items-center justify-center border-[3px] border-[#0A0A0A] shadow-2xl transition-transform hover:scale-110 hover:z-20">
                            <a.icon className="w-4 h-4" />
                         </div>
                       ))}
                       {totalTasks === 0 && (
                          <div className="w-10 h-10 rounded-2xl bg-muted/20 text-muted-foreground/20 flex items-center justify-center border-[3px] border-[#0A0A0A] border-dashed">
                             <X className="w-4 h-4" />
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Barcode/Footer Section */}
              <div className="mt-auto bg-primary/5 p-8 border-t border-white/5 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-3">
                    <QrCode className="w-8 h-8 text-primary/40" />
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Transmission Status</p>
                       <p className="text-[10px] font-black text-primary/60 italic uppercase tracking-tighter">Awaiting Global Sync</p>
                    </div>
                 </div>
                 <div className="w-full h-8 flex items-end justify-between px-2 gap-1 overflow-hidden opacity-20">
                    {Array.from({length: 40}).map((_, i) => (
                      <div key={i} className="bg-white" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: `${Math.random() * 100}%` }} />
                    ))}
                 </div>
              </div>
           </div>

           {/* Auxiliary Info */}
           <div className="w-full max-w-[340px] p-6 rounded-[28px] bg-primary/5 border border-primary/10 flex items-center gap-4 animate-pulse">
              <Fingerprint className="w-6 h-6 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-tight text-primary">Biometric Identity Latched</p>
           </div>
        </div>

      </div>

    </div>
  );
}
