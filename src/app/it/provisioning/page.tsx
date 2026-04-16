import { 
  Plus, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  UserPlus,
  Monitor,
  Mail,
  Smartphone,
  CreditCard,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import prisma from "@/lib/prisma";

export default async function ProvisioningPage() {
  const requests = await prisma.provisioningRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { fullName: true } },
      fulfiller: { select: { fullName: true } },
    },
  });

  const getTypeIcon = (type: string): LucideIcon => {
    switch (type) {
      case 'Laptop': return Monitor;
      case 'Email': return Mail;
      case 'Phone': return Smartphone;
      case 'SIM': return CreditCard;
      default: return Truck;
    }
  };

  const statusColors: Record<string, string> = {
    'Pending': 'bg-accent/10 text-accent border-accent/20',
    'In Progress': 'bg-primary/10 text-primary border-primary/20',
    'Fulfilled': 'bg-green-500/10 text-green-600 border-green-500/20',
    'Cancelled': 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
        {requests.map((req) => {
          const prettyType = req.deviceTypeNeeded
            ? req.deviceTypeNeeded.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : "Other";
          const prettyStatus = req.status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const prettyPriority = req.priority === "urgent" ? "Urgent" : "Normal";
          const Icon = getTypeIcon(prettyType);

          return (
            <div key={req.id} className="premium-card rounded-2xl overflow-hidden glass group flex flex-col h-full bg-card/60 relative">
              {prettyPriority === 'Urgent' && (
                <div className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-bl-xl text-[8px] font-black uppercase tracking-tighter shadow-lg transform translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                  Urgent Priority
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-muted border border-border group-hover:bg-primary/5 transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-black px-3 py-1 rounded-full border shadow-sm",
                    statusColors[prettyStatus]
                  )}>
                    {prettyStatus}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Request {req.requestCode}</h4>
                    <p className="text-lg font-bold tracking-tight h-14 line-clamp-2">Provisioning for {req.employee.fullName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Due Date</span>
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-accent" />
                        {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IT Owner</span>
                      <span className="text-xs font-semibold flex items-center gap-1.5 truncate">
                        <UserPlus className="w-3 h-3 text-primary" />
                        {req.fulfiller?.fullName || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {prettyStatus === 'Pending' && (
                    <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
                      {prettyType}
                    </button>
                  )}
                  {prettyStatus === 'In Progress' && (
                    <button className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-green-500/20 transition-all">
                      Complete
                    </button>
                  )}
                  {prettyStatus === 'Fulfilled' && (
                    <button className="flex-1 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold uppercase tracking-widest cursor-default flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" />
                       Done
                    </button>
                  )}
                  {prettyStatus === 'Cancelled' && (
                    <button className="flex-1 py-2 bg-muted text-red-500/50 rounded-xl text-xs font-bold uppercase tracking-widest cursor-default flex items-center justify-center gap-2 opacity-50">
                       <XCircle className="w-4 h-4" />
                       No Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
