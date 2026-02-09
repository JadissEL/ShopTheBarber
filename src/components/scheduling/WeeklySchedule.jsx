import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/ui/user-avatar';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklySchedule({ shopId, staffMembers, context = 'shop', barberId }) {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', shopId, context, barberId],
    queryFn: async () => {
        if (context === 'independent' && barberId) {
            // Fetch independent shifts (no shop_id)
            const allShifts = await sovereign.entities.Shift.filter({ barber_id: barberId });
            return allShifts.filter(s => !s.shop_id);
        }
        
        if(!shopId) return [];
        return sovereign.entities.Shift.filter({ shop_id: shopId });
    },
    enabled: !!(shopId || (context === 'independent' && barberId))
  });

  const deleteShiftMutation = useMutation({
      mutationFn: (id) => sovereign.entities.Shift.delete(id),
      onSuccess: () => {
          queryClient.invalidateQueries(['shifts']);
          toast.success("Shift removed");
      }
  });

  // Group shifts by Day -> Staff
  const scheduleMatrix = React.useMemo(() => {
      const matrix = {};
      DAYS.forEach(day => matrix[day] = []);
      
      shifts.forEach(shift => {
          if (matrix[shift.day]) {
              let memberName = 'Me';
              let memberImage = null;

              if (context === 'shop') {
                  const member = staffMembers.find(m => m.id === shift.shop_member_id);
                  memberName = member?.barber?.name || 'Unknown';
                  memberImage = member?.barber?.image_url;
              }
              
              matrix[shift.day].push({ ...shift, memberName, memberImage });
          }
      });
      return matrix;
  }, [shifts, staffMembers, context]);

  if (isLoading) return <div className="p-8 text-center">Loading schedule...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS.map(day => (
            <div key={day} className="bg-card border rounded-lg overflow-hidden flex flex-col h-full min-h-[300px]">
                <div className="bg-muted p-3 border-b font-bold text-center text-sm">
                    {day.substring(0, 3)}
                </div>
                <div className="p-2 space-y-2 flex-1">
                    {scheduleMatrix[day].sort((a,b) => a.start_time.localeCompare(b.start_time)).map(shift => (
                        <div key={shift.id} className="bg-white dark:bg-slate-900 border rounded p-2 text-xs relative group hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <UserAvatar src={shift.memberImage} name={shift.memberName || '?'} className="w-5 h-5 text-[8px]" />
                                <span className="font-medium truncate">{shift.memberName || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {shift.start_time} - {shift.end_time}
                            </div>
                            
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteShiftMutation.mutate(shift.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                    {scheduleMatrix[day].length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-4 opacity-50">
                            No shifts
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
