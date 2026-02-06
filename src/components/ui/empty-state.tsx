import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-[#E5E1DB] bg-[#FDFBF7] p-12 text-center",
        className
      )}
    >
      {icon && <div className="text-[#7C2D36]">{icon}</div>}

      <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>

      {description && (
        <p className="max-w-sm text-sm text-[#6B7280]">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-[#7C2D36] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9B3A44] active:bg-[#5F232A]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
