import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Phone, Mail } from 'lucide-react';

export default function GuestContactForm({
  contact,
  onChange,
  signInReturnPath,
  error,
}) {
  const returnPath = signInReturnPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/BookingFlow');
  const signInUrl = `${createPageUrl('SignIn')}?return=${encodeURIComponent(returnPath)}`;

  return (
    <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200 p-6 mb-6 space-y-4">
      <div>
        <p className="font-semibold text-emerald-950">Book without an account</p>
        <p className="text-sm text-emerald-800/90 mt-1">
          Name + phone, that&apos;s it. Optional email for confirmation.
          {' '}
          <Link to={signInUrl} className="font-semibold underline underline-offset-2">
            Sign in
          </Link>
          {' '}
          for faster rebooking, promos, and online pay.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            Your name
          </label>
          <Input
            value={contact.guest_name}
            onChange={(e) => onChange({ ...contact, guest_name: e.target.value })}
            placeholder="First and last name"
            autoComplete="name"
            className="bg-card"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-700" />
            Mobile
          </label>
          <Input
            type="tel"
            value={contact.guest_phone}
            onChange={(e) => onChange({ ...contact, guest_phone: e.target.value })}
            placeholder="+33 6 12 34 56 78"
            autoComplete="tel"
            className="bg-card"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-700" />
            Email <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            type="email"
            value={contact.guest_email}
            onChange={(e) => onChange({ ...contact, guest_email: e.target.value })}
            placeholder="you@email.com"
            autoComplete="email"
            className="bg-card"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
