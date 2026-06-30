/**
 * Shown while a lazy route chunk loads (Suspense fallback).
 */
import { PageLoading } from '@/components/ui/page-loading';

export default function RoutePageFallback() {
  return (
    <PageLoading
      message="Loading…"
      className="min-h-[40vh]"
    />
  );
}
