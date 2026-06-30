import PageHeader from '@/components/layout/PageHeader';
import SearchField from '@/components/ui/search-field';

export default function HelpHero({ searchQuery, onSearchChange }) {
  return (
    <PageHeader
      variant="light"
      tier="app"
      title="How can we help?"
      subtitle="Find answers, troubleshoot issues, or contact our support team."
      compact
      className="border-foreground/10"
    >
      <SearchField
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search help articles…"
        aria-label="Search help center"
        size="lg"
        className="w-full max-w-xl"
      />
    </PageHeader>
  );
}
