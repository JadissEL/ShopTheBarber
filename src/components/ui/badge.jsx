import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { stb } from "@/lib/stbUi"

const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-normal ease-out",
    stb.focusRing
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-foreground/10",
        vip: "border-transparent bg-vip text-vip-foreground hover:bg-vip/90",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }