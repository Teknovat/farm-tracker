import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth = false, ...props }, ref) => {
    return (
      <div className={clsx("space-y-1", { "w-full": fullWidth })}>
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <input
          className={clsx(
            // Base styles - mobile-first with large touch targets
            "block rounded-lg border border-gray-300 px-4 py-3",
            "text-base placeholder-gray-400",
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "disabled:bg-gray-50 disabled:text-gray-500",
            "min-h-[44px]", // Minimum 44px for mobile touch targets

            // Error state
            {
              "border-red-300 focus:border-red-500 focus:ring-red-500": error,
            },

            // Full width
            {
              "w-full": fullWidth,
            },

            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
