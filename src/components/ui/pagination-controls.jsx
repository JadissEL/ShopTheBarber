import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

export function PaginationControls({ currentPage, onPrevious, onNext, hasNext, isPreviousDisabled }) {
  return (
    <div className="flex items-center justify-end gap-4 py-4 font-sans">
      <div className={cn(stb.caption, 'text-muted-foreground')}>
        Page {currentPage}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage <= 1 || isPreviousDisabled}
          className={cn('h-8 w-8 p-0 rounded-lg', stb.focusRing)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          className={cn('h-8 w-8 p-0 rounded-lg', stb.focusRing)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
