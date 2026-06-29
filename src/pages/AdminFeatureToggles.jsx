import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ToggleLeft, Zap, Shield, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import {
  FEATURE_MODULES,
  isFeatureEnabled,
  isFeatureEnvLocked,
} from '@/lib/featureRegistry';
import { setFeatureFlagOverrides } from '@/lib/featureFlagOverrides';

function buildModuleRows() {
  return Object.values(FEATURE_MODULES).map((mod) => ({
    id: mod.id,
    label: mod.label,
    description: mod.description,
    alwaysOn: !!mod.alwaysOn,
    envKey: mod.envKey ?? null,
    pageCount: mod.pages.length,
    enabled: isFeatureEnabled(mod.id),
    envLocked: isFeatureEnvLocked(mod.id),
  }));
}

export default function AdminFeatureToggles() {
  const queryClient = useQueryClient();
  const [, bump] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: () => sovereign.featureFlags.adminList(),
  });

  useEffect(() => {
    if (data?.modules) {
      const map = {};
      for (const mod of data.modules) {
        map[mod.id] = mod.enabled !== false;
      }
      map.core = true;
      map.admin = true;
      setFeatureFlagOverrides(map);
      bump((n) => n + 1);
    }
  }, [data]);

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }) => sovereign.featureFlags.adminSet(key, enabled),
    onSuccess: (result) => {
      if (result?.flags) setFeatureFlagOverrides(result.flags);
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      toast.success('Feature module updated');
      bump((n) => n + 1);
    },
    onError: (e) => toast.error(e.message || 'Update failed'),
  });

  const modules = buildModuleRows();
  const enabledCount = modules.filter((m) => m.enabled).length;
  const optionalModules = modules.filter((m) => !m.alwaysOn);

  const handleToggle = (mod, checked) => {
    if (mod.alwaysOn || mod.envLocked) return;
    toggleMutation.mutate({ key: mod.id, enabled: checked });
  };

  return (
    <div className="min-h-screen py-12 bg-background font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Feature modules</h1>
          <p className="text-lg text-muted-foreground">
            Toggle optional product modules at runtime. Build-time{' '}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">VITE_FEATURE_*=false</code> still wins when set.
          </p>
        </motion.div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Changes apply immediately for signed-in users after refresh. Env-locked modules (disabled at build) cannot be re-enabled here.
            </p>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading flags…
          </div>
        )}
        {isError && (
          <Card className="mb-8 border-destructive/30">
            <CardContent className="p-4 text-sm text-destructive">
              Failed to load flags from the server.{' '}
              <button type="button" className="underline" onClick={() => refetch()}>Retry</button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Modules enabled', value: enabledCount, icon: Zap, color: 'text-emerald-600' },
            { label: 'Optional modules', value: optionalModules.length, icon: Shield, color: 'text-muted-foreground' },
            { label: 'Total modules', value: modules.length, icon: ToggleLeft, color: 'text-blue-600' },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <stat.icon className={`w-10 h-10 ${stat.color} mb-3`} />
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-4xl font-display font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <motion.div key={mod.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mod.enabled ? 'bg-emerald-100' : 'bg-muted'}`}>
                        <ToggleLeft className={`w-6 h-6 ${mod.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground text-lg">{mod.label}</h3>
                          {mod.alwaysOn && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">Always on</Badge>
                          )}
                          {mod.envLocked && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-0">Env locked off</Badge>
                          )}
                          <Badge variant="secondary">{mod.pageCount} pages</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                        {mod.envKey && (
                          <p className="text-xs text-muted-foreground mt-2 font-mono">{mod.envKey}=false</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <Badge variant="secondary" className={mod.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}>
                        {mod.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch
                        checked={mod.enabled}
                        disabled={mod.alwaysOn || mod.envLocked || toggleMutation.isPending}
                        onCheckedChange={(checked) => handleToggle(mod, checked)}
                        aria-label={`Toggle ${mod.label}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
