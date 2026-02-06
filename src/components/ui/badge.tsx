import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#7C2D36]/10 text-[#7C2D36]",
        secondary: "bg-[#F5F1EB] text-[#6B7280]",
        outline: "border border-[#E5E1DB] text-[#6B7280]",
        score: "bg-gradient-to-r from-[#D4A847] to-[#FBBF24] text-[#3A0F18] font-bold shadow-sm",
        success: "bg-emerald-50 text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
