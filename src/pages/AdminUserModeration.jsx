import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { AlertCircle, Search, Shield, Ban, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import UserModerationCard from '@/components/moderation/UserModerationCard';

export default function AdminUserModeration() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => sovereign.entities.User.list('-created_date', 200),
    initialData: []
  });

  // Count moderation metrics
  const suspendedCount = users.filter(u => u.moderation_status === 'suspended').length;
  const bannedCount = users.filter(u => u.moderation_status === 'banned').length;
  const flaggedCount = users.filter(u => u.moderation_status === 'flagged').length;

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || (u.moderation_status || 'active') === filterStatus;
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Role check
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <MetaTags title="Access Denied" />
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold">Admin Access Required</p>
            <p className="text-muted-foreground text-sm mt-2">You must be an admin to access moderation controls.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags 
        title="User Moderation" 
        description="Manage and moderate platform users"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">User Moderation</h1>
          <p className="text-muted-foreground">Monitor and manage user accounts across the platform</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <h3 className="text-3xl font-bold">{suspendedCount}</h3>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Banned</p>
                  <h3 className="text-3xl font-bold">{bannedCount}</h3>
                </div>
                <Ban className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                  <h3 className="text-3xl font-bold">{flaggedCount}</h3>
                </div>
                <Shield className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <Link key={u.id} to={createPageUrl(`UserModerationDetail?id=${u.id}`)}>
                <UserModerationCard user={u} />
              </Link>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
