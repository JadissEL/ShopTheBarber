import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { createPageUrl } from '@/utils';

/** Legacy route — redirects to unified account type selection. */
export default function SelectProviderType() {
  const navigate = useNavigate();

  useEffect(() => {
    const search = window.location.search || '';
    navigate(`${createPageUrl('ChooseAccountType')}${search}`, { replace: true });
  }, [navigate]);

  return (
    <>
      <MetaTags title="Choose account type" description="Select your ShopTheBarber account type." />
    </>
  );
}
