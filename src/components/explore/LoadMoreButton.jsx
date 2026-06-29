import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function LoadMoreButton({ remaining, onClick, loading = false }) {
  if (remaining <= 0) return null;

  return (
    <div className="flex justify-center pt-10 pb-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onClick}
        disabled={loading}
        className="rounded-full px-8 h-11 font-medium gap-2 border-border hover:bg-muted/60 transition-colors duration-200"
        aria-label={`Load ${remaining} more professionals`}
      >
        <ChevronDown className="w-4 h-4" aria-hidden />
        Load more ({remaining} remaining)
      </Button>
    </div>
  );
}
