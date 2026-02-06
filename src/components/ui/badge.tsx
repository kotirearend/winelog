import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-[#7C2D36] text-white hover:bg-[#9B3A44]",
        secondary: "border border-transparent bg-[#E5E1DB] text-[#1A1A1A] hover:bg-[#D5CFC4]",
        outline: "border border-[#E5E1DB] text-[#1A1A1A] hover:bg-[#FDFBF7]",
        score: "border border-transparent bg-[#D4A847] text-white hover:bg-[#E0B856]",
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
