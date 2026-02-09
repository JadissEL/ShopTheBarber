import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Legacy auth entry — redirects to SignIn.
 * Kept for any existing links or bookmarks pointing to /Auth.
 */
export default function Auth() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('SignIn'), { replace: true });
  }, [navigate]);
  return null;
}
