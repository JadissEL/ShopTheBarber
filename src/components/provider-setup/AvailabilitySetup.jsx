import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { useProviderSetupTheme } from '@/components/provider-setup/providerSetupTheme';

export default function AvailabilitySetup({ shopId, onNext, onBack, variant = 'dark' }) {
    const queryClient = useQueryClient();
    const t = useProviderSetupTheme(variant);

    // Local state for schedule
    const [schedule, setSchedule] = useState(() => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return days.map(day => ({
            day,
            open_time: "09:00",
            close_time: "17:00",
            is_closed: day === "Sunday"
        }));
    });

    const updateScheduleMutation = useMutation({
        mutationFn: async (items) => {
            // 1. Delete existing shifts to avoid duplicates
            const existing = await sovereign.entities.Shift.filter({ shop_id: shopId });
            if (existing.length > 0) {
                await Promise.all(existing.map(item => sovereign.entities.Shift.delete(item.id)));
            }

            // 2. Create new shifts
            const scheduleItems = items.filter(i => !i.is_closed).map(item => ({
                day: item.day,
                start_time: item.open_time,
                end_time: item.close_time,
                shop_id: shopId
            }));

            await Promise.all(scheduleItems.map(item => sovereign.entities.Shift.create(item)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success("Availability saved");
            onNext();
        }
    });

    const handleDayChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const _days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const TimeSelect = ({ value, onChange, disabled }) => (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={t.timeSelect}>
                <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
                {hours.map(h => {
                    const time = `${h.toString().padStart(2, '0')}:00`;
                    return <SelectItem key={time} value={time}>{time}</SelectItem>;
                })}
            </SelectContent>
        </Select>
    );

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Set Your Availability</h2>
                <p className={t.subtitle}>Define your standard weekly working hours.</p>
            </div>

            <div className={t.schedulePanel}>
                {schedule.map((daySchedule, i) => {
                    return (
                        <div key={daySchedule.day} className="p-4 flex items-center gap-4">
                            <div className={t.cn('w-28', t.dayLabel)}>{daySchedule.day}</div>
                            <Switch
                                checked={!daySchedule.is_closed}
                                onCheckedChange={(checked) => handleDayChange(i, 'is_closed', !checked)}
                                className="data-[state=checked]:bg-primary/100"
                            />
                            <div className="flex-1 flex items-center gap-2 justify-end md:justify-start">
                                {!daySchedule.is_closed ? (
                                    <>
                                        <TimeSelect
                                            value={daySchedule.open_time}
                                            onChange={(val) => handleDayChange(i, 'open_time', val)}
                                        />
                                        <span className="text-muted-foreground text-xs">to</span>
                                        <TimeSelect
                                            value={daySchedule.close_time}
                                            onChange={(val) => handleDayChange(i, 'close_time', val)}
                                        />
                                    </>
                                ) : (
                                    <span className={t.closedLabel}>Closed</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack} className={t.ghostBtn}>
                    Back
                </Button>
                <Button onClick={() => updateScheduleMutation.mutate(schedule)} disabled={updateScheduleMutation.isPending} className={t.primaryBtn}>
                    {updateScheduleMutation.isPending ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
