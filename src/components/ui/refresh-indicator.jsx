import { Loader2 } from 'lucide-react';
import { cn } from '@/components/utils';

export function RefreshIndicator({ isRefreshing, className }) {
  if (!isRefreshing) return null;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-border shadow-sm text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-top-2", className)}>
      <Loader2 className="w-3 h-3 animate-spin text-primary" />
      <span>Updating...</span>
    </div>
  );
}