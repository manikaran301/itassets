import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MousePointer2, 
  Keyboard, 
  Monitor, 
  Headphones, 
  Usb, 
  Webcam, 
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccessoriesPage() {
  const accessories = [
    { tag: 'ACC-M01', type: 'Mouse', make: 'Logitech', model: 'MX Master 3', status: 'Available', condition: 'Excellent', user: null },
    { tag: 'ACC-K01', type: 'Keyboard', make: 'Keychron', model: 'K2 v2', status: 'Assigned', condition: 'Good', user: 'Rahul Sharma' },
    { tag: 'ACC-MN02', type: 'Monitor', make: 'Dell', model: 'UltraSharp 27', status: 'Assigned', condition: 'Excellent', user: 'Anjali Gupta' },
    { tag: 'ACC-HS01', type: 'Headset', make: 'Jabra', model: 'Evolve 75', status: 'In Repair', condition: 'Damaged', user: null },
    { tag: 'ACC-DS03', type: 'Docking Station', make: 'Caldigit', model: 'TS4', status: 'Available', condition: 'Excellent', user: null },
    { tag: 'ACC-WC01', type: 'Webcam', make: 'Logitech', model: 'Brio 4K', status: 'Retired', condition: 'Fair', user: null },
  ];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Peripheral Inventory</h2>
          <p className="text-muted-foreground mt-1">Lifecycle tracking for mice, keyboards, monitors, and headsets.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl shadow-xl shadow-primary/10 transition-all font-semibold">
            <Plus className="w-5 h-5" />
            <span>Store Asset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-100">
        {accessories.map((acc) => {
          const Icon = getTypeIcon(acc.type);
          return (
            <div key={acc.tag} className="premium-card rounded-2xl overflow-hidden glass border-border/50 group flex flex-col h-full bg-card/60">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border group-hover:bg-primary/5 transition-colors">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight uppercase group-hover:text-primary transition-colors">{acc.tag}</h4>
                      <p className="text-[10px] text-muted-foreground italic tracking-tight">{acc.type}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm",
                    acc.status === 'Available' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
                    acc.status === 'Assigned' ? "bg-primary/10 text-primary border-primary/20" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {acc.status === 'Available' ? <CheckCircle2 className="w-3" /> : <ShieldCheck className="w-3" />}
                    {acc.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-tight truncate">{acc.make} {acc.model}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    acc.condition === 'Excellent' ? "text-green-500" :
                    acc.condition === 'Good' ? "text-primary" :
                    "text-accent"
                  )}>Condition: {acc.condition}</p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Currently With</span>
                    <span className="text-sm font-medium h-5">{acc.user || 'In Store'}</span>
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
