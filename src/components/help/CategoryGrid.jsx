import CategoryCard from '@/components/help/CategoryCard';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function CategoryGrid({ categories, title = 'Browse by topic' }) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="help-categories-heading">
      <h2 id="help-categories-heading" className={cn(stb.uiHeading, 'text-xl mb-6')}>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
