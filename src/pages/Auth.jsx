import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from '@/components/ui/page-loading';
import { createPageUrl } from '@/utils';

/**
 * Legacy auth entry, redirects to SignIn.
 * Kept for any existing links or bookmarks pointing to /Auth.
 */
export default function Auth() {
  const navigate = useNavigate();
  useEffect(() => {
    const search = window.location.search;
    navigate(`${createPageUrl('SignIn')}${search}`, { replace: true });
  }, [navigate]);
  return <PageLoading message="Redirecting…" />;
}
