import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useManagedShop } from '@/hooks/useManagedShop';
import { MetaTags } from '@/components/seo/MetaTags';
import { PageLoading } from '@/components/ui/page-loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import StaffServicePricingEditor from '@/components/provider/StaffServicePricingEditor';
import { UserPlus, Trash2, Calendar, BadgeCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const SKILL_PRESETS = ['Fades', 'Beard', 'Hot Towel', 'Color', 'Kids Cuts', 'Line Ups', 'Scissor Work', 'Braids'];

function SkillsEditor({ skills = [], onChange }) {
  const [input, setInput] = useState('');
  const add = (tag) => {
    const t = (tag || input).trim();
    if (!t || skills.includes(t)) return;
    onChange([...skills, t]);
    setInput('');
  };
  const remove = (tag) => onChange(skills.filter((s) => s !== tag));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {s}
            <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add specialty…"
          className=""
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <Button type="button" variant="outline" className="" onClick={() => add()}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {SKILL_PRESETS.filter((p) => !skills.includes(p)).map((p) => (
          <button
            key={p}
            type="button"
            className="text-[10px] px-2 py-1 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary"
            onClick={() => add(p)}
          >
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StaffRoster() {
  const queryClient = useQueryClient();
  const { shopId, shop, isManager, isLoading } = useManagedShop();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [pricingMember, setPricingMember] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'barber', title: '', skills: [] });

  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: ['shop-team', shopId],
    queryFn: () => sovereign.shop.getTeam(shopId),
    enabled: !!shopId && isManager,
  });

  const addMutation = useMutation({
    mutationFn: () => sovereign.shop.addMember(shopId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-team'] });
      setAddOpen(false);
      setForm({ name: '', role: 'barber', title: '', skills: [] });
      toast.success('Team member added');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => sovereign.shop.updateMember(shopId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-team'] });
      setEditMember(null);
      toast.success('Updated');
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => sovereign.shop.removeMember(shopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-team'] });
      toast.success('Removed from team');
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <PageLoading message="Loading team…" />;

  if (!isManager || !shopId) {
    return (
      <div className={stb.page}>
        <MetaTags title="Team" description="Manage your shop team" />
        <PageContent narrow className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Shop owner or manager access is required.</p>
          <Link to={createPageUrl('ProviderDashboard')} className="text-primary font-bold">Back to dashboard</Link>
        </PageContent>
      </div>
    );
  }

  return (
    <div className={stb.page + ' pb-24 lg:pb-8'}>
      <MetaTags title="Team Roster" description={`Manage barbers at ${shop?.name || 'your shop'}`} />

      <PageHeader
        label="Provider"
        title="Team roster"
        subtitle={`Manage barbers, skills, booking visibility, and pricing for ${shop?.name}.`}
        compact
        variant="light"
        tier="app"
      >
        <Button asChild variant="outline">
          <Link to={createPageUrl('StaffSchedule')}>
            <Calendar className="w-4 h-4 mr-2" /> Schedules
          </Link>
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add barber
        </Button>
      </PageHeader>

      <PageContent>
        <Link to={createPageUrl('ProviderDashboard')} className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          ← Dashboard
        </Link>

      {teamLoading ? (
        <PageLoading message="Loading roster…" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {team.map((member) => (
            <Card key={member.id} className=" border-border overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <UserAvatar src={member.barber?.image_url} name={member.barber?.name} className="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <h3 className={stb.uiSubheading + ' truncate'}>{member.barber?.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.barber?.title || member.role}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${member.status === 'active' ? 'stb-chip stb-chip-active' : 'bg-muted text-muted-foreground'}`}>
                        {member.status || 'active'}
                      </span>
                      {member.booking_enabled !== false && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> Bookable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(member.skills?.length > 0) && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.skills.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground/90 font-medium">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className=" font-bold"
                    onClick={() => {
                      setEditMember(member);
                      setForm({
                        name: member.barber?.name || '',
                        role: member.role || 'barber',
                        title: member.barber?.title || '',
                        skills: member.skills || [],
                        booking_enabled: member.booking_enabled !== false,
                        status: member.status || 'active',
                      });
                    }}
                  >
                    Edit profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className=" font-bold"
                    onClick={() => setPricingMember(member)}
                  >
                    Services & pricing
                  </Button>
                  {member.role !== 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className=" text-destructive border-destructive/30"
                      onClick={() => {
                        if (confirm(`Remove ${member.barber?.name} from the team?`)) {
                          removeMutation.mutate(member.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md ">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className=" mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className=" mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barber">Barber</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specialties</Label>
              <SkillsEditor skills={form.skills} onChange={(skills) => setForm((f) => ({ ...f, skills }))} />
            </div>
            <Button className="w-full rounded-lg font-bold" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name.trim()}>
              {addMutation.isPending ? 'Adding…' : 'Add to roster'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
        <DialogContent className="max-w-md  max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editMember?.barber?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className=" mt-1" />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className=" mt-1" placeholder="Senior Barber" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))} disabled={editMember?.role === 'owner'}>
                <SelectTrigger className=" mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="barber">Barber</SelectItem>
                  <SelectItem value="apprentice">Apprentice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Online booking</Label>
              <Switch checked={form.booking_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, booking_enabled: v }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className=" mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specialties</Label>
              <SkillsEditor skills={form.skills} onChange={(skills) => setForm((f) => ({ ...f, skills }))} />
            </div>
            <Button
              className="w-full rounded-lg font-bold"
              onClick={() => updateMutation.mutate({
                id: editMember.id,
                data: {
                  name: form.name,
                  title: form.title,
                  role: form.role,
                  skills: form.skills,
                  booking_enabled: form.booking_enabled,
                  status: form.status,
                },
              })}
              disabled={updateMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing panel dialog */}
      <Dialog open={!!pricingMember} onOpenChange={(o) => !o && setPricingMember(null)}>
        <DialogContent className="max-w-lg  max-h-[90vh] overflow-y-auto">
          {pricingMember && (
            <StaffServicePricingEditor
              shopId={shopId}
              memberId={pricingMember.id}
              memberName={pricingMember.barber?.name}
            />
          )}
        </DialogContent>
      </Dialog>
      </PageContent>
    </div>
  );
}
