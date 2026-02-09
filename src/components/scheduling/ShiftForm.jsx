import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';

const shiftSchema = z.object({
  shop_member_id: z.string().min(1, "Staff member is required"),
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format (24h)"),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format (24h)"),
});

export default function ShiftForm({ shopId, staffMembers, onSuccess, context = 'shop', barberId }) {
  const queryClient = useQueryClient();

  // Dynamic schema based on context
  const dynamicSchema = React.useMemo(() => {
      if (context === 'independent') {
          // Remove shop_member_id requirement for independent
          return z.object({
              day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
              start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format (24h)"),
              end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format (24h)"),
          });
      }
      return shiftSchema;
  }, [context]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      shop_member_id: '',
      day: 'Monday',
      start_time: '09:00',
      end_time: '17:00'
    }
  });

  const createShiftMutation = useMutation({
    mutationFn: (data) => {
       if (context === 'independent') {
           return sovereign.entities.Shift.create({
               ...data,
               shop_id: null,
               shop_member_id: null,
               barber_id: barberId,
               is_active: true
           });
       }

       // Shop Context
       const member = staffMembers.find(m => m.id === data.shop_member_id);
       return sovereign.entities.Shift.create({
           ...data,
           shop_id: shopId,
           barber_id: member?.barber_id,
           is_active: true
       });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success("Shift added successfully");
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
        toast.error("Failed to add shift: " + err.message);
    }
  });

  const onSubmit = (data) => {
    createShiftMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">Add Recurring Shift</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {context === 'shop' && (
                <FormField
                control={form.control}
                name="shop_member_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {staffMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                            {member.barber?.name || 'Unknown'}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time (24h)</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time (24h)</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Button type="submit" disabled={createShiftMutation.isPending} className="w-full">
          {createShiftMutation.isPending ? "Adding..." : "Add Shift"}
        </Button>
      </form>
    </Form>
  );
}
