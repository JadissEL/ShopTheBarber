import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function resolveHref(item) {
  if (item.external) return item.href;
  if (item.externalPath) return item.href;
  const base = createPageUrl(item.href);
  if (item.hrefQuery) return `${base}?${item.hrefQuery}`;
  return base;
}

export default function CategoryCard({ category }) {
  const Icon = category.icon;
  const href = resolveHref(category);

  const className = cn(
    'group flex flex-col h-full p-6 rounded-xl border border-border bg-card',
    'transition-all duration-200 hover:border-foreground/15 hover:shadow-md hover:-translate-y-0.5',
    'focus-within:ring-2 focus-within:ring-primary/20'
  );

  const content = (
    <>
      <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground mb-4 group-hover:border-primary/30 transition-colors duration-200">
        <Icon className="w-5 h-5 stroke-[1.5]" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
        {category.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{category.description}</p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Browse
        <ChevronRight className="w-4 h-4" aria-hidden />
      </span>
    </>
  );

  if (category.href.startsWith('http') || category.href.startsWith('mailto:')) {
    return (
      <a href={category.href} className={className}>
        {content}
      </a>
    );
  }

  if (category.externalPath) {
    return (
      <Link to={category.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}
