import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { HELP_QUICK_ACTIONS } from '@/components/help/helpCenterContent';

function resolveHref(action) {
  if (action.external) return action.href;
  const base = createPageUrl(action.href);
  if (action.hrefQuery) return `${base}?${action.hrefQuery}`;
  return base;
}

export default function HelpQuickActions() {
  return (
    <nav aria-label="Quick support actions" className="flex flex-wrap justify-center gap-2 md:gap-3">
      {HELP_QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        const href = resolveHref(action);
        const className =
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 hover:border-foreground/10 transition-all duration-200';

        if (action.external) {
          return (
            <a key={action.id} href={action.href} className={className}>
              <Icon className="w-4 h-4 stroke-[1.5] text-muted-foreground" aria-hidden />
              {action.label}
            </a>
          );
        }

        return (
          <Link key={action.id} to={href} className={className}>
            <Icon className="w-4 h-4 stroke-[1.5] text-muted-foreground" aria-hidden />
            {action.label}
          </Link>
        );
      })}
    </nav>
  );
}
