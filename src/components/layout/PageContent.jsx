import { cn } from '@/lib/utils';

/** Standard content wrapper — consistent max-width and padding site-wide. */
export default function PageContent({ children, className, narrow = false }) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8',
        narrow ? 'max-w-3xl' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
