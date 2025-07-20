import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 md:text-sm",
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
        default: "h-12 px-4 py-3",
        sm: "h-10 px-3 py-2 text-sm",
        lg: "h-14 px-6 py-4 text-lg",
        xl: "h-16 px-8 py-5 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", size = "default", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 moroccan-input focus:outline-none focus-visible:ring-2 focus-visible:ring-moroccan-gold",
          // 🎨 Moroccan Premium Variants
          variant === "premium" && "border-moroccan-gold/50 bg-moroccan-charcoal/50 text-moroccan-offwhite placeholder:text-moroccan-offwhite/60 focus:border-moroccan-gold focus:bg-moroccan-charcoal shadow-moroccan transition-all duration-300",
          variant === "outline" && "border-2 border-moroccan-gold/30 bg-transparent text-moroccan-offwhite placeholder:text-moroccan-offwhite/60 focus:border-moroccan-gold focus:bg-moroccan-gold/5 shadow-moroccan transition-all duration-300",
          variant === "filled" && "border-0 bg-moroccan-charcoal/80 text-moroccan-offwhite placeholder:text-moroccan-offwhite/60 focus:bg-moroccan-charcoal shadow-moroccan transition-all duration-300",
          variant === "default" && "border-moroccan-darkgrey/50 bg-moroccan-charcoal/30 text-moroccan-offwhite placeholder:text-moroccan-offwhite/60 focus:border-moroccan-gold focus:bg-moroccan-charcoal/50 shadow-moroccan transition-all duration-300",
          // 🎨 Size Variants
          size === "sm" && "h-9 px-2 text-sm",
          size === "default" && "h-10 px-3 text-sm",
          size === "lg" && "h-12 px-4 text-base",
          size === "xl" && "h-14 px-6 text-lg font-medium",
          className,
          // transition-all duration-200 focus:shadow-lg focus:border-moroccan-gold hover:border-moroccan-gold active:scale-98
        )}
        ref={ref}
        {...props}
        tabIndex={0}
        aria-label={props['aria-label'] || 'Champ de saisie'}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
