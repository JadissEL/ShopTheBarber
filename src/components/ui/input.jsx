import * as React from "react"

import { cn } from "@/lib/utils"
import { stb } from "@/lib/stbUi"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-foreground/10 bg-card px-3 py-1 text-base text-foreground transition-colors duration-normal ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-sm",
      stb.focusRing,
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
