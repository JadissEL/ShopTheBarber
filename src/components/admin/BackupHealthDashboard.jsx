import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, AlertCircle, XCircle, RefreshCw, 
  Shield, Clock, Database, AlertTriangle, Info
} from 'lucide-react';
import { format } from 'date-fns';

export default function BackupHealthDashboard() {
  const [_lastVerificationTime, setLastVerificationTime] = useState(null);

  // Fetch backup verification status
  const { data: backupStatus, isLoading, refetch } = useQuery({
    queryKey: ['backup-status'],
    queryFn: async () => {
      try {
        const result = await sovereign.integrations.Core.InvokeLLM({
          prompt: 'Call verifyBackupIntegrity function to check database backup health',
          // Note: In production, this would be a direct backend call
          // For now, using LLM as a workaround to execute backend function
        });
        return result;
      } catch (error) {
        return {
          status: 'UNKNOWN',
          verified_at: new Date().toISOString(),
          error: error.message,
          checks: []
        };
      }
    },
    refetchInterval: 3600000 // Refetch every hour
  });

  // Fetch recovery guide
  const { data: recoveryGuide } = useQuery({
    queryKey: ['backup-recovery-guide'],
    queryFn: async () => {
      // In production, fetch from backend
      return {
        backup_strategy: {
          frequency: 'Automated daily backups at 2:00 AM UTC',
          retention: '30-day rolling window',
          location: 'Geographically distributed cloud storage (encrypted)',
          redundancy: '3x replication across availability zones'
        },
        recovery_procedures: {
          minor_data_loss: { rto: '1 hour', rpo: '1 hour' },
          full_system_failure: { rto: '4 hours', rpo: '1 hour' },
          ransomware_incident: { rto: '6 hours', rpo: '1 day' }
        }
      };
    }
  });

  const manualVerifyMutation = useMutation({
    mutationFn: () => refetch(),
    onSuccess: () => {
      setLastVerificationTime(new Date());
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-50 border-green-200';
      case 'WARNING': return 'bg-yellow-50 border-yellow-200';
      case 'FAILED': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'FAILED': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getCheckStatusBadge = (checkStatus) => {
    switch (checkStatus) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Pass</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Warning</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case 'SKIPPED':
        return <Badge variant="outline">Skipped</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Backup & Recovery
          </h1>
          <p className="text-muted-foreground mt-1">Database backup verification and disaster recovery procedures</p>
        </div>
        <Button 
          onClick={() => manualVerifyMutation.mutate()}
          disabled={manualVerifyMutation.isPending || isLoading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Verify Now
        </Button>
      </div>

      {/* Overall Status */}
      {backupStatus && (
        <Card className={`border-2 ${getStatusColor(backupStatus.status)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(backupStatus.status)}
                <div>
                  <CardTitle className="text-2xl">{backupStatus.status}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verified {format(new Date(backupStatus.verified_at), 'PPP p')}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{backupStatus.backup_age_hours ? `${backupStatus.backup_age_hours} hours` : 'Unknown'}</p>
                <p className="text-muted-foreground">Since last backup</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Backup Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Daily</p>
            <p className="text-xs text-muted-foreground mt-1">2:00 AM UTC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">30 days</p>
            <p className="text-xs text-muted-foreground mt-1">Rolling window</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              RTO / RPO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1h / 1h</p>
            <p className="text-xs text-muted-foreground mt-1">Recovery target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Redundancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3x</p>
            <p className="text-xs text-muted-foreground mt-1">Across zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Checks */}
      {backupStatus?.checks && backupStatus.checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Checks</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Results from latest backup integrity verification</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backupStatus.checks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-1">
                    {check.status === 'PASS' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {check.status === 'WARNING' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {check.status === 'FAIL' && <XCircle className="w-5 h-5 text-red-600" />}
                    {check.status === 'SKIPPED' && <Info className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{check.name}</h4>
                      {getCheckStatusBadge(check.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{check.message || check.details?.[0]?.status}</p>
                    {check.entities_verified && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Verified {check.entities_verified}/{check.details?.length || 0} entities
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery Procedures */}
      <Card>
        <CardHeader>
          <CardTitle>Disaster Recovery Procedures</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Guidelines for various failure scenarios</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recoveryGuide?.recovery_procedures && Object.entries(recoveryGuide.recovery_procedures).map(([scenario, details]) => (
              <div key={scenario} className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold capitalize">{scenario.replace(/_/g, ' ')}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recovery Time Objective (RTO)</p>
                    <p className="font-bold text-primary">{details.rto}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recovery Point Objective (RPO)</p>
                    <p className="font-bold text-primary">{details.rpo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly</span>
              <span className="font-semibold">Backup Integrity Verification</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Quarterly</span>
              <span className="font-semibold">Test Restore to Staging</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Annually</span>
              <span className="font-semibold">Full Disaster Recovery Drill</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Emergency Support</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          For backup-related emergencies, contact sovereign support immediately:<br />
          <strong>backup-emergency@sovereign.io</strong>
        </CardContent>
      </Card>
    </div>
  );
}
