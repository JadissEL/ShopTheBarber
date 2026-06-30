import { HandleSSOCallback } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from '@/components/ui/page-loading';
import { createPageUrl } from '@/utils';

function getPostAuthDestination() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || params.get('return');
  if (redirect?.startsWith('/')) return redirect;
  return '/SetupGuide';
}

function goTo(navigate, destination) {
  if (!destination) return;
  if (destination.startsWith('http')) {
    window.location.href = destination;
    return;
  }
  navigate(destination, { replace: true });
}

/** Completes Google/OAuth sign-in and sends the user to the app (not back to SignIn). */
export default function SsoCallback() {
  const navigate = useNavigate();

  return (
    <>
      <PageLoading message="Completing sign in…" className="min-h-[50vh]" />
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => {
          goTo(navigate, decorateUrl(getPostAuthDestination()));
        }}
        navigateToSignIn={() => goTo(navigate, createPageUrl('SignIn'))}
        navigateToSignUp={() => goTo(navigate, createPageUrl('SignUp'))}
      />
    </>
  );
}
