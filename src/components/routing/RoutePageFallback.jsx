/**
 * Shown while a lazy route chunk loads (Suspense fallback).
 */
export default function RoutePageFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
