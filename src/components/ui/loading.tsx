import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        inline: "",
        fullscreen: "fixed inset-0 bg-black/50 z-50 backdrop-blur-sm",
        page: "flex items-center justify-center min-h-screen bg-[#FDFBF7]",
      },
    },
    defaultVariants: {
      variant: "inline",
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  label?: string;
}

function Loading({ variant = "inline", label, className, ...props }: LoadingProps) {
  const spinnerContent = (
    <>
      <svg
        className="h-8 w-8 animate-spin text-[#7C2D36]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className="ml-2 text-sm font-medium text-[#7C2D36]">{label}</span>}
    </>
  );

  if (variant === "fullscreen") {
    return (
      <div className={cn(loadingVariants({ variant }), className)} {...props}>
        <div className="flex flex-col items-center gap-3 bg-white rounded-lg p-8 shadow-lg">
          {spinnerContent}
        </div>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className={cn(loadingVariants({ variant }), className)} {...props}>
        <div className="flex flex-col items-center gap-3">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(loadingVariants({ variant }), className)} {...props}>
      {spinnerContent}
    </div>
  );
}

export { Loading, loadingVariants };
