import * as React from "react"

import { cn } from "@/lib/utils"
import { stb } from "@/lib/stbUi"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[60px] w-full rounded-lg border border-foreground/10 bg-card px-3 py-2 text-base text-foreground transition-colors duration-normal ease-out placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-sans normal-case",
      stb.focusRing,
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
