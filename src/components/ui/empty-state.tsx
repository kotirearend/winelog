import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {icon && (
        <div className="w-20 h-20 rounded-full bg-[#FDF2F4] flex items-center justify-center mb-5 text-[#7C2D36]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B7280] max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
