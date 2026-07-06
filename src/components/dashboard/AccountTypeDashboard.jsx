import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { stb } from '@/lib/stbUi';

export default function AccountTypeDashboard({
  label,
  title,
  subtitle,
  quickLinks = [],
}) {
  return (
    <div className={stb.page}>
      <MetaTags title={title} description={subtitle} />
      <PageHeader label={label} title={title} subtitle={subtitle} compact variant="light" tier="app" />
      <PageContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Button key={item.page} asChild variant="outline" className="h-auto py-4 justify-start">
              <Link to={createPageUrl(item.page)}>
                <span className="font-semibold">{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </PageContent>
    </div>
  );
}
