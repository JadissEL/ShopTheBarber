import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/components/utils';
import { format } from 'date-fns';

export default function BookingDateTimeStep({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  timeSlots,
  onASAP,
  onNext,
  canProceed,
}) {
  return (
    <motion.div
      key="datetime"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose your preferred appointment time</p>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          size="lg"
          onClick={onASAP}
          className="bg-primary text-primary-foreground hover:opacity-95 px-8 h-14 text-lg rounded-full shadow-lg"
        >
          <Clock className="w-5 h-5 mr-2" /> Book ASAP (Next Available)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Date Selection */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Pick a Date
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            disabled={(date) => date < new Date()}
            className="rounded-xl border-0 w-full"
          />
          {selectedDate && (
            <p className="mt-4 text-sm text-center text-muted-foreground">
              Selected: <strong className="text-foreground">{format(selectedDate, 'PPPP')}</strong>
            </p>
          )}
        </div>

        {/* Time Selection */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Pick a Time
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => onSelectTime(time)}
                className={cn(
                  "py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm",
                  selectedTime === time
                    ? "border-primary bg-primary text-white"
                    : "border-border hover:border-primary/50"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className="px-8"
        >
          Continue <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
