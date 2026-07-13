import * as React from "react";

import { cn } from "@/shared/utils/utils";

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.35)] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
