import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.5px]",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--color-brand)] text-white",
        secondary:
          "bg-[color:var(--color-surface)] text-[color:var(--color-muted)] border-[color:var(--color-border)]",
        outline:
          "border-[color:var(--color-border)] text-[color:var(--color-muted)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
