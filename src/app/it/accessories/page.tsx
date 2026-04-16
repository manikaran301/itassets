import { 
  Plus,
  MousePointer2, 
  Keyboard, 
  Monitor, 
  Headphones, 
  Usb, 
  Webcam, 
  Package,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import prisma from "@/lib/prisma";

export default async function AccessoriesPage() {
  const accessories = await prisma.accessory.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      currentEmployee: {
        select: { fullName: true },
      },
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mouse': return MousePointer2;
      case 'keyboard': return Keyboard;
      case 'monitor': return Monitor;
      case 'headset': return Headphones;
      case 'docking station': return Usb;
      case 'webcam': return Webcam;
      default: return Package;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>Store Asset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
        {accessories.map((acc) => {
          const prettyType = acc.type.replaceAll("_", " ");
          const prettyStatus = acc.status.replaceAll("_", " ");
          const prettyCondition = acc.condition.replaceAll("_", " ");
          const Icon = getTypeIcon(prettyType);
          return (
            <div key={acc.id} className="premium-card rounded-2xl overflow-hidden glass border-border/50 group flex flex-col h-full bg-card/60">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border group-hover:bg-primary/5 transition-colors">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">{acc.assetTag}</h4>
                      <p className="text-[10px] text-muted-foreground italic tracking-tight">{prettyType}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm",
                    acc.status === 'available' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
                    acc.status === 'assigned' ? "bg-primary/10 text-primary border-primary/20" :
                    acc.status === 'in_repair' ? "bg-accent/10 text-accent border-accent/20" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {acc.status === 'available' ? <CheckCircle2 className="w-3" /> : acc.status === "in_repair" ? <AlertTriangle className="w-3" /> : <ShieldCheck className="w-3" />}
                    {prettyStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-tight truncate">{acc.make || "Unknown"} {acc.model || ""}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    acc.condition === 'excellent' ? "text-green-500" :
                    acc.condition === 'good' ? "text-primary" :
                    "text-accent"
                  )}>Condition: {prettyCondition}</p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Currently With</span>
                    <span className="text-sm font-medium h-5">{acc.currentEmployee?.fullName || 'In Store'}</span>
                  </div>
                  <button className="p-1 px-3 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-border transition-colors">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
