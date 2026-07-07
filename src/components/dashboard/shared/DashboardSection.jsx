import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   actionLabel?: string,
 *   actionPage?: string,
 *   className?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function DashboardSection({
  title,
  subtitle,
  actionLabel,
  actionPage,
  className,
  children,
}) {
  return (
    <section className={cn('mb-8', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className={cn(stb.uiHeading, 'text-lg')}>{title}</h2>
          {subtitle ? <p className={cn(stb.body, 'text-sm mt-1')}>{subtitle}</p> : null}
        </div>
        {actionLabel && actionPage ? (
          <Link
            to={createPageUrl(actionPage)}
            className="text-sm font-semibold text-primary hover:underline shrink-0"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
