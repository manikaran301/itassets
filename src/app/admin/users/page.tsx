import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'it' | 'readonly';
  isActive: boolean;
  lastLogin: string;
}

export default function UsersPage() {
  const users: SystemUser[] = [
    { id: 'usr-001', name: 'Master Admin', email: 'admin.master@mams.com', role: 'admin', isActive: true, lastLogin: '10 mins ago' },
    { id: 'usr-002', name: 'HR Jane', email: 'jane.hr@mams.com', role: 'hr', isActive: true, lastLogin: '2 hours ago' },
    { id: 'usr-003', name: 'IT Ramesh', email: 'ramesh.it@mams.com', role: 'it', isActive: true, lastLogin: 'Yesterday' },
    { id: 'usr-004', name: 'Auditor Sam', email: 'sam.audit@mams.com', role: 'readonly', isActive: false, lastLogin: '5 days ago' },
    { id: 'usr-005', name: 'IT Suresh', email: 'suresh.it@mams.com', role: 'it', isActive: true, lastLogin: '3 hours ago' },
  ];

  const getRoleIcon = (role: string): LucideIcon => {
    switch (role) {
      case 'admin': return ShieldCheck;
      case 'hr': return Users;
      case 'it': return Shield;
      case 'readonly': return Lock;
      default: return Users;
    }
  };

  const roleColors = {
    'admin': 'bg-red-500/10 text-red-600 border-red-500/20',
    'hr': 'bg-primary/10 text-primary border-primary/20',
    'it': 'bg-secondary/10 text-secondary border-secondary/20',
    'readonly': 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">System Access Control</h2>
          <p className="text-muted-foreground mt-1">Manage role-based permissions for HR, IT, and Admin modules.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>Enroll User</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-2xl premium-card border-border/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search system users by name or email..." 
            className="w-full bg-muted/50 pl-10 pr-4 py-2 rounded-xl text-sm border border-transparent focus:border-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 text-xs font-black tracking-widest uppercase items-center text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter by Status</span>
        </div>
      </div>

      <div className="premium-card rounded-2xl overflow-hidden glass border-border/50 shadow-2xl animate-fade-in delay-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identity</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Access Role</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last Login</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-right border-l border-border/10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              return (
                <tr key={user.id} className="hover:bg-muted/20 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110",
                        user.isActive ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"
                      )}>
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm",
                      roleColors[user.role as keyof typeof roleColors]
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       {user.isActive ? (
                         <>
                           <Unlock className="w-3 h-3 text-green-500" />
                           <span className="text-[10px] uppercase font-bold text-green-600">Authorized</span>
                         </>
                       ) : (
                         <>
                           <Lock className="w-3 h-3 text-red-500" />
                           <span className="text-[10px] uppercase font-bold text-red-600">Deactivated</span>
                         </>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-muted-foreground">{user.lastLogin}</td>
                  <td className="px-6 py-5 border-l border-border/10 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-secondary/10 hover:text-secondary rounded-lg transition-all" title="Modify Access">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all" title="Suspension">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
