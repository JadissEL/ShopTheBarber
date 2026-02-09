import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';

export default function AvailabilitySetup({ shopId, onNext, onBack }) {
    const queryClient = useQueryClient();

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
            <SelectTrigger className="w-24 h-9 bg-primary border-primary-foreground/20 text-xs">
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
                <p className="text-gray-400">Define your standard weekly working hours.</p>
            </div>

            <div className="bg-[#1A1D24] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                {schedule.map((daySchedule, i) => {
                    return (
                        <div key={daySchedule.day} className="p-4 flex items-center gap-4">
                            <div className="w-28 font-medium text-sm text-gray-300">{daySchedule.day}</div>
                            <Switch
                                checked={!daySchedule.is_closed}
                                onCheckedChange={(checked) => handleDayChange(i, 'is_closed', !checked)}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                            <div className="flex-1 flex items-center gap-2 justify-end md:justify-start">
                                {!daySchedule.is_closed ? (
                                    <>
                                        <TimeSelect
                                            value={daySchedule.open_time}
                                            onChange={(val) => handleDayChange(i, 'open_time', val)}
                                        />
                                        <span className="text-gray-500 text-xs">to</span>
                                        <TimeSelect
                                            value={daySchedule.close_time}
                                            onChange={(val) => handleDayChange(i, 'close_time', val)}
                                        />
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-600 italic px-2">Closed</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
                    Back
                </Button>
                <Button onClick={() => updateScheduleMutation.mutate(schedule)} disabled={updateScheduleMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                    {updateScheduleMutation.isPending ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
