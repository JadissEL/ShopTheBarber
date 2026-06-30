import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

/** Shared class tokens for provider-setup wizards — uses main design tokens only */
export function useProviderSetupTheme(variant = 'light') {
  const light = variant !== 'dark';

  return {
    subtitle: 'text-muted-foreground',
    panel: cn(stb.formSection, !light && 'bg-[hsl(var(--navy))] border-white/10 text-white'),
    input: light ? '' : 'bg-[hsl(var(--navy))] border-white/15 text-white placeholder:text-white/50',
    listItem: cn(
      'p-4 rounded-lg border flex justify-between items-center',
      light ? 'bg-muted/40 border-foreground/10' : 'bg-[hsl(var(--navy))] border-white/10',
    ),
    listTitle: cn(stb.uiHeading, 'text-base', !light && 'text-white'),
    listMeta: stb.caption,
    empty: cn(
      'text-center py-8 border border-dashed rounded-lg',
      light ? 'text-muted-foreground border-foreground/15' : 'text-white/60 border-white/15',
    ),
    schedulePanel: cn(
      'rounded-lg border overflow-hidden divide-y',
      light ? 'bg-card border-foreground/10 divide-foreground/10' : 'bg-[hsl(var(--navy))] border-white/10 divide-white/10',
    ),
    dayLabel: cn(stb.formLabel, 'text-sm', !light && 'text-white'),
    closedLabel: cn(stb.caption, 'italic px-2'),
    ghostBtn: 'text-muted-foreground hover:text-foreground',
    primaryBtn: cn(stb.btn, 'px-8'),
    addBtn: cn('w-full', light ? '' : 'bg-foreground/90 hover:bg-foreground text-background'),
    uploadZone: cn(
      'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
      light ? 'border-foreground/15 hover:bg-muted/50' : 'border-white/15 hover:bg-white/5',
    ),
    uploadIcon: cn(stb.iconBox, 'mx-auto mb-3 w-10 h-10'),
    uploadText: cn(stb.formLabel, 'text-sm', !light && 'text-white/80'),
    saveBtn: cn(stb.btn, 'w-full'),
    timeSelect: cn('w-24 h-9 text-xs', !light && 'bg-primary border-primary-foreground/20'),
    deleteBtn: 'text-destructive hover:text-destructive hover:bg-destructive/10',
    cn,
  };
}
