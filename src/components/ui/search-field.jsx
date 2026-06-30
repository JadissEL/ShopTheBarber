import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

/**
 * Shared search field — Explore, Marketplace, Dashboard, Admin filters.
 */
export default function SearchField({
  value,
  onChange,
  onClear,
  placeholder = 'Search…',
  className,
  inputClassName,
  id,
  size = 'default',
  'aria-label': ariaLabel = 'Search',
}) {
  const showClear = Boolean(value && onClear);

  return (
    <div className={cn(stb.searchWrap, className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground',
          size === 'lg' ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4',
        )}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          stb.searchInput,
          size === 'lg' && 'h-12 pl-12 text-base',
          showClear && (size === 'lg' ? 'pr-12' : 'pr-10'),
          inputClassName,
        )}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground stb-focus-ring"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
