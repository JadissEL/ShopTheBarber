import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { stb } from "@/lib/stbUi"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold text-foreground transition-all duration-normal ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    stb.focusRing
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-foreground/10 bg-card text-foreground hover:bg-muted shadow-sm",
        secondary:
          "bg-[hsl(var(--navy))] text-white hover:bg-[hsl(var(--navy))]/90 shadow-sm",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
