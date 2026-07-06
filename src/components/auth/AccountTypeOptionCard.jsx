import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ACCOUNT_TYPE_VISUALS } from '@/lib/accountTypeVisuals';
import { cn } from '@/lib/utils';

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

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      aria-pressed={selected}
      id={`account-type-${card.id}`}
      style={{
        backgroundColor: visual.cardBg,
        ...(selected
          ? { boxShadow: `0 0 0 2px ${visual.cardBg}, 0 0 0 5px ${visual.ring}` }
          : undefined),
      }}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-[2.5rem] text-left',
        'border border-black/10 shadow-sm transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/30',
        selected && 'shadow-lg',
        className,
      )}
      data-selected={selected || undefined}
    >
      {selected && (
        <span
          className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md"
          aria-hidden
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
      )}

      {/* Hero image — flush with card top */}
      <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden">
        <OptimizedImage
          src={visual.image}
          alt={visual.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, 420px"
          imgClassName="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {visual.imageOverlay ? (
          <div className="absolute inset-0" style={{ background: visual.imageOverlay }} aria-hidden />
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-6 px-7 pb-8 pt-7 sm:px-8 sm:pb-9 sm:pt-8">
        <div className="space-y-1.5">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: visual.subtitleColor }}
          >
            {card.subtitle}
          </p>
          <h2
            className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl"
            style={{ color: visual.titleColor }}
          >
            {card.title}
          </h2>
        </div>

        <div className="flex flex-1 gap-4 sm:gap-5">
          <div
            className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: visual.accentBar }}
            aria-hidden
          />
          <p className="text-sm leading-relaxed sm:text-[0.9375rem]" style={{ color: visual.bodyColor }}>
            {card.description}
          </p>
        </div>

        <span
          className={cn(
            'inline-flex w-fit items-center rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200',
            'group-hover:scale-[1.02]',
          )}
          style={{
            backgroundColor: visual.buttonBg,
            color: visual.buttonText,
            border: visual.buttonBorder ? `2px solid ${visual.buttonBorder}` : undefined,
          }}
        >
          {card.cta}
        </span>
      </div>
    </motion.button>
  );
}
