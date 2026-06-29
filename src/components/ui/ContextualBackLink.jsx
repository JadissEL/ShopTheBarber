import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

/**
 * Back link that routes to Dashboard when signed in, otherwise Home.
 */
export default function ContextualBackLink({ className, label }) {
  const { isAuthenticated } = useAuth();
  const to = isAuthenticated ? createPageUrl('Dashboard') : createPageUrl('Home');
  const text = label ?? (isAuthenticated ? 'Back to Dashboard' : 'Back to Home');

  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 text-primary hover:text-primary/80', className)}
    >
      <ArrowLeft className="w-4 h-4" /> {text}
    </Link>
  );
}
