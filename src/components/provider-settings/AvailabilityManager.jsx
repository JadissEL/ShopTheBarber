import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import WeeklySchedule from '@/components/scheduling/WeeklySchedule';
import ShiftForm from '@/components/scheduling/ShiftForm';
import TimeOffManager from '@/components/scheduling/TimeOffManager';
import ShopHoursEditor from '@/components/scheduling/ShopHoursEditor';
import { Plus } from 'lucide-react';

export default function AvailabilityManager({ barber, shopId }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Find shops barber manages
  const { data: managedShops = [] } = useQuery({
    queryKey: ['managed-shops', barber?.id],
    queryFn: async () => {
      if (!barber) return [];
      const members = await sovereign.entities.ShopMember.filter({ barber_id: barber.id });
      const managers = members.filter(m => ['owner', 'manager'].includes(m.role));
      const shops = await Promise.all(managers.map(m => sovereign.entities.Shop.get(m.shop_id)));
      return shops;
    },
    enabled: !!barber
  });

  const [selectedShopId, setSelectedShopId] = useState(shopId || null);

  React.useEffect(() => {
    if (managedShops.length > 0 && !selectedShopId) setSelectedShopId(managedShops[0].id);
  }, [managedShops, selectedShopId]);

  const { data: shopStaff = [] } = useQuery({
    queryKey: ['shop-staff', selectedShopId],
    queryFn: async () => {
      if (!selectedShopId) return [];
      const members = await sovereign.entities.ShopMember.filter({ shop_id: selectedShopId });
      const enriched = await Promise.all(members.map(async (m) => {
        const b = await sovereign.entities.Barber.get(m.barber_id).catch(() => null);
        return { ...m, barber: b };
      }));
      return enriched;
    },
    enabled: !!selectedShopId
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Availability & Schedules</CardTitle>
            <CardDescription>Manage your working hours, shifts, and time off</CardDescription>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Shift
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader className="mb-6">
                <SheetTitle>Add Recurring Shift</SheetTitle>
              </SheetHeader>
              <ShiftForm 
                shopId={selectedShopId} 
                staffMembers={shopStaff}
                context={managedShops.length > 0 ? "shop" : "independent"}
                barberId={barber?.id}
                onSuccess={() => setIsSheetOpen(false)} 
              />
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={shopId ? "shop-hours" : (barber?.is_independent ? "independent" : "shop")}>
            <TabsList>
              {shopId && <TabsTrigger value="shop-hours">Shop Hours</TabsTrigger>}
              {barber?.is_independent && <TabsTrigger value="independent">My Schedule</TabsTrigger>}
              {managedShops.length > 0 && <TabsTrigger value="shop">Staff Roster</TabsTrigger>}
              <TabsTrigger value="timeoff">Time Off</TabsTrigger>
            </TabsList>

            {shopId && (
              <TabsContent value="shop-hours" className="space-y-4">
                <ShopHoursEditor shopId={shopId} />
              </TabsContent>
            )}

            {barber?.is_independent && (
              <TabsContent value="independent" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                  <strong>Note:</strong> These are your recurring weekly shifts. Use "Time Off" tab to block specific dates.
                </div>
                <WeeklySchedule context="independent" barberId={barber.id} />
              </TabsContent>
            )}

            {managedShops.length > 0 && (
              <TabsContent value="shop" className="space-y-4">
                {managedShops.length > 1 && (
                  <div className="flex gap-2">
                    {managedShops.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setSelectedShopId(s.id)}
                        className={`px-3 py-1 rounded-full text-sm ${selectedShopId === s.id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                  <strong>Note:</strong> Recurring shifts that repeat weekly. For holidays, use "Time Off" tab.
                </div>
                <WeeklySchedule shopId={selectedShopId} staffMembers={shopStaff} context="shop" />
              </TabsContent>
            )}

            <TabsContent value="timeoff" className="space-y-4">
              <TimeOffManager 
                shopId={selectedShopId} 
                staffMembers={shopStaff}
                barberId={barber?.id}
                context={managedShops.length > 0 ? "shop" : "independent"}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
