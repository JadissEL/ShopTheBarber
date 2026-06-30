import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar, Clock, ListOrdered, Scissors, User } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

function formatSlot(iso) {
    if (!iso) return 'Flexible';
    try {
        return format(parseISO(iso), 'EEE d MMM · h:mm a');
    } catch {
        return iso;
    }
}

function groupEntriesBySlot(entries) {
    const map = new Map();
    for (const entry of entries) {
        const key = entry.slot_start || 'unknown';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
    }
    return [...map.entries()].sort((a, b) => {
        if (a[0] === 'unknown') return 1;
        if (b[0] === 'unknown') return -1;
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
}

function QueueEntryRow({ entry }) {
    const isOffered = entry.status === 'offered';

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
                isOffered ? 'border-primary/40 bg-primary/10/40 dark:bg-primary/10' : 'border-border/60 bg-background'
            }`}
        >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                #{entry.position ?? '—'}
            </div>
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={entry.client_avatar_url} alt={entry.client_name} />
                <AvatarFallback>
                    <User className="w-4 h-4 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{entry.client_name ?? 'Client'}</p>
                    <StatusBadge status={entry.status} className="capitalize text-[10px]" />
                </div>
                {entry.service_name && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Scissors className="w-3 h-3 shrink-0" aria-hidden />
                        {entry.service_label ?? entry.service_name}
                    </p>
                )}
            </div>
            {isOffered && (
                <span className="text-[10px] font-medium text-muted-foreground dark:text-primary shrink-0">
                    Offer sent
                </span>
            )}
        </div>
    );
}

export default function ProviderWaitlistPanel({ entries = [], isLoading }) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-lg bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <EmptyState
                icon={ListOrdered}
                title="No one waiting"
                description="When clients join the queue for a full slot, they'll appear here grouped by time."
            />
        );
    }

    const groups = groupEntriesBySlot(entries);

    return (
        <div className="space-y-6">
            {groups.map(([slotStart, slotEntries]) => {
                const serviceName = slotEntries.find((e) => e.service_name)?.service_name;
                const pendingCount = slotEntries.filter((e) => e.status === 'pending').length;
                const offeredCount = slotEntries.filter((e) => e.status === 'offered').length;

                return (
                    <motion.section
                        key={slotStart}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(stb.panel, 'overflow-hidden')}
                    >
                        <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                                    {formatSlot(slotStart === 'unknown' ? null : slotStart)}
                                </p>
                                {serviceName && (
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Scissors className="w-3 h-3" />
                                        {serviceName}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <ListOrdered className="w-3 h-3" />
                                    {slotEntries.length} waiting
                                </span>
                                {offeredCount > 0 && (
                                    <span className="text-primary font-medium">
                                        · {offeredCount} offered
                                    </span>
                                )}
                                {pendingCount > 0 && offeredCount === 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Next gets offer on cancel
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {slotEntries
                                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                                .map((entry) => (
                                    <QueueEntryRow key={entry.id} entry={entry} />
                                ))}
                        </div>
                    </motion.section>
                );
            })}
        </div>
    );
}
