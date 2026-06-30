import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export function PageError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div className={cn(stb.surface, 'flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn(stb.iconBox, 'w-16 h-16 mb-6 border-destructive/30 bg-destructive/10 text-destructive')}>
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className={cn(stb.uiHeading, 'text-lg mb-2')}>{title}</h3>
      <p className={cn(stb.body, 'max-w-sm mb-6')}>{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
