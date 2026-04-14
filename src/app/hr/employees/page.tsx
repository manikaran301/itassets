'use client';

import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  Shield, 
  Monitor, 
  Smartphone, 
  Mail,
  MapPin,
  Clock,
  Laptop,
  PhoneCall as SimIcon,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddEmployeeModal } from '@/components/forms/AddEmployeeModal';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="space-y-6 max-w-full mx-auto text-sm relative pb-20">
      
      {/* Page Header */}
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase">Employee Directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-bold uppercase tracking-widest opacity-60 italic">Central Identity & Fulfillment Tracking</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-2xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <Link 
              href="/hr/employees/new"
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:scale-105 active:scale-95 rounded-2xl shadow-xl shadow-primary/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-3xl premium-card border border-white/5 shadow-xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Department..." 
              className="w-full bg-muted/20 pl-12 pr-4 py-2.5 rounded-2xl text-xs border border-transparent focus:border-primary/20 outline-none transition-all placeholder:text-[10px] placeholder:uppercase placeholder:font-black placeholder:opacity-30"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all border border-white/5 text-muted-foreground/60">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="premium-card rounded-[32px] overflow-hidden glass border border-white/5 shadow-2xl overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Accessing Mainframe...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-white/5">
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest">No Employees Found</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">Start by adding a new employee to the central directory.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1150px]">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">ID & Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Reporting to & Dept</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Location & Desk</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Requirements</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Designation & Joining</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.005] transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                          {emp.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-black group-hover:text-primary transition-colors truncate">{emp.fullName}</p>
                          <p className="text-[9px] font-mono font-black tracking-widest text-muted-foreground/30 uppercase">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-foreground/80 tracking-tight flex items-center gap-2">
                          <Shield className="w-3 h-3 text-primary/40" />
                          {emp.manager?.fullName || '—'}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest italic">{emp.department || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <MapPin className="w-3 h-3 text-secondary/50" />
                          <p className="text-[11px] font-black text-foreground/80">{emp.locationJoining || '—'}</p>
                        </div>
                        <p className="text-[9px] text-secondary font-mono tracking-widest font-black uppercase bg-secondary/10 px-2 rounded-full border border-secondary/10 inline-block">{emp.deskNumber || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        {/* Note: In a real app, requirement statuses would come from the backend relations */}
                        <div className="w-8 h-8 rounded-xl border bg-muted/10 border-white/5 text-muted-foreground/20 flex items-center justify-center"><Laptop className="w-4 h-4" /></div>
                        <div className="w-8 h-8 rounded-xl border bg-muted/10 border-white/5 text-muted-foreground/20 flex items-center justify-center"><SimIcon className="w-4 h-4" /></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-foreground/80 tracking-tight">{emp.designation || '—'}</p>
                        <p className="text-[9px] text-muted-foreground/40 font-mono flex items-center gap-2">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(emp.startDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "text-[8px] uppercase font-black px-3 py-1 rounded-full border",
                        emp.status === 'active' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-primary/10 text-primary border-primary/20 shadow-lg'
                      )}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-3">
                        <button className="p-2 hover:bg-primary/10 text-muted-foreground/40 hover:text-primary rounded-xl border border-transparent hover:border-primary/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 rounded-xl border border-transparent hover:border-red-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
