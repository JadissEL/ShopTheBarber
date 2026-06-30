import { Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ShopServiceBadge({ className = '' }) {
    return (
        <Badge variant="outline" className={`text-foreground border-foreground/20 bg-muted/50 gap-1 ${className}`}>
            <Store className="w-3 h-3" />
            In-shop
        </Badge>
    );
}
