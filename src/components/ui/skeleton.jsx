import { cn } from "@/lib/utils";
import { stb } from "@/lib/stbUi";

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn(stb.skeleton, className)}
      {...props}
    />
  );
}

export { Skeleton };
