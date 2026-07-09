import { TabsContent } from '@/components/ui/tabs';
import { TabPanelEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

/**
 * Tab panel wrapper: always renders visible content — either children or a standard empty state.
 * Use on any dashboard with Upcoming / History / Reviews (or similar) tabs.
 */
export function TabPanelContent({
  value,
  className,
  isEmpty = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  emptyOnAction,
  children,
}) {
  return (
    <TabsContent value={value} className={cn('min-h-[220px] focus-visible:outline-none', className)}>
      {isEmpty ? (
        <TabPanelEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          actionHref={emptyActionHref}
          onAction={emptyOnAction}
        />
      ) : (
        children
      )}
    </TabsContent>
  );
}
