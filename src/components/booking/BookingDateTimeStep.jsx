import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Clock, Calendar as CalendarIcon, ArrowRight, ListPlus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function BookingDateTimeStep({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  timeSlots,
  waitlistTimeSlots = [],
  slotsLoading = false,
  onJoinWaitlist,
  onASAP,
  onNext,
  canProceed,
}) {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <motion.div key="datetime" {...motionProps} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-balance text-foreground">Select Date &amp; Time</h2>
        <p className="text-muted-foreground text-sm">Choose your preferred appointment time</p>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          type="button"
          size="lg"
          onClick={onASAP}
          className="px-8 h-12 text-base rounded-lg shadow-sm touch-manipulation"
        >
          <Clock className="w-5 h-5 mr-2" aria-hidden />
          Book ASAP (Next Available)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="stb-panel p-5 md:p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" aria-hidden />
            Pick a Date
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className=" border-0 w-full"
          />
          {selectedDate && (
            <p className="mt-4 text-sm text-center text-muted-foreground">
              Selected: <strong className="text-foreground">{format(selectedDate, 'PPPP')}</strong>
            </p>
          )}
        </div>

        <div className="stb-panel p-6 space-y-6">
          <div>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" aria-hidden />
              Pick a Time
            </h3>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-6 text-center">
                Select a date to see available times.
              </p>
            ) : slotsLoading ? (
              <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading times…">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className=" border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <p>No open slots on this date.</p>
                {onJoinWaitlist && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 touch-manipulation"
                    onClick={() => onJoinWaitlist(null)}
                  >
                    <ListPlus className="w-4 h-4 mr-2" aria-hidden />
                    Join Waitlist for This Date
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Available times">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={selectedTime === time}
                    onClick={() => onSelectTime(time)}
                    className={cn(
                      'py-3 px-4 rounded-lg border-2 font-medium text-sm touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2',
                      selectedTime === time
                        ? 'border-success bg-success text-success-foreground shadow-sm'
                        : 'border-border hover:border-success/40 bg-background'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDate && waitlistTimeSlots.length > 0 && onJoinWaitlist && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Fully Booked — Join Waitlist</h4>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Waitlist times">
                {waitlistTimeSlots.map((time) => (
                  <button
                    key={`waitlist-${time}`}
                    type="button"
                    onClick={() => onJoinWaitlist(time)}
                    className="py-3 px-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/10/80 dark:bg-primary/10 text-primary-foreground dark:text-primary-foreground font-medium text-sm hover:bg-primary/15 dark:hover:bg-primary/15 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {time}
                    <span className="block text-[10px] font-normal opacity-80">Waitlist</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" size="lg" onClick={onNext} disabled={!canProceed} className="px-8 touch-manipulation">
          Continue <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}
