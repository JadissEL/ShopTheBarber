import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-none md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input hover:border-moroccan-green/50 focus-visible:border-moroccan-green focus-visible:ring-moroccan-green/20",
        premium: "border-moroccan-gold/30 bg-moroccan-cream/5 hover:border-moroccan-gold/60 focus-visible:border-moroccan-gold focus-visible:ring-moroccan-gold/20 shadow-moroccan",
        outline: "border-2 border-moroccan-green/30 bg-transparent hover:border-moroccan-green/60 focus-visible:border-moroccan-green focus-visible:ring-moroccan-green/20",
        filled: "border-transparent bg-moroccan-charcoal/5 hover:bg-moroccan-charcoal/10 focus-visible:bg-moroccan-charcoal/10 focus-visible:ring-moroccan-green/20",
        error: "border-red-500 bg-red-50/50 hover:border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/20",
      },
      size: {
        default: "min-h-[120px] px-4 py-3",
        sm: "min-h-[80px] px-3 py-2 text-sm",
        lg: "min-h-[160px] px-6 py-4 text-lg",
        xl: "min-h-[200px] px-8 py-5 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ variant: error ? "error" : variant, size }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
