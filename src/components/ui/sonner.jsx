import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-lg group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-foreground/10 group-[.toaster]:shadow-lg group-[.toaster]:font-sans",
          title: "group-[.toast]:font-semibold group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-sans",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-sans",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toaster]:rounded-lg group-[.toast]:font-sans",
          error: "group-[.toast]:border-destructive/30 group-[.toast]:bg-destructive/5",
          success: "group-[.toast]:border-primary/30 group-[.toast]:bg-primary/5",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
