import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { useDashboardShell } from '@/components/layout/DashboardShellContext';
import { useDashboardBreadcrumbTitle } from '@/components/layout/DashboardBreadcrumbContext';
import { resolveDashboardBreadcrumbs } from '@/lib/dashboardBreadcrumbs';
import { cn } from '@/lib/utils';

export default function DashboardBreadcrumbs({ className }) {
  const location = useLocation();
  const inShell = useDashboardShell();
  const { effectiveRole } = useEffectiveRole();
  const dynamicTitle = useDashboardBreadcrumbTitle();

  if (!inShell) return null;

  const items = resolveDashboardBreadcrumbs(location.pathname, {
    role: effectiveRole,
    dynamicTitle,
  });

  if (!items?.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'border-b border-border/60 bg-background/95 backdrop-blur-sm',
        'px-4 md:px-6 lg:px-8 py-2.5 shrink-0',
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm font-sans">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1 min-w-0">
              {index > 0 ? (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
              ) : null}
              {crumb.current || isLast || !crumb.href ? (
                <span
                  className={cn(
                    'truncate max-w-[14rem] sm:max-w-xs',
                    isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="truncate max-w-[14rem] sm:max-w-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
