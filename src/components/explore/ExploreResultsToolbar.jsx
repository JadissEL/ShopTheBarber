import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import SortingBar from '@/components/explore/SortingBar';

export default function ExploreResultsToolbar({
  viewType,
  resultsHeading,
  resultCount,
  searchTerm,
  pageConfigSubtext,
  sortBy,
  onSortChange,
  isRefreshing,
}) {
  const entityLabel = viewType === 'professionals' ? 'professional' : 'shop';
  const pluralSuffix = resultCount === 1 ? '' : 's';

  return (
    <header
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 md:mb-5"
      aria-label="Results"
    >
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {resultsHeading}
        </h2>
        <p className="text-sm text-muted-foreground">
          {resultCount} {entityLabel}
          {pluralSuffix}
          {searchTerm.trim() ? ` matching "${searchTerm.trim()}"` : ''}
          {pageConfigSubtext && !searchTerm.trim() ? pageConfigSubtext : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <RefreshIndicator isRefreshing={isRefreshing} />
        {viewType === 'professionals' ? (
          <>
            <SortingBar value={sortBy} onChange={onSortChange} compact />
            <Link to={createPageUrl('Barbers')} aria-label="View barbers map">
              <Button variant="outline" size="sm" className=" gap-2 h-10 border-border" aria-label="View barbers map">
                <Map className="w-4 h-4" aria-hidden />
                <span className="hidden xs:inline">Map</span>
              </Button>
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
