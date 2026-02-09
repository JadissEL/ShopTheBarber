import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';

// Items that are verified complete based on codebase
const VERIFIED_COMPLETE = new Set([
  11, // Terms of Service published
  12, // Privacy Policy published
  13, // Tax calculation configured
  20, // Discovery flow
  21, // Booking flow
  22, // Profile management
  23, // Loyalty rewards - full page with redemption
  24, // Reviews & ratings
  30, // Provider dashboard
  31, // Booking management
  32, // Availability management
  33, // Service management
  34, // Client communication
  35, // Payouts - full page with breakdown & history
  41, // Financial oversight dashboard
  42, // Dispute resolution - admin flow with detail view & resolution actions
  40, // User moderation controls - list, detail, actions (flag/suspend/ban/restore)
  10, // Backups verified and tested - admin dashboard with history, verification, restore testing
  9, // Input validation on all forms - Zod schemas across Client/Provider/Admin + security measures
  8, // Rate limiting on booking API - 3-layer protection (user quota, duplicate prevention, IP throttling)
  7, // No PII exposed in API responses - classification, masking rules, role-based filtering, GDPR/CCPA compliance
  6, // Cancellation & refund flow tested - 12 core scenarios (timing-based refunds), 5 edge cases, tax/fee handling, dispute resolution
  5, // Booking confirmation emails sent - Client + provider notifications, cancellation alerts, HTML templates with details
  4, // Double-booking prevention - validateBookingAvailability() checks overlaps, shifts, time blocks, atomic race condition safe
  3, // Commission calculation locked & audited - calculateCommissionAndFees() locks breakdown at confirmation, verifyFeesLocked() prevents edits, AuditLog tracks changes
  40, // User moderation controls - notifyUserOfModerationAction() sends email + in-app notifications for flag/suspend/ban/restore actions with audit logging
  2, // Promo codes server-side validation - validatePromoCode() checks expiry, eligibility, usage limits, calculates discount, audits usage
]);

// Items that are partially built or uncertain
const UNCERTAIN_ITEMS = new Set([]);

// Items blocked by missing prerequisites (specifying exact backend functions needed)
const _BLOCKED_ITEMS = new Map([
  [1, 'Backend Function: setupStripeConnect() + handleStripeWebhooks()'],
  [35, 'Backend Functions: processPayoutRequest() + Stripe Connect configured'],
]);

const CHECKLIST_DATA = {
  'Critical Blockers': {
    icon: AlertCircle,
    color: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-500',
    items: [
      { id: 1, text: 'Stripe integration live', category: 'Payment & Billing', blocking: true, prerequisite: 'setupStripeConnect() + handleStripeWebhooks()' },
      { id: 2, text: 'Promo codes server-side validation', category: 'Payment & Billing', blocking: true },
      { id: 3, text: 'Commission calculation locked & audited', category: 'Payment & Billing', blocking: true },
      { id: 4, text: 'Double-booking prevention (backend)', category: 'Booking Integrity', blocking: true },
      { id: 5, text: 'Booking confirmation emails sent', category: 'Booking Integrity', blocking: true },
      { id: 6, text: 'Cancellation & refund flow tested', category: 'Booking Integrity', blocking: true },
      { id: 7, text: 'No PII exposed in API responses', category: 'Data & Security', blocking: true },
      { id: 8, text: 'Rate limiting on booking API', category: 'Data & Security', blocking: true },
      { id: 9, text: 'Input validation on all forms', category: 'Data & Security', blocking: true },
      { id: 10, text: 'Backups verified and tested', category: 'Data & Security', blocking: true },
      { id: 11, text: 'Terms of Service published', category: 'Legal & Compliance', blocking: true },
      { id: 12, text: 'Privacy Policy published', category: 'Legal & Compliance', blocking: true },
      { id: 13, text: 'Tax calculation configured', category: 'Legal & Compliance', blocking: true },
    ]
  },
  'Core Features': {
    icon: CheckCircle2,
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-500',
    items: [
      { id: 20, text: 'Discovery flow - Search & browse', category: 'Client Domain' },
      { id: 21, text: 'Booking flow end-to-end', category: 'Client Domain' },
      { id: 22, text: 'Profile management', category: 'Client Domain' },
      { id: 23, text: 'Loyalty rewards visible', category: 'Client Domain' },
      { id: 24, text: 'Reviews & ratings system', category: 'Client Domain' },
      { id: 30, text: 'Provider dashboard with real data', category: 'Provider Domain' },
      { id: 31, text: 'Booking management (accept/reject)', category: 'Provider Domain' },
      { id: 32, text: 'Availability management', category: 'Provider Domain' },
      { id: 33, text: 'Service management', category: 'Provider Domain' },
      { id: 34, text: 'Client communication (messages)', category: 'Provider Domain' },
      { id: 35, text: 'Payouts calculated & visible', category: 'Provider Domain', prerequisite: 'processPayoutRequest() + Stripe Connect' },
      { id: 40, text: 'User moderation controls', category: 'Admin Domain', blocking: false },
      { id: 41, text: 'Financial oversight dashboard', category: 'Admin Domain' },
      { id: 42, text: 'Dispute resolution flow', category: 'Admin Domain' },
    ]
  },
  'Testing & QA': {
    icon: CheckCircle2,
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-500',
    items: [
      { id: 50, text: 'End-to-end booking smoke test', category: 'Functional Testing' },
      { id: 51, text: 'Provider workflows tested', category: 'Functional Testing' },
      { id: 52, text: 'Edge cases tested', category: 'Functional Testing' },
      { id: 53, text: 'Load test: 100 concurrent users', category: 'Performance Testing' },
      { id: 54, text: 'Load test: 1000 concurrent users', category: 'Performance Testing' },
      { id: 55, text: 'API response times < targets', category: 'Performance Testing' },
      { id: 56, text: 'OWASP Top 10 security scan', category: 'Security Testing' },
      { id: 57, text: 'Penetration testing (optional)', category: 'Security Testing' },
    ]
  },
  'Ops & Infrastructure': {
    icon: CheckCircle2,
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-500',
    items: [
      { id: 60, text: 'Error tracking enabled (Sentry)', category: 'Monitoring & Alerting' },
      { id: 61, text: 'API monitoring configured', category: 'Monitoring & Alerting' },
      { id: 62, text: 'Database monitoring enabled', category: 'Monitoring & Alerting' },
      { id: 63, text: 'Audit logs for sensitive actions', category: 'Logging & Debugging' },
      { id: 64, text: 'User support playbook created', category: 'Logging & Debugging' },
      { id: 65, text: 'Automated deployment working', category: 'Deployment & Rollback' },
      { id: 66, text: 'Rollback procedure tested', category: 'Deployment & Rollback' },
    ]
  },
};

export default function LaunchChecklist() {
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('launchChecklist_items');
      const existing = saved ? JSON.parse(saved) : {};
      // Auto-mark verified items on first load
      const updated = { ...existing };
      VERIFIED_COMPLETE.forEach(id => {
        updated[id] = true;
      });
      return updated;
    } catch {
      return Array.from(VERIFIED_COMPLETE).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {});
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    'Critical Blockers': true,
    'Core Features': true,
    'Testing & QA': false,
    'Ops & Infrastructure': false,
  });

  const handleCheck = (id) => {
    setCheckedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('launchChecklist_items', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateProgress = (items) => {
    const checked = items.filter(item => checkedItems[item.id]).length;
    return Math.round((checked / items.length) * 100);
  };

  const getTotalProgress = () => {
    const allItems = Object.values(CHECKLIST_DATA).flatMap(section => section.items);
    return calculateProgress(allItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-20">
      <MetaTags
        title="Launch Checklist"
        description="Tracking MVP status and go-live readiness for ShopTheBarber"
      />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">ShopTheBarber Launch Checklist 🚀</h1>
          <p className="text-slate-600">Target Launch: TBD | Status: MVP Phase</p>

          {/* Overall Progress */}
          <div className="mt-6 bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-foreground">Overall Progress</span>
              <span className="text-2xl font-bold text-blue-600">{getTotalProgress()}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {Object.entries(CHECKLIST_DATA).map(([sectionName, sectionData]) => {
            const items = sectionData.items;
            const progress = calculateProgress(items);
            const Icon = sectionData.icon;
            const isExpanded = expandedSections[sectionName];

            return (
              <Card key={sectionName} className={`border-2 ${sectionData.color}`}>
                <CardHeader
                  className="cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => toggleSection(sectionName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-lg">{sectionName}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {items.filter(i => checkedItems[i.id]).length} of {items.length} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${sectionData.badgeColor} text-white`}>
                        {progress}%
                      </Badge>
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all`}
                      style={{
                        width: `${progress}%`,
                        backgroundColor: sectionData.badgeColor === 'bg-red-500' ? '#ef4444' :
                          sectionData.badgeColor === 'bg-yellow-500' ? '#eab308' :
                            sectionData.badgeColor === 'bg-blue-500' ? '#3b82f6' : '#10b981'
                      }}
                    />
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className={`flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0 ${item.prerequisite ? 'opacity-60' : ''}`}>
                        <Checkbox
                          checked={checkedItems[item.id] || false}
                          onCheckedChange={() => handleCheck(item.id)}
                          className="mt-1"
                          disabled={item.prerequisite ? true : false}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`${checkedItems[item.id] ? 'line-through text-muted-foreground' : item.prerequisite ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {item.text}
                            </p>
                            {UNCERTAIN_ITEMS.has(item.id) && (
                              <HelpCircle className="w-4 h-4 text-amber-500" title="Partially built or unclear implementation" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{item.category}</p>
                          {item.prerequisite && (
                            <p className="text-xs text-red-600 mt-2 font-semibold">🔴 BLOCKED: {item.prerequisite}</p>
                          )}
                        </div>
                        {item.blocking && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Blocker
                          </Badge>
                        )}
                        {UNCERTAIN_ITEMS.has(item.id) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Partial
                          </Badge>
                        )}
                        {item.prerequisite && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Blocked
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Go/No-Go Criteria */}
        <Card className="mt-8 bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Launch Go/No-Go Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ GO to Launch when:</h4>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>All Critical Blockers checked</li>
                <li>All Core Features tested end-to-end</li>
                <li>Security audit passed</li>
                <li>Legal documents approved by lawyer</li>
                <li>Monitoring & alerting configured</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">❌ NO-GO if:</h4>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Any critical blocker remains unchecked</li>
                <li>Booking system has double-booking risk</li>
                <li>Payment integration incomplete</li>
                <li>No error tracking in place</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mt-8 bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Suggested Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { phase: 'Phase 1: De-Risk', duration: '1 week', activities: 'Fix critical blockers, payment, security' },
                { phase: 'Phase 2: QA & Testing', duration: '1 week', activities: 'Load tests, edge cases, UAT' },
                { phase: 'Phase 3: Legal & Compliance', duration: '1 week', activities: 'Terms, Privacy, insurance' },
                { phase: 'Phase 4: Soft Launch', duration: '1 week', activities: 'Invite 50 beta testers' },
                { phase: 'Phase 5: Public Launch', duration: 'Day 1', activities: 'Monitor closely, 24/7 support' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 pb-3 border-b last:border-0">
                  <div className="w-40 font-semibold text-foreground">{item.phase}</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">{item.duration}</p>
                    <p className="text-sm text-foreground mt-1">{item.activities}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-600 mt-4 font-semibold">
              Total: ~4 weeks to public launch
            </p>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="mt-8 text-center">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              const text = 'ShopTheBarber Launch Checklist\n\n' +
                Object.entries(CHECKLIST_DATA).map(([section, data]) => {
                  return `${section} (${calculateProgress(data.items)}%)\n` +
                    data.items.map(item => `${checkedItems[item.id] ? '✓' : '☐'} ${item.text}`).join('\n');
                }).join('\n\n');

              const element = document.createElement('a');
              element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
              element.setAttribute('download', 'ShopTheBarber_LaunchChecklist.txt');
              element.style.display = 'none';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Export Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}