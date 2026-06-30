import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="border-b border-foreground/10 last:border-b-0">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-5 text-left group">
          <span className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors duration-150">
            {item.question}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden">
          <p className="pb-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">{item.answer}</p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function FAQAccordion({ items, title = 'Popular questions' }) {
  const [openId, setOpenId] = useState(items[0]?.id ?? null);

  if (items.length === 0) {
    return (
      <section className="text-center py-12 text-muted-foreground text-sm">
        No articles match your search. Try different keywords or contact support.
      </section>
    );
  }

  return (
    <section aria-labelledby="help-faq-heading">
      <h2 id="help-faq-heading" className={cn(stb.uiHeading, 'text-xl mb-2')}>
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">Quick answers to common questions.</p>
      <div className={cn(stb.surface, 'border-foreground/10 px-4 md:px-6')}>
        {items.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={(open) => setOpenId(open ? item.id : null)}
          />
        ))}
      </div>
    </section>
  );
}
