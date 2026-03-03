import { Loader2 } from 'lucide-react';
import { cn } from '@/components/utils';

export function PageLoading({ className, message = 'Loading...' }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-24 gap-4", className)}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export function InlineLoading({ className }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
    </div>
  );
}
