import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from '@/components/utils';
import { getOptimizedUnsplashUrl } from '@/components/ui/optimized-image';

export function UserAvatar({ src, name, fallback, className, ...props }) {
  const initials = fallback || (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '');
  const rawSrc = typeof src === 'string' && src.trim() && !src.startsWith('data:;') ? src : null;
  const optimizedSrc = rawSrc ? getOptimizedUnsplashUrl(rawSrc, 100, 80) : null;

  return (
    <Avatar className={cn("h-10 w-10", className)} {...props}>
      {optimizedSrc ? <AvatarImage src={optimizedSrc} alt={name || "Avatar"} className="object-cover" /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}