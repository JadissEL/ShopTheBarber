import { cn } from '@/lib/utils';

/** Shared class tokens for provider-setup wizards (dark = legacy onboarding page, light = SetupGuide) */
export function useProviderSetupTheme(variant = 'dark') {
  const light = variant === 'light';
  return {
    subtitle: light ? 'text-muted-foreground' : 'text-muted-foreground/80',
    panel: light
      ? 'bg-card p-6 rounded-xl border border-border shadow-sm'
      : 'bg-[#1A1D24] p-6 rounded-xl border border-white/10',
    input: light ? '' : 'bg-slate-950 border-white/10 text-white',
    listItem: light
      ? 'bg-muted/40 p-4 rounded-xl border border-border flex justify-between items-center'
      : 'bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex justify-between items-center',
    listTitle: light ? 'font-bold text-foreground' : 'font-bold text-white',
    listMeta: light ? 'text-sm text-muted-foreground' : 'text-sm text-muted-foreground/80',
    empty: light
      ? 'text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl'
      : 'text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-xl',
    schedulePanel: light
      ? 'bg-card rounded-xl border border-border overflow-hidden divide-y divide-border'
      : 'bg-[#1A1D24] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5',
    dayLabel: light ? 'font-medium text-sm text-foreground' : 'font-medium text-sm text-gray-300',
    closedLabel: light ? 'text-sm text-muted-foreground italic px-2' : 'text-sm text-muted-foreground italic px-2',
    ghostBtn: light ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/80 hover:text-white',
    primaryBtn: light ? 'px-8' : 'bg-emerald-500 hover:bg-emerald-600 text-white px-8',
    addBtn: light ? 'w-full' : 'w-full bg-slate-800 hover:bg-slate-700 text-white',
    uploadZone: light
      ? 'border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer'
      : 'border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer',
    uploadIcon: light ? 'w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3' : 'w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3',
    uploadText: light ? 'text-foreground text-sm font-medium' : 'text-gray-300 text-sm font-medium',
    saveBtn: light ? 'w-full' : 'w-full bg-emerald-500 hover:bg-emerald-600 text-white',
    timeSelect: light ? 'w-24 h-9 text-xs' : 'w-24 h-9 bg-primary border-primary-foreground/20 text-xs',
    deleteBtn: light ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
    cn,
  };
}
