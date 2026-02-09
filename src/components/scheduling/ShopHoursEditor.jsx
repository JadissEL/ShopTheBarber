import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Clock, AlertCircle } from 'lucide-react';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ShopHoursEditor({ shopId, barberId }) {
    const queryClient = useQueryClient();
    const [schedule, setSchedule] = useState({});

    // Fetch existing shifts for this barber in this shop
    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ['shifts', shopId, barberId],
        queryFn: () => sovereign.entities.Shift.filter({ shop_id: shopId, barber_id: barberId }),
        enabled: !!shopId && !!barberId
    });

    // Initialize local state from remote shifts
    useEffect(() => {
        const initial = {};
        DAYS.forEach(day => {
            const existing = shifts.find(s => s.day === day);
            initial[day] = existing ? {
                id: existing.id,
                day: existing.day,
                start_time: existing.start_time,
                end_time: existing.end_time,
                is_closed: false
            } : {
                day: day,
                start_time: '09:00',
                end_time: '18:00',
                is_closed: true // Default to closed if not defined
            };
        });
        setSchedule(initial);
    }, [shifts]);

    const saveMutation = useMutation({
        mutationFn: async (updatedSchedule) => {
            const promises = Object.values(updatedSchedule).map(dayData => {
                const payload = {
                    day: dayData.day,
                    start_time: dayData.start_time,
                    end_time: dayData.end_time,
                    shop_id: shopId,
                    barber_id: barberId
                };

                if (dayData.is_closed) {
                    if (dayData.id) {
                        return sovereign.entities.Shift.delete(dayData.id);
                    }
                    return Promise.resolve();
                }

                if (dayData.id) {
                    return sovereign.entities.Shift.update(dayData.id, payload);
                } else {
                    return sovereign.entities.Shift.create(payload);
                }
            });
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts', shopId, barberId] });
            toast.success("Availability updated");
        },
        onError: () => toast.error("Failed to sync hours")
    });

    const handleChange = (day, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    if (isLoading) return <div className="py-12 flex justify-center"><Loader className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-1 gap-3">
                {DAYS.map(day => {
                    const dayData = schedule[day] || {};
                    return (
                        <div key={day} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all ${dayData.is_closed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-4 mb-3 md:mb-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${dayData.is_closed ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}>
                                    {day.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{day}</p>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase">{dayData.is_closed ? 'Rest Day' : 'Work Day'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={!dayData.is_closed}
                                        onCheckedChange={(val) => handleChange(day, 'is_closed', !val)}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                    <span className="text-sm font-bold text-slate-600">{dayData.is_closed ? 'OFF' : 'ON'}</span>
                                </div>

                                {!dayData.is_closed ? (
                                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <input
                                                type="time"
                                                value={dayData.start_time}
                                                onChange={(e) => handleChange(day, 'start_time', e.target.value)}
                                                className="bg-transparent text-sm font-bold text-foreground outline-none w-20"
                                            />
                                        </div>
                                        <span className="text-slate-300 font-bold">→</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={dayData.end_time}
                                                onChange={(e) => handleChange(day, 'end_time', e.target.value)}
                                                className="bg-transparent text-sm font-bold text-foreground outline-none w-20"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-[200px] flex items-center justify-center py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        No Shifts Observed
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-8 flex items-center justify-between border-t border-slate-100 mt-8">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Updates apply to future search availability.</span>
                </div>
                <Button
                    onClick={() => saveMutation.mutate(schedule)}
                    disabled={saveMutation.isPending}
                    className="rounded-2xl h-12 px-10 font-black shadow-xl bg-primary hover:opacity-95 transition-all active:scale-95"
                >
                    {saveMutation.isPending ? 'Syncing...' : 'Lock Availability'}
                </Button>
            </div>
        </div>
    );
}

function Loader({ className }) {
    return <Clock className={`${className} animate-spin`} />;
}