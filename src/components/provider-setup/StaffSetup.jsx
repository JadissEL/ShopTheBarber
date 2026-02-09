import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffSetup({ shopId, onNext, onBack }) {
  const queryClient = useQueryClient();
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('barber');

  // Fetch current staff
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['shop-staff', shopId],
    queryFn: async () => {
        if (!shopId) return [];
        const members = await sovereign.entities.ShopMember.filter({ shop_id: shopId });
        const enriched = await Promise.all(members.map(async (member) => {
            const barber = await sovereign.entities.Barber.get(member.barber_id).catch(() => null);
            return { ...member, barber };
        }));
        return enriched;
    },
    enabled: !!shopId
  });

  const addStaffMutation = useMutation({
    mutationFn: async () => {
        // 1. Create a Barber profile for the new staff member
        const barber = await sovereign.entities.Barber.create({
            name: newStaffName,
            title: newStaffRole === 'manager' ? 'Shop Manager' : 'Barber',
            image_url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop', // Placeholder
            is_independent: false
        });

        // 2. Link to Shop
        await sovereign.entities.ShopMember.create({
            shop_id: shopId,
            barber_id: barber.id,
            role: newStaffRole,
            status: 'active', // Auto-active for setup wizard simplicity
            booking_enabled: true
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['shop-staff'] });
        setNewStaffName('');
        setNewStaffRole('barber');
        toast.success("Staff member added");
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id) => sovereign.entities.ShopMember.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['shop-staff'] });
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    addStaffMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Meet the Team</h2>
        <p className="text-gray-400">Add your staff members so they can be booked.</p>
      </div>

      <div className="bg-[#1A1D24] p-6 rounded-xl border border-white/10 mb-6">
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <Input 
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Alex Smith"
                      className="bg-slate-950 border-white/10 text-white"
                  />
              </div>
              <div className="w-32 space-y-2">
                  <label className="text-sm font-medium text-gray-300">Role</label>
                  <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                      <SelectTrigger className="bg-slate-950 border-white/10 text-white">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="barber">Barber</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="apprentice">Apprentice</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <Button type="submit" disabled={!newStaffName || addStaffMutation.isPending} className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
          </form>
      </div>

      <div className="space-y-3">
          {staffMembers.map(member => (
              <div key={member.id} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <UserAvatar src={member.barber?.image_url} name={member.barber?.name || 'Staff'} className="w-10 h-10" />
                      <div>
                          <h3 className="font-bold text-white">{member.barber?.name}</h3>
                          <div className="text-xs text-emerald-400 capitalize">{member.role}</div>
                      </div>
                  </div>
                  {member.role !== 'owner' && (
                      <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                          <Trash2 className="w-4 h-4" />
                      </Button>
                  )}
                  {member.role === 'owner' && (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Owner</span>
                  )}
              </div>
          ))}
      </div>

      <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
              Back
          </Button>
          <Button onClick={onNext} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
              Continue
          </Button>
      </div>
    </div>
  );
}
