"use client";

import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  variant?: "glass" | "solid";
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, id, icon, rightIcon, onRightIconClick, variant = "solid", ...props }, ref) => {
    const isGlass = variant === "glass";
    const baseClasses = isGlass
      ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-green-500/50 focus:border-green-500/30"
      : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-green-500/50 focus:border-green-400";

    const labelClasses = isGlass ? "text-white/70" : "text-gray-700";
    const iconColorClass = isGlass ? "text-white/40" : "text-gray-400";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn("block text-sm font-medium mb-2", labelClasses)}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className={cn("absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none", iconColorClass)}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl",
              icon && "pl-10",
              rightIcon && "pr-10",
              baseClasses,
              "focus:outline-none focus:ring-2",
              "transition-all duration-200",
              error && "border-red-500/50 focus:ring-red-500/50",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                iconColorClass,
                "hover:opacity-80 transition-opacity cursor-pointer"
              )}
              tabIndex={-1}
            >
              {rightIcon}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export { GlassInput };
