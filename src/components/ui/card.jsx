import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn(stb.surface, className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn(stb.uiHeading, "text-lg", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn(stb.body, className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
