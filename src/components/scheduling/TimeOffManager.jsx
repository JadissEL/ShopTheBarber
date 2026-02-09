import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, CalendarOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TimeOffManager({ shopId, staffMembers }) {
  const queryClient = useQueryClient();
  const [newTimeOff, setNewTimeOff] = React.useState({
      shop_member_id: '',
      start_date: '',
      end_date: '',
      reason: 'vacation'
  });

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['time-blocks', shopId],
    queryFn: async () => {
        // Fetch all time blocks for barbers in this shop
        // In a real app we might filter by date range, here we fetch all for simplicity
        const barberIds = staffMembers.map(m => m.barber_id).filter(Boolean);
        if (barberIds.length === 0) return [];
        
        // This is a simplified fetch. Ideally we'd filter by barber_ids list
        // Since we can't do "in" query easily in this mock, we might need to fetch individually or fetch all and filter
        const allBlocks = await sovereign.entities.TimeBlock.list('-start_datetime', 50);
        return allBlocks.filter(b => barberIds.includes(b.barber_id));
    },
    enabled: staffMembers.length > 0
  });

  const createTimeOffMutation = useMutation({
      mutationFn: async (data) => {
          const member = staffMembers.find(m => m.id === data.shop_member_id);
          if (!member) throw new Error("Staff member not found");
          
          return sovereign.entities.TimeBlock.create({
              barber_id: member.barber_id,
              shop_id: shopId,
              start_datetime: new Date(data.start_date).toISOString(),
              end_datetime: new Date(data.end_date).toISOString(),
              reason: data.reason,
              is_paid_leave: false
          });
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['time-blocks']);
          toast.success("Time off added");
          setNewTimeOff({ ...newTimeOff, start_date: '', end_date: '' });
      },
      onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
      mutationFn: (id) => sovereign.entities.TimeBlock.delete(id),
      onSuccess: () => {
          queryClient.invalidateQueries(['time-blocks']);
          toast.success("Time off removed");
      }
  });

  const handleAdd = () => {
      if (!newTimeOff.shop_member_id || !newTimeOff.start_date || !newTimeOff.end_date) {
          toast.error("Please fill all fields");
          return;
      }
      createTimeOffMutation.mutate(newTimeOff);
  };

  return (
    <div className="space-y-6">
       <div className="bg-card border rounded-lg p-4 space-y-4">
           <h3 className="font-semibold flex items-center gap-2">
               <CalendarOff className="w-4 h-4" /> Add Time Off / Blocked Time
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Select 
                 value={newTimeOff.shop_member_id} 
                 onValueChange={(v) => setNewTimeOff({...newTimeOff, shop_member_id: v})}
               >
                   <SelectTrigger>
                       <SelectValue placeholder="Select Staff" />
                   </SelectTrigger>
                   <SelectContent>
                       {staffMembers.map(m => (
                           <SelectItem key={m.id} value={m.id}>{m.barber?.name}</SelectItem>
                       ))}
                   </SelectContent>
               </Select>
               
               <Input 
                 type="datetime-local" 
                 value={newTimeOff.start_date}
                 onChange={e => setNewTimeOff({...newTimeOff, start_date: e.target.value})}
               />
               <Input 
                 type="datetime-local" 
                 value={newTimeOff.end_date}
                 onChange={e => setNewTimeOff({...newTimeOff, end_date: e.target.value})}
               />

               <Select 
                 value={newTimeOff.reason} 
                 onValueChange={(v) => setNewTimeOff({...newTimeOff, reason: v})}
               >
                   <SelectTrigger>
                       <SelectValue placeholder="Reason" />
                   </SelectTrigger>
                   <SelectContent>
                       <SelectItem value="vacation">Vacation</SelectItem>
                       <SelectItem value="sick">Sick Leave</SelectItem>
                       <SelectItem value="personal">Personal</SelectItem>
                       <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
               </Select>
           </div>
           <Button onClick={handleAdd} disabled={createTimeOffMutation.isPending}>
               {createTimeOffMutation.isPending ? 'Blocking...' : 'Block Time'}
           </Button>
       </div>

       <div className="border rounded-lg overflow-hidden">
           <Table>
               <TableHeader>
                   <TableRow>
                       <TableHead>Staff</TableHead>
                       <TableHead>Start</TableHead>
                       <TableHead>End</TableHead>
                       <TableHead>Reason</TableHead>
                       <TableHead className="text-right">Action</TableHead>
                   </TableRow>
               </TableHeader>
               <TableBody>
                   {timeBlocks.length === 0 ? (
                       <TableRow>
                           <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                               No time off records found.
                           </TableCell>
                       </TableRow>
                   ) : (
                       timeBlocks.map(block => {
                           const member = staffMembers.find(m => m.barber_id === block.barber_id);
                           return (
                               <TableRow key={block.id}>
                                   <TableCell className="font-medium">{member?.barber?.name || 'Unknown'}</TableCell>
                                   <TableCell>{format(new Date(block.start_datetime), 'PP p')}</TableCell>
                                   <TableCell>{format(new Date(block.end_datetime), 'PP p')}</TableCell>
                                   <TableCell className="capitalize">{block.reason}</TableCell>
                                   <TableCell className="text-right">
                                       <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(block.id)}>
                                           <Trash2 className="w-4 h-4" />
                                       </Button>
                                   </TableCell>
                               </TableRow>
                           );
                       })
                   )}
               </TableBody>
           </Table>
       </div>
    </div>
  );
}
