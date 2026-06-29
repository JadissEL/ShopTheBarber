import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HelpHero({ searchQuery, onSearchChange }) {
  return (
    <section className="relative border-b border-border/60 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight text-foreground mb-4">
          How can we help?
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Find answers, troubleshoot issues, or contact our support team.
        </p>

        <div className="relative max-w-xl mx-auto group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search help articles…"
            aria-label="Search help center"
            className="pl-12 pr-10 h-12 md:h-14 rounded-xl border-border bg-card shadow-sm text-base focus-visible:ring-2 focus-visible:ring-primary/30 transition-shadow duration-200"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors duration-150"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
