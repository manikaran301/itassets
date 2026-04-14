import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  count: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  count, 
  icon: Icon, 
  trend, 
  trendValue,
  className 
}: StatsCardProps) {
  return (
    <div className={cn("p-6 rounded-2xl premium-card glass animate-fade-in group", className)}>
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
            trend === 'up' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
            trend === 'down' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground truncate">{count}</span>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
      
      <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
          style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
        />
      </div>
    </div>
  );
}
