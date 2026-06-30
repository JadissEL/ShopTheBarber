import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select';

import { ArrowUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';

import { EXPLORE_SORT_OPTIONS } from '@/lib/exploreSort';



export default function SortingBar({ value, onChange, disabled = false, compact = false }) {

  return (

    <div

      className={cn(

        'flex items-center gap-2 rounded-lg border border-border bg-card shadow-sm',

        compact ? 'px-2 h-9' : 'px-3 h-10'

      )}

    >

      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:inline">

        Sort by

      </span>

      <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0 sm:hidden" aria-hidden />

      <Select value={value} onValueChange={onChange} disabled={disabled}>

        <SelectTrigger

          className={cn(

            'border-0 bg-transparent shadow-none px-0 text-sm font-medium focus:ring-0',

            compact ? 'w-[120px] sm:w-[148px] h-7' : 'w-[148px] sm:w-[180px] h-8'

          )}

          aria-label="Sort barbers"

        >

          <SelectValue placeholder="Sort by" />

        </SelectTrigger>

        <SelectContent>

          {EXPLORE_SORT_OPTIONS.map((opt) => (

            <SelectItem key={opt.id} value={opt.id}>

              {opt.label}

            </SelectItem>

          ))}

        </SelectContent>

      </Select>

    </div>

  );

}


