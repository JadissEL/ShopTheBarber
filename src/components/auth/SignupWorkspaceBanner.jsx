import { Link } from 'react-router-dom';
import { ArrowLeftRight, Building2, PenLine, Scissors, ShoppingBag, Store, User } from 'lucide-react';
import { ACCOUNT_TYPE_CARDS } from '@/lib/accountType';
import { ACCOUNT_TYPE_VISUALS } from '@/lib/accountTypeVisuals';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const ICONS = {
  client: User,
  solo_barber: Scissors,
  shop: Store,
  seller: ShoppingBag,
  company: Building2,
  blogger: PenLine,
};

/**
 * Compact reminder of the workspace chosen in step 1 (signup / auth flows).
 * @param {{ accountType: string; className?: string }} props
 */
export function SignupWorkspaceBanner({ accountType, className }) {
  const card = ACCOUNT_TYPE_CARDS.find((c) => c.id === accountType);
  const visual = ACCOUNT_TYPE_VISUALS[accountType];
  if (!card || !visual) return null;

  const Icon = ICONS[accountType] || User;
  const changeUrl = `${createPageUrl('ChooseAccountType')}?accountType=${encodeURIComponent(accountType)}`;

  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-card p-4 flex items-start gap-3 shadow-sm',
        visual.border,
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          visual.iconBg,
          visual.iconText,
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn(stb.overline, 'text-[10px]', visual.iconText)}>Step 2 of 2</p>
        <p className="text-sm font-semibold text-foreground">{card.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{card.subtitle}</p>
      </div>
      <Link
        to={changeUrl}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Change
      </Link>
    </div>
  );
}
