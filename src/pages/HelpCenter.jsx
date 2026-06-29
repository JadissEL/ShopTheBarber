import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { createPageUrl } from '@/utils';
import HelpHero from '@/components/help/HelpHero';
import HelpQuickActions from '@/components/help/HelpQuickActions';
import CategoryGrid from '@/components/help/CategoryGrid';
import FAQAccordion from '@/components/help/FAQAccordion';
import { filterHelpContent } from '@/components/help/helpCenterContent';
import { Button } from '@/components/ui/button';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, faqs } = useMemo(
    () => filterHelpContent(searchQuery),
    [searchQuery]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-card">
      <MetaTags
        title="Help Center"
        description="How can we help? Search guides for bookings, payments, account settings, and contact ShopTheBarber support."
      />

      <HelpHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-12 space-y-12 md:space-y-16">
        <HelpQuickActions />

        {isSearching && categories.length === 0 && faqs.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/50/50">
            <p className="text-foreground font-medium mb-2">No results for &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-sm text-muted-foreground mb-6">
              Try another keyword or reach out to our team directly.
            </p>
            <Button asChild className="rounded-lg">
              <Link to={`${createPageUrl('SupportChat')}?new=1`}>Contact support</Link>
            </Button>
          </div>
        ) : (
          <>
            <CategoryGrid
              categories={categories}
              title={isSearching ? 'Matching topics' : 'Browse by topic'}
            />
            <FAQAccordion items={faqs} />
          </>
        )}

        <section className="rounded-2xl border border-border bg-muted/50 px-6 py-10 md:py-12 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Still need help?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Our support team is available for bookings, payments, and account issues.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-lg">
              <Link to={`${createPageUrl('SupportChat')}?new=1`}>Start live chat</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg">
              <a href="mailto:support@shopthebarber.com">Email support</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
