import { motion } from 'framer-motion';
import {
  Building2,
  Check,
  PenLine,
  Scissors,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ACCOUNT_TYPE_VISUALS } from '@/lib/accountTypeVisuals';
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
 * @param {{
 *   card: import('@/lib/accountType').ACCOUNT_TYPE_CARDS[number];
 *   selected: boolean;
 *   onSelect: () => void;
 *   index?: number;
 *   className?: string;
 * }} props
 */
export function AccountTypeOptionCard({ card, selected, onSelect, index = 0, className }) {
  const visual = ACCOUNT_TYPE_VISUALS[card.id];
  const Icon = ICONS[card.id] || User;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-card text-left shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        selected
          ? cn(visual.border, visual.ring, 'ring-2 shadow-md')
          : 'border-border/60 hover:border-border',
        className,
      )}
    >
      {/* Image header */}
      <div className="relative h-[7.5rem] sm:h-[8.5rem] w-full shrink-0 overflow-hidden">
        <OptimizedImage
          src={visual.image}
          alt={visual.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          className={cn('absolute inset-0 bg-gradient-to-t', visual.gradient)}
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl backdrop-blur-sm border border-white/20',
              visual.iconBg,
              visual.iconText,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {selected && (
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/95 text-foreground shadow-sm',
              )}
            >
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="space-y-1">
          <p className={cn(stb.overline, 'text-[10px]', visual.iconText)}>{card.subtitle}</p>
          <h2 className={cn(stb.uiHeading, 'text-lg sm:text-xl leading-tight')}>{card.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.description}</p>
        <ul className="flex flex-wrap gap-2 pt-1">
          {card.features.slice(0, 3).map((f) => (
            <li
              key={f}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                visual.tagBg,
                visual.tagText,
              )}
            >
              {f}
            </li>
          ))}
        </ul>
      </div>
    </motion.button>
  );
}
