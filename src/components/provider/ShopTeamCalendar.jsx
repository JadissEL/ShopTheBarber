import { useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Clock } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Multi-barber day view: shifts + upcoming bookings per staff member.
 */
export default function ShopTeamCalendar({ members = [], shifts = [], bookings = [], selectedDate = new Date() }) {
  const dayName = DAYS[selectedDate.getDay()];

  const enriched = useMemo(() => {
    return members
      .filter((m) => m.status !== 'inactive')
      .map((member) => {
        const barberId = member.barber_id ?? member.barber?.id;
        const memberShifts = shifts.filter(
          (s) =>
            s.day === dayName &&
            (s.shop_member_id === member.id || s.barber_id === barberId)
        );
        const memberBookings = bookings.filter((b) => {
          if (b.barber_id !== barberId) return false;
          try {
            return isSameDay(parseISO(b.start_time), selectedDate);
          } catch {
            return false;
          }
        });
        return {
          member,
          name: member.barber?.name ?? 'Staff',
          image: member.barber?.image_url,
          shifts: memberShifts.sort((a, b) => a.start_time.localeCompare(b.start_time)),
          bookings: memberBookings.sort((a, b) => a.start_time.localeCompare(b.start_time)),
        };
      });
  }, [members, shifts, bookings, dayName, selectedDate]);

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
        {format(selectedDate, 'EEEE, MMMM d')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enriched.map(({ member, name, image, shifts: dayShifts, bookings: dayBookings }) => (
          <Card key={member.id} className="p-4 rounded-2xl border-slate-200 bg-card">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <UserAvatar src={image} name={name} className="w-10 h-10" />
              <div>
                <p className="font-bold text-sm">{name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">{member.role}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Shifts</p>
              {dayShifts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Off today</p>
              ) : (
                dayShifts.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs font-medium text-foreground mb-1">
                    <Clock className="w-3 h-3 text-primary" />
                    {s.start_time} - {s.end_time}
                  </div>
                ))
              )}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Appointments</p>
              {dayBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No bookings</p>
              ) : (
                dayBookings.map((b) => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 last:border-0">
                    <div>
                      <p className="text-xs font-bold">{format(parseISO(b.start_time), 'HH:mm')}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {b.client_name || b.service_name || 'Client'}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                      {b.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
      {enriched.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">Add team members to see the shop calendar.</p>
      )}
    </div>
  );
}
