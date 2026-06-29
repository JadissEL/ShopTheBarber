import { cn } from '@/lib/utils';



const SIZE_CLASSES = {

  sm: 'px-3 py-1.5 min-h-[34px] text-xs gap-1',

  md: 'px-3.5 py-2 min-h-[40px] text-xs gap-1.5',

};



export default function FilterChip({

  active = false,

  onClick,

  icon: Icon,

  label,

  activeClassName,

  className,

  size = 'md',

  children,

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      aria-pressed={active}

      aria-label={label}

      className={cn(

        'inline-flex items-center rounded-full font-medium border whitespace-nowrap snap-start shrink-0',

        'transition-all duration-200 tap-highlight-none',

        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,

        active

          ? activeClassName ?? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/15'

          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 hover:bg-muted/50 hover:shadow-sm',

        className

      )}

    >

      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden /> : null}

      <span>{children ?? label}</span>

    </button>

  );

}


