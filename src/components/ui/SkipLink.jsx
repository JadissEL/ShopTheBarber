import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 rounded-lg shadow-lg font-sans font-medium transition-transform',
        stb.btn,
        stb.focusRing,
      )}
    >
      Skip to content
    </a>
  );
};
