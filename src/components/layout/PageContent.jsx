import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

/** Standard content wrapper — consistent max-width and padding site-wide. */
export default function PageContent({ children, className, narrow = false }) {
  return (
    <div
      className={cn(
        narrow ? stb.containerNarrow : stb.container,
        'py-6 md:py-8 font-sans',
        className,
      )}
    >
      {children}
    </div>
  );
}
