import CategoryCard from '@/components/help/CategoryCard';

export default function CategoryGrid({ categories, title = 'Browse by topic' }) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="help-categories-heading">
      <h2 id="help-categories-heading" className="text-xl font-semibold text-foreground mb-6 tracking-tight">
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
